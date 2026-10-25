#!/usr/bin/env bash
# Build the web image (all seven apps behind nginx) for a version and architecture and push it to GHCR.
#
# Usage: scripts/image_push.sh <version> [--arch amd64|arm64|all] [--owner OWNER] [--latest] [--load] [--skip-apps]
#   <version>    the image tag, e.g. 1.2.0; use the same version for iht-backend's
#                scripts/image_push.sh, then deploy with scripts/cloud_deploy.sh <ssh-host> --tag <version>
#   --arch       amd64 (default, x86 servers), arm64, or all (both in one manifest)
#   --owner      the GHCR namespace (default: interhousedev, or IMAGE_OWNER from the environment)
#   --latest     also move the `latest` tag to this build
#   --load       build one architecture into the local Docker instead of pushing
#   --skip-apps  reuse apps/*/out from the last host build instead of building the apps again
#
# The apps are built on the host one at a time (as CI does) and packed by deploy/Dockerfile.prebuilt;
# the static files are the same for every architecture, only the nginx base image differs. The
# installable app's version (NEXT_PUBLIC_APP_VERSION) is <version> when it looks like x.y.z, else 1.0.0.
# Needs bun, and `docker login ghcr.io` with a token that may write packages.
set -euo pipefail
cd "$(dirname "$0")/.."

version=
arch=amd64
owner=${IMAGE_OWNER:-interhousedev}
latest=0
load=0
skip_apps=0
while [ $# -gt 0 ]; do
    case "$1" in
        --arch) arch=${2:?--arch needs a value}; shift 2 ;;
        --owner) owner=${2:?--owner needs a value}; shift 2 ;;
        --latest) latest=1; shift ;;
        --load) load=1; shift ;;
        --skip-apps) skip_apps=1; shift ;;
        -h | --help) sed -n '2,19p' "$0"; exit 0 ;;
        -*) echo "unknown argument: $1" >&2; exit 2 ;;
        *) version=$1; shift ;;
    esac
done
[ -n "$version" ] || { echo "usage: scripts/image_push.sh <version> [--arch amd64|arm64|all] [--owner OWNER] [--latest] [--load] [--skip-apps]" >&2; exit 2; }
case "$version" in *[!A-Za-z0-9._-]*) echo "invalid version: $version" >&2; exit 2 ;; esac
case "$arch" in
    amd64 | arm64) platforms=linux/$arch ;;
    all) platforms=linux/amd64,linux/arm64 ;;
    *) echo "unknown --arch: $arch (amd64, arm64 or all)" >&2; exit 2 ;;
esac
if [ "$load" -eq 1 ] && [ "$arch" = all ]; then
    echo "--load builds one architecture; pick --arch amd64 or arm64" >&2
    exit 2
fi

image=ghcr.io/$owner/ihsp-web
revision=$(git rev-parse HEAD)
tags=(-t "$image:$version")
if [ -z "$(git status --porcelain)" ]; then
    tags+=(-t "$image:sha-$revision")
else
    echo "warning: uncommitted changes are in the build; no sha-<commit> tag" >&2
fi
[ "$latest" -eq 1 ] && tags+=(-t "$image:latest")

if [ "$skip_apps" -eq 0 ]; then
    case "$version" in
        [0-9]*.[0-9]*.[0-9]*) app_version=$version ;;
        *) app_version=1.0.0 ;;
    esac
    [ -d node_modules ] || bun install --frozen-lockfile
    for app in id sp staff admin lms share library; do
        echo "==> building $app (app version $app_version)"
        NEXT_TELEMETRY_DISABLED=1 NEXT_PUBLIC_APP_VERSION=$app_version bun run --filter "./apps/$app" build > /dev/null
    done
    echo "==> per-page script policy (CSP meta)"
    bun deploy/csp-hash.ts > /dev/null
fi

# A docker-container builder can build other architectures and push multi-platform manifests.
builder=ihsp
docker buildx inspect "$builder" > /dev/null 2>&1 || docker buildx create --name "$builder" --driver docker-container > /dev/null

output=--push
[ "$load" -eq 1 ] && output=--load

echo "==> $image:$version ($platforms) from $revision"
docker buildx build --builder "$builder" --platform "$platforms" \
    -f deploy/Dockerfile.prebuilt "${tags[@]}" "$output" .

if [ "$load" -eq 0 ]; then
    docker buildx imagetools inspect "$image:$version" | sed -n '1,3p'
    echo "==> pushed $image:$version"
fi
