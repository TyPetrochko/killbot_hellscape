const https = require('https');
const fs = require('fs');
const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server;

const HTTPS_PORT = process.env.PORT || 8443;

// Web server
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

// Web Socket server
const wss = new WebSocketServer({server});

// Which client is our robot?
var robot_id;

// Track clients
var next_id = 0
var ids_to_clients = {};
var clients_to_ids = {};

// Client / Server exchange format:
// {
//  what = 'get_client_id' | 'i_am_robot' | 'call' ...
//  origin_client_id = 12345;
//  destination_client_id = 2345;
//  data = '...'
// }
// 
// Client can send messages with types:
// * get_client_id
// * webrtc
// * i_am_robot
// * call
// * offer
// * hangup
// * answer
//
// Server can send messages with types
// * set_client_id
// * webrtc
//
function onMessage(client, data) {
  message = JSON.parse(data);
  // Log it
  console.log('Received message: ');
  console.log(message);

  // Check they are who they say they are...
  if (message['origin_client_id']) {
    if (message.origin_client_id != clients_to_ids[client]) {
      console.log('Client '+clients_to_ids[client]+' is lying about their identity...');
      return;
    }
  }

  switch (message.type) {
    case 'get_client_id':
      // Assign client their ID
      client.send(JSON.stringify({'type': 'set_client_id', 'data': next_id}));
      ids_to_clients[next_id] = client
      clients_to_ids[client] = next_id
      next_id += 1;
      break;
    case 'i_am_robot':
      // Remember which client is robot
      robot_id = clients_to_ids[client];
    default:
      // Bad data
      console.log('Unknown message type: '+message.type);
  }


}

function onConnection(connection) {
  console.log('Made connection: ');
}

wss.on('connection', function(ws) {
  onConnection(ws)
  ws.on('message', function(message) {
    onMessage(ws, message)
  });
});

server.listen(HTTPS_PORT, '0.0.0.0')

