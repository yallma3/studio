#!/bin/bash

# Exit on error
set -e

echo "Building macOS app for both Intel and Apple Silicon architectures..."

# Ensure the required Rust targets are installed
rustup target add x86_64-apple-darwin aarch64-apple-darwin

# Build for Intel x86_64
echo "Building for Intel (x86_64)..."
RUST_TARGET=x86_64-apple-darwin yarn tauri-build --target x86_64-apple-darwin

# Build for Apple Silicon (aarch64)
echo "Building for Apple Silicon (aarch64)..."
RUST_TARGET=aarch64-apple-darwin yarn tauri-build --target aarch64-apple-darwin

# Path to the app bundles
INTEL_DMG="src-tauri/target/x86_64-apple-darwin/release/bundle/dmg/yaLLMa3 Studio_0.1.0_x64.dmg"
ARM_DMG="src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/yaLLMa3 Studio_0.1.0_aarch64.dmg"

# Copy DMGs to a more accessible location
mkdir -p release
cp "$INTEL_DMG" "release/yaLLMa3_Studio_0.1.0_Intel.dmg"
cp "$ARM_DMG" "release/yaLLMa3_Studio_0.1.0_AppleSilicon.dmg"

echo "---------------------------------------------"
echo "Build completed successfully!"
echo "---------------------------------------------"
echo "Two separate DMG files have been created:"
echo ""
echo "For Intel Macs: release/yaLLMa3_Studio_0.1.0_Intel.dmg"
echo "For Apple Silicon Macs (M1/M2/M3): release/yaLLMa3_Studio_0.1.0_AppleSilicon.dmg"
echo ""
echo "Distribution instructions:"
echo "1. Provide both DMG files to your users"
echo "2. Users should download the appropriate version for their Mac:"
echo "   - Intel-based Macs: Use the Intel DMG"
echo "   - Apple Silicon Macs (M1/M2/M3): Use the Apple Silicon DMG"
echo "---------------------------------------------" 