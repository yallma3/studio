#!/bin/bash

# Exit on error
set -e

echo "Building macOS app for both Intel and Apple Silicon architectures..."

cd yaLLMa3API && npm run pkg && cd ..

# Ensure the required Rust targets are installed
rustup target add x86_64-apple-darwin

# Build for Intel x86_64
echo "Building for Intel (x86_64)..."
RUST_TARGET=x86_64-apple-darwin yarn tauri-build --target x86_64-apple-darwin

# Path to the app bundle
INTEL_DMG="src-tauri/target/x86_64-apple-darwin/release/bundle/dmg/yaLLMa3 Studio_0.1.0_x64.dmg"

# Copy DMG to a more accessible location
mkdir -p release
cp "$INTEL_DMG" "release/yaLLMa3_Studio_0.1.0_Intel.dmg"

echo "---------------------------------------------"
echo "Build completed successfully!"
echo "---------------------------------------------"
echo "DMG file created:"
echo ""
echo "For Intel Macs: release/yaLLMa3_Studio_0.1.0_Intel.dmg"
echo ""
echo "Distribution instructions:"
echo "1. Provide the DMG file to your users"
echo "2. Users should download the Intel version for their Mac"
echo "---------------------------------------------" 