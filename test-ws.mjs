import WebSocket from 'ws';
const ws = new WebSocket('wss://mission-control-v954.onrender.com/ws');
ws.on('open', () => {
  console.log('Connected');
  ws.send(JSON.stringify({type: 'request', resource: 'memory'}));
});
ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  console.log('Type:', msg.type);
  if (msg.payload) console.log('Payload keys:', Object.keys(msg.payload));
  if (msg.payload?.files) console.log('Files count:', msg.payload.files.length);
  if (msg.payload?.memories) console.log('Memories count:', msg.payload.memories.length);
});
ws.on('error', (e) => console.log('Error:', e.message));
setTimeout(() => ws.close(), 2000);
