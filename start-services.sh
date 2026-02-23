#!/bin/bash
# Start all Mission Control services

echo "🚀 Starting Mission Control services..."

# Create logs directory
mkdir -p ~/.openclaw/logs

# Check if already running
if lsof -ti:18789 >/dev/null 2>&1; then
    echo "⚠️  Port 18789 in use (Gateway may already be running)"
else
    echo "🔌 Starting Unified Gateway..."
    cd ~/.openclaw/workspace/mission-control
    nohup node unified-gateway.js > ~/.openclaw/logs/unified-gateway.out.log 2>&1 &
    sleep 2
fi

if lsof -ti:18791 >/dev/null 2>&1; then
    echo "⚠️  Port 18791 in use (File Watcher may already be running)"
else
    echo "📁 Starting File Watcher..."
    cd ~/.openclaw/workspace/mission-control
    nohup node file-watcher-backend.js > ~/.openclaw/logs/file-watcher.out.log 2>&1 &
    sleep 2
fi

echo ""
echo "✅ Services started!"
echo ""
echo "Dashboard: http://localhost:5173 (run 'npm run dev' in mission-control)"
echo ""
echo "Check status:"
echo "  lsof -i :18789  # Gateway"
echo "  lsof -i :18791  # File Watcher"
echo ""
echo "View logs:"
echo "  tail -f ~/.openclaw/logs/unified-gateway.out.log"
echo "  tail -f ~/.openclaw/logs/file-watcher.out.log"
