#!/usr/bin/env nix-shell
#!nix-shell --pure -i bash --keep OWNER --keep NPM_TOKEN --keep GITHUB_TOKEN shell.nix
#shellcheck shell=bash
#
# Copyright 2022 The esbuild-plugin-stimulus Authors
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
# SPDX-License-Identifier: Apache-2.0

set -euo pipefail

if [[ -z "${OWNER:-}" ]]; then
  echo "OWNER not set" 1>&2
  exit 1
fi

NPM_TOKEN="${NPM_TOKEN:-XXXXX-XXXXX-XXXXX-XXXXX}"
GITHUB_TOKEN="${GITHUB_TOKEN:-GGGGG-GGGGG-GGGGG-GGGGG}"

NPM_CONFIG_USERCONFIG="$(mktemp)"
trap 'rm "$NPM_CONFIG_USERCONFIG"' EXIT
export NPM_CONFIG_USERCONFIG
{
  echo "registry=https://registry.npmjs.org/"
  echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN"
  echo "@${OWNER}:registry=https://npm.pkg.github.com/"
  echo "//npm.pkg.github.com/:_authToken=$GITHUB_TOKEN"
} >> "$NPM_CONFIG_USERCONFIG"

echo "** Building..." 1>&2
npm install
npm run build

echo "** Publishing to NPM..." 1>&2
npm publish "$@"

echo "** Publishing to GitHub Packages..." 1>&2
mv package.json package.json.bak
trap 'mv package.json.bak package.json ; rm "$NPM_CONFIG_USERCONFIG"' EXIT
scoped_name="@${OWNER}/esbuild-plugin-stimulus"
jq ".name = \"$scoped_name\"" package.json.bak > package.json

npm publish "$@"
