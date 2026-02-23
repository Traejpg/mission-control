#!/bin/bash
# Sync memory files to Railway persistent storage
# Uses Railway's CLI to upload files to the volume

set -e

SOURCE_DIR="/Users/assistattrae/.openclaw/workspace/memory"
RAILWAY_PATH="/data/memory"

echo "📤 Syncing memory files to Railway..."
echo "Source: $SOURCE_DIR"
echo "Destination: $RAILWAY_PATH"
echo ""

# Check Railway login
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged in. Run: railway login"
    exit 1
fi

# Get list of memory files
echo "📁 Files to sync:"
ls -1 "$SOURCE_DIR"/*.md 2>/dev/null | while read f; do
    echo "   - $(basename "$f")"
done
echo ""

# Upload each file
for file in "$SOURCE_DIR"/*.md; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        echo "⬆️  Uploading $filename..."
        
        # Use railway CLI to copy file to volume
        railway run -- tee "$RAILWAY_PATH/$filename" < "$file" || echo "   ⚠️ Failed to upload $filename"
    fi
done

echo ""
echo "✅ Sync complete!"
echo ""
echo "To verify files are persisted:"
echo "  railway run -- ls -la $RAILWAY_PATH"
