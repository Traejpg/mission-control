#!/bin/bash
# Sync local memory files to Render cloud

RENDER_URL="https://mission-control-v954.onrender.com"
MEMORY_DIR="/Users/assistattrae/.openclaw/workspace/memory"

echo "🔄 Syncing memory files to Render..."
echo ""

for file in "$MEMORY_DIR"/*.md; do
  filename=$(basename "$file")
  date="${filename%.md}"
  
  # Read and escape content for JSON
  content=$(cat "$file" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | tr '\n' ' ')
  
  echo "📤 Uploading: $filename"
  
  curl -s -X POST "$RENDER_URL/api/memory" \
    -H "Content-Type: application/json" \
    -d "{\"date\":\"$date\",\"content\":\"$content\"}" > /dev/null
    
  sleep 0.5
done

echo ""
echo "✅ Sync complete!"
echo ""
echo "Checking health..."
curl -s "$RENDER_URL/health" | jq .
