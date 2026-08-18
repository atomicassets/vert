#!/usr/bin/env bash
# Check what the published tarball ships. Runs npm pack --dry-run at the
# repository root and asserts the file list: the compiled entry, its type
# declarations, the README, the license, the manifest, no spec file anywhere,
# and no path outside the expected dist, src, README.md, LICENSE, and
# package.json set.
#
# Usage: bash scripts/packaging.test.sh
#
# prepack builds dist, so run this where the dependencies are installed. The
# script installs nothing itself.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

CASES=0
PASSED=0

ok() {
    CASES=$((CASES + 1))
    PASSED=$((PASSED + 1))
    printf 'ok %s %s\n' "$CASES" "$1"
}

no() {
    CASES=$((CASES + 1))
    printf 'not ok %s %s\n    %s\n' "$CASES" "$1" "$2"
}

# npm prints the file list as JSON on stdout and its notices on stderr, so node
# reads the paths out of the JSON rather than the human-readable listing.
LIST="$(npm pack --dry-run --json | node -e '
let raw = "";
process.stdin.on("data", (chunk) => (raw += chunk));
process.stdin.on("end", () => {
    for (const file of JSON.parse(raw)[0].files) console.log(file.path);
});
')"

if [ -n "$LIST" ]; then
    ok "npm pack --dry-run lists $(printf '%s\n' "$LIST" | wc -l | tr -d ' ') files"
else
    no "npm pack --dry-run lists files" "the file list is empty"
fi

for want in dist/index.js dist/index.d.ts README.md LICENSE package.json; do
    if printf '%s\n' "$LIST" | grep -qxF "$want"; then
        ok "the tarball ships $want"
    else
        no "the tarball ships $want" "$want is missing from the file list"
    fi
done

# tsconfig.json excludes the specs from the build and files excludes
# src/**/tests, so no spec file, compiled or source, should reach the tarball.
SPECS="$(printf '%s\n' "$LIST" | grep '\.spec\.' || true)"
if [ -z "$SPECS" ]; then
    ok "the tarball ships no spec file"
else
    no "the tarball ships no spec file" "$(printf '%s' "$SPECS" | tr '\n' ' ')"
fi

# Everything else in the list should fall under dist or src, or be one of the
# three top-level files; anything left over is a files mistake.
UNEXPECTED="$(printf '%s\n' "$LIST" | grep -vE '^(dist/|src/)' | grep -vxF -e README.md -e LICENSE -e package.json || true)"
if [ -z "$UNEXPECTED" ]; then
    ok "the tarball ships nothing outside dist, src, README.md, LICENSE, and package.json"
else
    no "the tarball ships nothing outside dist, src, README.md, LICENSE, and package.json" "$(printf '%s' "$UNEXPECTED" | tr '\n' ' ')"
fi

printf 'passed %s/%s\n' "$PASSED" "$CASES"
[ "$PASSED" -eq "$CASES" ]
