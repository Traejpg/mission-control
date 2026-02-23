#!/usr/bin/env node
/**
 * Sync local memory files to Render backend
 */

const WebSocket = require('ws');
const fs = require('fs').promises;
const path = require('path');

const MEMORY_DIR = '/Users/assistattrae/.openclaw/workspace/memory';
const RENDER_URL = 'wss://mission-control-v954.onrender.com/ws';

async function syncFiles() {
  console.log('Connecting to Render backend...');
  
  const ws = new WebSocket(RENDER_URL);
  
  ws.on('open', async () => {
    console.log('✅ Connected to Render');
    
    try {
      const files = await fs.readdir(MEMORY_DIR);
      const mdFiles = files.filter(f => f.endsWith('.md'));
      
      console.log(`Found ${mdFiles.length} memory files to sync\n`);
      
      for (const filename of mdFiles) {
        const date = filename.replace('.md', '');
        const content = await fs.readFile(path.join(MEMORY_DIR, filename), 'utf-8');
        
        // Send write command
        ws.send(JSON.stringify({
          type: 'write_file',
          date: date,
          content: content
        }));
        
        console.log(`📤 Uploaded: ${filename}`);
        
        // Small delay to avoid overwhelming
        await new Promise(r => setTimeout(r, 100));
      }
      
      console.log('\n✅ Sync complete!');
      
      // Also create files that don't exist
      for (const filename of mdFiles) {
        const date = filename.replace('.md', '');
        ws.send(JSON.stringify({
          type: 'create_file',
          date: date,
          template: null
        }));
      }
      
      setTimeout(() => {
        ws.close();
        process.exit(0);
      }, 1000);
      
    } catch (err) {
      console.error('❌ Error:', err);
      ws.close();
      process.exit(1);
    }
  });
  
  ws.on('error', (err) => {
    console.error('❌ WebSocket error:', err.message);
    process.exit(1);
  });
  
  ws.on('close', () => {
    console.log('Connection closed');
  });
}

syncFiles();
