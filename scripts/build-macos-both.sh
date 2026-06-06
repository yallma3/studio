#!/bin/bash

# Exit on error
set -e

CONFIG="src-tauri/tauri.conf.json"
PRODUCT_NAME=$(jq -r '.productName' "$CONFIG" | tr '[:upper:]' '[:lower:]')
VERSION=$(jq -r '.version' "$CONFIG")

echo "Building macOS app for both Intel and Apple Silicon architectures..."
echo "Product: $PRODUCT_NAME, Version: $VERSION"

# Ensure the required Rust targets are installed
rustup target add x86_64-apple-darwin aarch64-apple-darwin

# Build for Intel x86_64
echo "Building for Intel (x86_64)..."
RUST_TARGET=x86_64-apple-darwin yarn tauri-build --target x86_64-apple-darwin

# Build for Apple Silicon (aarch64)
echo "Building for Apple Silicon (aarch64)..."
RUST_TARGET=aarch64-apple-darwin yarn tauri-build --target aarch64-apple-darwin

# Path to the app bundles (Tauri normalizes productName to kebab-case in filenames)
INTEL_DMG="src-tauri/target/x86_64-apple-darwin/release/bundle/dmg/${PRODUCT_NAME}_${VERSION}_x64.dmg"
ARM_DMG="src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/${PRODUCT_NAME}_${VERSION}_aarch64.dmg"

# Copy DMGs to a more accessible location
mkdir -p release
cp "$INTEL_DMG" "release/${PRODUCT_NAME}_${VERSION}_Intel.dmg"
cp "$ARM_DMG" "release/${PRODUCT_NAME}_${VERSION}_AppleSilicon.dmg"

echo "---------------------------------------------"
echo "Build completed successfully!"
echo "---------------------------------------------"
echo "Two separate DMG files have been created:"
echo ""
echo "For Intel Macs: release/${PRODUCT_NAME}_${VERSION}_Intel.dmg"
echo "For Apple Silicon Macs (M1/M2/M3): release/${PRODUCT_NAME}_${VERSION}_AppleSilicon.dmg"
echo ""
echo "Distribution instructions:"
echo "1. Provide both DMG files to your users"
echo "2. Users should download the appropriate version for their Mac:"
echo "   - Intel-based Macs: Use the Intel DMG"
echo "   - Apple Silicon Macs (M1/M2/M3): Use the Apple Silicon DMG"
echo "---------------------------------------------" 