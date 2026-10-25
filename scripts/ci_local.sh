#!/usr/bin/env bash
# Run the CI checks locally, with the same commands as .github/workflows/{lint,test,security,codeql}.yml.
#
#   scripts/ci_local.sh [STAGE...] [--fast]
#
# Stages (default: lint test contract security):
#   lint       oxlint, oxfmt --check, typecheck of every workspace and of the e2e project
#   test       `bun run test` of every package and app, then the deploy tests (bun test deploy)
#   contract   the generated API client matches packages/api/openapi.json; contract:check
#   security   scripts/security_scan.sh (gitleaks, trivy, semgrep, osv-scanner, bun audit, CodeQL)
#
#   --fast     lint contract: what to run before every push
#
# Every stage runs even when an earlier one fails; the summary lists the failures and the exit code is
# non-zero if there were any. Logs: reports/ci-local/<stage>.log (git-ignored). Stages run one at a time.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT" || exit 1
LOGS="$ROOT/reports/ci-local"
mkdir -p "$LOGS"

usage() { sed -n '2,/^set -uo/{/^set -uo/d;s/^# \{0,1\}//;p;}' "${BASH_SOURCE[0]}"; }

STAGES=()
for a in "$@"; do
  case "$a" in
    -h|--help) usage; exit 0 ;;
    --fast) STAGES+=(lint contract) ;;
    lint|test|contract|security) STAGES+=("$a") ;;
    *) echo "unknown stage or option '$a' (see --help)" >&2; exit 2 ;;
  esac
done
[[ ${#STAGES[@]} -gt 0 ]] || STAGES=(lint test contract security)

RESULTS=() FAILED=0
# check <name> <cmd...>: run one check, log it, record PASS/FAIL.
check() {
  local name=$1 rc=0 start
  shift
  start=$(date +%s)
  printf '  %-10s' "$name"
  "$@" >"$LOGS/$name.log" 2>&1 || rc=$?
  local took=$(( $(date +%s) - start ))
  if [[ $rc -eq 0 ]]; then
    echo "ok (${took}s)"; RESULTS+=("PASS  $name")
  else
    echo "FAIL (exit $rc, ${took}s) -> reports/ci-local/$name.log"; RESULTS+=("FAIL  $name"); FAILED=1
  fi
}

install() { bun install --frozen-lockfile; }
stage_lint() {
  install && bun run lint && bunx oxfmt --check . && bun run --filter '*' typecheck && bun run e2e:typecheck
}
stage_test() {
  install || return 1
  local manifest dir rc=0
  for manifest in apps/*/package.json packages/*/package.json; do
    dir="$(dirname "$manifest")"
    if jq -e '.scripts.test' "$manifest" >/dev/null; then
      echo "== test $dir"
      (cd "$dir" && bun run test) || rc=1
    fi
  done
  if command -v shellcheck >/dev/null; then shellcheck --shell=sh deploy/entrypoint.sh || rc=1; fi
  bun test deploy || rc=1
  return $rc
}
stage_contract() {
  install && bun run gen:api && bun run gen:contract || return 1
  git diff --exit-code -- packages/api && test -z "$(git status --porcelain --untracked-files=all -- packages/api)" \
    && bun run contract:check
}
stage_security() { scripts/security_scan.sh; }

echo "CI (local) in $ROOT"
for s in "${STAGES[@]}"; do check "$s" "stage_$s"; done

echo
printf '%s\n' "${RESULTS[@]}"
[[ $FAILED -eq 0 ]] && echo "all stages passed" || echo "some stages failed (logs in reports/ci-local/)"
exit $FAILED
