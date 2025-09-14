#!/bin/bash
set -e
echo "Building Windows bundles with yaLLMa3API sidecar..."
cd yaLLMa3API && npm run pkg && cd ..
yarn tauri-build --target x86_64-pc-windows-msvc
mkdir -p release
cp src-tauri/target/x86_64-pc-windows-msvc/release/bundle/msi/*.msi release/
echo "Windows builds completed."