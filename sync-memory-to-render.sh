#!/bin/bash
# Upload memory files to Render server

RENDER_URL="https://mission-control-v954.onrender.com"
MEMORY_DIR="/Users/assistattrae/.openclaw/workspace/memory"

echo "Uploading memory files to Render..."

for file in "$MEMORY_DIR"/*.md; do
  if [ -f "$file" ]; then
    filename=$(basename "$file" .md)
    content=$(cat "$file" | jq -sR .)
    
    echo "Uploading: $filename.md"
    curl -s -X POST "$RENDER_URL/api/memory" \
      -H "Content-Type: application/json" \
      -d "{\"date\":\"$filename\",\"content\":$content}"
    echo ""
  fi
done

echo "Upload complete!"
echo "Files on server: $(curl -s $RENDER_URL/health | jq -r '.files')"
