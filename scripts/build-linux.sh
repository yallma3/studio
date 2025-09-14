#!/bin/bash
set -e
echo "Building Linux bundles with yaLLMa3API sidecar..."
cd yaLLMa3API && npm run pkg && cd ..
yarn tauri-build --target x86_64-unknown-linux-gnu
mkdir -p release
cp src-tauri/target/x86_64-unknown-linux-gnu/release/bundle/appimage/*.AppImage release/
echo "Linux builds completed."