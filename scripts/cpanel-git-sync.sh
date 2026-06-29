#!/bin/bash
# cPanel Git "fast-forward" hatası sonrası sunucuyu GitHub ile hizalar.
# Kullanım: cPanel Terminal'de repo klasöründe: bash scripts/cpanel-git-sync.sh

set -e

BRANCH="${1:-main}"

echo "Dal: $BRANCH"
git fetch origin
git reset --hard "origin/$BRANCH"
echo "Tamam. cPanel Git Version Control'den 'Deploy HEAD Commit' yapın."
