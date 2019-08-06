const https = require('https');
const fs = require('fs');
const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server;

const HTTPS_PORT = process.env.PORT || 8443;

server = https.createServer(serverConfig = {
    key: fs.readFileSync('certificates/key.pem'),
    cert: fs.readFileSync('certificates/cert.pem'),
}, function(request, response) {
  if(request.url === '/') {
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.end(fs.readFileSync('src/web-client/index.html'));
  } else if (request.url === '/client.js') {
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.end(fs.readFileSync('src/web-client/client.js'));
  }
})

server.listen(HTTPS_PORT)

// Create a server for handling websocket calls
const wss = new WebSocketServer({server: server});

wss.on('connection', function(ws) {
  ws.on('message', function(message) {
    // Broadcast any received message to all clients
    console.log('received: %s', message);
    wss.broadcast(message);
  });
});

wss.broadcast = function(data) {
  this.clients.forEach(function(client) {
    if(client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

