#!/bin/bash

# Script to package the built application for deployment using native zip
echo "📦 Starting packaging process..."

ZIP_FILE="build-package.zip"

# Remove existing zip if it exists
rm -f "$ZIP_FILE"

# Create a temporary list of files to include
FILES_TO_INCLUDE=(
  "package.json"
  "pnpm-workspace.yaml"
  "pnpm-lock.yaml"
  "production.config.js"
  ".env"
  "backend/package.json"
  "backend/dist"
  "frontend/package.json"
  "frontend/.next"
  "frontend/public"
)

echo "  - Compressing files..."

# Use zip -r to compress the files and directories
# -q for quiet, -r for recursive
zip -q -r "$ZIP_FILE" "${FILES_TO_INCLUDE[@]}"

if [ $? -eq 0 ]; then
  echo -e "\n✅ Packaging complete!"
  echo "📂 Output: $(pwd)/$ZIP_FILE"
  echo "📊 Size: $(du -h "$ZIP_FILE" | cut -f1)"
  echo "ℹ️ Note: node_modules are excluded. Run 'pnpm install' on your server."
else
  echo "❌ Packaging failed!"
  exit 1
fi
