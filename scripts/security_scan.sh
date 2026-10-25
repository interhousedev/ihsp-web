#!/usr/bin/env bash
# Run the security scanners of .github/workflows/{security,codeql}.yml locally, one after another.
#
#   scripts/security_scan.sh [SCANNER...] [--no-history]
#
# Scanners (default: all, in this order):
#   gitleaks      secrets in the whole git history (gitleaks git)          docker, pinned by digest
#   trivy-fs      vulnerabilities, secrets, misconfigurations (fixable HIGH/CRITICAL fail)   docker
#   trivy-config  Dockerfiles and compose files (HIGH/CRITICAL fail)       docker
#   semgrep       p/ci, p/typescript, p/react, p/nextjs, p/secrets, p/github-actions (ERROR fails)  docker
#   osv-scanner   bun.lock against OSV.dev                                 docker
#   bun-audit     `bun audit` of the workspace (high and critical fail)    local bun
#   codeql        javascript-security-extended (security-severity >= 7 fails)  local CodeQL CLI; skipped if absent
#
#   --no-history  gitleaks scans the working tree only, not every commit
#
# Reports go to reports/security/ (git-ignored): one machine-readable file (SARIF or JSON) and one log per
# scanner. The scanners run sequentially (Docker has little memory); every scanner runs even when an earlier
# one fails. The exit code is non-zero when any scanner reports findings or cannot run.
# Accepted findings: .trivyignore (Trivy), .gitleaksignore (gitleaks fingerprints), // nosemgrep (semgrep).
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT" || exit 1
OUT="$ROOT/reports/security"
mkdir -p "$OUT"

# Scanner images, pinned by digest (update together with the versions in security.yml).
GITLEAKS_IMAGE="zricethezav/gitleaks:v8.30.1@sha256:c00b6bd0aeb3071cbcb79009cb16a60dd9e0a7c60e2be9ab65d25e6bc8abbb7f"
TRIVY_IMAGE="aquasec/trivy:0.76.1@sha256:790fd66d1697395d8693d1acaa1ea702406a20f109b6fc7bac8db623eca6c06c"
SEMGREP_IMAGE="semgrep/semgrep:1.182.0@sha256:4a34048c04fef049f71665047f074cffb00cc3d89482f965a5cd151d589237af"
OSV_IMAGE="ghcr.io/google/osv-scanner:v2.7.0@sha256:4f3b7e2c64b9d38a5febc5a7e4a3dfef1d1362f726dea7a2ef4762b46469fcd0"
SEMGREP_CONFIGS=(--config p/ci --config p/typescript --config p/react --config p/nextjs --config p/secrets
  --config p/github-actions)
# Never scanned: installed packages, build output, reports and local env files (bun.lock covers the packages).
TRIVY_SKIP=(--skip-dirs node_modules --skip-dirs '**/node_modules' --skip-dirs '**/.next' --skip-dirs '**/out'
  --skip-dirs reports --skip-dirs e2e/.report --skip-files '**/.env.local' --skip-files .env.prod)

usage() { sed -n '2,/^set -uo/{/^set -uo/d;s/^# \{0,1\}//;p;}' "${BASH_SOURCE[0]}"; }

ALL=(gitleaks trivy-fs trivy-config semgrep osv-scanner bun-audit codeql)
SCANNERS=() HISTORY=1
for a in "$@"; do
  case "$a" in
    -h|--help) usage; exit 0 ;;
    --no-history) HISTORY=0 ;;
    gitleaks|trivy-fs|trivy-config|semgrep|osv-scanner|bun-audit|codeql) SCANNERS+=("$a") ;;
    *) echo "unknown scanner or option '$a' (see --help)" >&2; exit 2 ;;
  esac
done
[[ ${#SCANNERS[@]} -gt 0 ]] || SCANNERS=("${ALL[@]}")

need() { command -v "$1" >/dev/null || { echo "missing tool: $1 ($2)"; return 3; }; }
need jq "brew install jq" || exit 3
# count <jq filter> <file>: number of findings in a report (0 when the file is missing or unreadable).
count() { [[ -s "$2" ]] && jq "$1" "$2" 2>/dev/null || echo 0; }
docker_run() {
  docker run --rm --quiet --memory 3g -v "$ROOT:/src:ro" -v "$OUT:/out" -w /src \
    -e GIT_CONFIG_COUNT=1 -e GIT_CONFIG_KEY_0=safe.directory -e GIT_CONFIG_VALUE_0='*' "$@"
}

FINDINGS=""
# Each scanner writes its report, sets FINDINGS (a short text for the summary) and returns 0 when clean,
# 1 on findings, >1 when it could not run. 99 means skipped.
scan_gitleaks() {
  local mode=(git --log-opts=--all)
  [[ $HISTORY -eq 1 ]] || mode=(dir)
  docker_run "$GITLEAKS_IMAGE" "${mode[@]}" --config /src/.gitleaks.toml --redact --no-banner --exit-code 0 \
    --report-format sarif --report-path /out/gitleaks.sarif /src || return 2
  local n; n=$(count '[.runs[].results[]] | length' "$OUT/gitleaks.sarif")
  FINDINGS="$n secrets"; [[ $n -eq 0 ]]
}
TRIVY_COUNT='[.Results[]? | (.Vulnerabilities // []), (.Secrets // []), (.Misconfigurations // []) | .[]] | length'
scan_trivy_fs() {
  docker volume create ihsp-web-trivy-cache >/dev/null
  docker_run -v ihsp-web-trivy-cache:/root/.cache/trivy "$TRIVY_IMAGE" fs --quiet \
    --scanners vuln,secret,misconfig --severity HIGH,CRITICAL --ignore-unfixed \
    --ignorefile .trivyignore "${TRIVY_SKIP[@]}" --format json --output /out/trivy-fs.json . || return 2
  docker_run -v ihsp-web-trivy-cache:/root/.cache/trivy "$TRIVY_IMAGE" convert --format table /out/trivy-fs.json
  local n; n=$(count "$TRIVY_COUNT" "$OUT/trivy-fs.json")
  FINDINGS="$n fixable HIGH/CRITICAL"; [[ $n -eq 0 ]]
}
scan_trivy_config() {
  docker volume create ihsp-web-trivy-cache >/dev/null
  docker_run -v ihsp-web-trivy-cache:/root/.cache/trivy "$TRIVY_IMAGE" config --quiet \
    --severity HIGH,CRITICAL --ignorefile .trivyignore "${TRIVY_SKIP[@]}" \
    --format json --output /out/trivy-config.json . || return 2
  docker_run -v ihsp-web-trivy-cache:/root/.cache/trivy "$TRIVY_IMAGE" convert --format table /out/trivy-config.json
  local n; n=$(count "$TRIVY_COUNT" "$OUT/trivy-config.json")
  FINDINGS="$n HIGH/CRITICAL"; [[ $n -eq 0 ]]
}
scan_semgrep() {
  docker_run -e SEMGREP_SEND_METRICS=off "$SEMGREP_IMAGE" semgrep scan --metrics=off --quiet \
    "${SEMGREP_CONFIGS[@]}" --exclude reports --exclude node_modules --exclude .next --exclude out \
    --sarif-output=/out/semgrep.sarif --json-output=/out/semgrep.json || return 2
  local all err
  all=$(count '.results | length' "$OUT/semgrep.json")
  err=$(count '[.results[] | select(.extra.severity == "ERROR")] | length' "$OUT/semgrep.json")
  jq -r '.results[] | "\(.extra.severity)\t\(.path):\(.start.line)\t\(.check_id)"' "$OUT/semgrep.json" 2>/dev/null
  FINDINGS="$err ERROR, $all total"; [[ $err -eq 0 ]]
}
scan_osv_scanner() {
  docker_run "$OSV_IMAGE" scan source --config=/src/osv-scanner.toml --lockfile=/src/bun.lock \
    --format json --output-file /out/osv-scanner.json
  local rc=$? n
  [[ $rc -le 1 ]] || return 2
  n=$(count '[.results[]?.packages[]?.vulnerabilities[]?] | length' "$OUT/osv-scanner.json")
  jq -r '.results[]?.packages[]? | "\(.package.name) \(.package.version): \([.vulnerabilities[].id] | join(", "))"' \
    "$OUT/osv-scanner.json" 2>/dev/null
  FINDINGS="$n advisories"; [[ $n -eq 0 ]]
}
scan_bun_audit() {
  need bun "brew install oven-sh/bun/bun" || return 3
  [[ -d node_modules ]] || bun install --frozen-lockfile --ignore-scripts || return 2
  bun audit --json >"$OUT/bun-audit.json"
  bun audit --audit-level=high
  local rc=$? all blocking=0 waived=0 pkg url sev ghsa expiry today
  all=$(count '[.[] | .[]?] | length' "$OUT/bun-audit.json")
  today=$(date -u +%F)
  # bun audit has no ignore setting: a high advisory listed in the reviewed allowlist (dev-only, with a date) is a
  # warning until that date; an unlisted or expired one blocks.
  while IFS=$'\t' read -r pkg url sev; do
    ghsa=${url##*/}
    expiry=$(awk -F'\t' -v g="$ghsa" -v p="$pkg" '!/^#/ && $1==g && $2==p {print $3; exit}' "$ROOT/scripts/bun-audit-dev-allowlist.txt")
    if [[ -n $expiry && ! $expiry < $today ]]; then
      waived=$((waived + 1))
      echo "WARN $sev $pkg $ghsa: dev-only, allowlisted until $expiry"
    else
      blocking=$((blocking + 1))
      echo "FAIL $sev $pkg $ghsa: $url"
    fi
  done < <(jq -r 'to_entries[] | .key as $pkg | .value[]? | select(.severity == "high" or .severity == "critical")
    | [$pkg, (.url // ""), .severity] | @tsv' "$OUT/bun-audit.json")
  FINDINGS="$blocking high/critical, $waived dev-only warning, $all total"
  [[ $blocking -gt 0 ]] && return 1
  [[ $rc -eq 0 || $waived -gt 0 ]] && return 0
  return 2
}
CODEQL_SEV='([.tool.driver.rules[]?, .tool.extensions[]?.rules[]?] | map({key: .id, value: ((.properties["security-severity"] // "0") | tonumber)}) | from_entries)'
scan_codeql() {
  command -v codeql >/dev/null || { FINDINGS="CodeQL CLI not installed (brew install codeql); CI runs it"; return 99; }
  # The database lives outside the source root, or CodeQL would index its own copy of the sources.
  local db; db="$(mktemp -d "${TMPDIR:-/tmp}/codeql-db.XXXXXX")"
  codeql database create "$db" --language=javascript-typescript --build-mode=none --source-root="$ROOT" \
    --codescanning-config="$ROOT/.github/codeql/codeql-config.yml" --ram=3072 --threads=2 --overwrite --quiet || return 2
  codeql database analyze "$db" codeql/javascript-queries:codeql-suites/javascript-security-extended.qls \
    --download --ram=3072 --threads=2 --format=sarif-latest --output="$OUT/codeql.sarif" --quiet || return 2
  rm -rf "$db"
  # Reviewed false positives (.github/codeql/reviewed-alerts.tsv) are skipped only in the file they were reviewed in.
  local skip; skip=$(grep -v '^#' "$ROOT/.github/codeql/reviewed-alerts.tsv" | jq -R 'split("\t")' | jq -s -c .)
  jq --argjson skip "$skip" '.runs[].results |= map(select([.ruleId, .locations[0].physicalLocation.artifactLocation.uri] as $k | ($skip | index([$k])) | not))' \
    "$OUT/codeql.sarif" >"$OUT/codeql.filtered" && mv "$OUT/codeql.filtered" "$OUT/codeql.sarif" || return 2
  local all err
  all=$(count '[.runs[].results[]] | length' "$OUT/codeql.sarif")
  # High and critical as code scanning shows them: security-severity >= 7.0 of the rule.
  err=$(count "[.runs[] | $CODEQL_SEV as \$sev | .results[] | select((\$sev[.ruleId] // 0) >= 7)] | length" \
    "$OUT/codeql.sarif")
  jq -r ".runs[] | $CODEQL_SEV as \$sev | .results[] | [(\$sev[.ruleId] // 0 | tostring),
    \"\\(.locations[0].physicalLocation.artifactLocation.uri):\\(.locations[0].physicalLocation.region.startLine)\",
    .ruleId] | join(\"\\t\")" "$OUT/codeql.sarif" 2>/dev/null
  FINDINGS="$err high/critical, $all total"; [[ $err -eq 0 ]]
}

need docker "https://docs.docker.com/get-docker/" || exit 3
ROWS=() FAILED=0
echo "Security scan of $ROOT -> reports/security/"
for s in "${SCANNERS[@]}"; do
  printf '  %-14s' "$s"
  FINDINGS="" start=$(date +%s)
  "scan_${s//-/_}" >"$OUT/$s.log" 2>&1
  rc=$?
  took=$(( $(date +%s) - start ))
  case $rc in
    0) status=PASS ;;
    1) status=FAIL; FAILED=1 ;;
    99) status=SKIP ;;
    *) status=ERROR; FAILED=1; FINDINGS="could not run (exit $rc), see the log" ;;
  esac
  echo "$status (${took}s) ${FINDINGS}"
  ROWS+=("$(printf '%-14s %-6s %-40s reports/security/%s.log' "$s" "$status" "$FINDINGS" "$s")")
done

{
  echo
  printf '%-14s %-6s %-40s %s\n' SCANNER STATUS FINDINGS DETAILS
  printf '%s\n' "${ROWS[@]}"
} | tee "$OUT/summary.txt"
exit $FAILED
