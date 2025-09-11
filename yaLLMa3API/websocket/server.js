function setupWebSocketServer(wss) {
  const clients = new Set();

  wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection established');
    clients.add(ws);

    // Handle incoming messages from React frontend
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received message from frontend:', data);

        // Handle different message types
        switch (data.type) {
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
            break;
          case 'command_response':
            // Handle responses from frontend
            console.log('Command response:', data.payload);
            break;
          case 'command_status_update':
            // Handle status updates from frontend
            console.log('Command status update:', data.payload);
            break;
          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format',
          timestamp: new Date().toISOString()
        }));
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });

    // Send initial connection confirmation
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Connected to yaLLMa3API WebSocket server',
      timestamp: new Date().toISOString()
    }));
  });

  // Function to broadcast messages to all connected clients
  function broadcast(message) {
    const messageStr = JSON.stringify(message);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  // Function to send message to specific client (if needed in future)
  function sendToClient(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  // Function to broadcast command to all connected frontend clients
  function broadcastCommand(commandData) {
    const message = {
      type: 'execute_command',
      commandId: commandData.id,
      command: commandData.command,
      data: commandData.data,
      timestamp: new Date().toISOString()
    };
    broadcast(message);
    console.log(`Broadcasted command ${commandData.id} to ${clients.size} clients`);
  }

  return {
    broadcast,
    sendToClient,
    broadcastCommand,
    getClientCount: () => clients.size
  };
}

module.exports = { setupWebSocketServer };