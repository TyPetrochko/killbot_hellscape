const https = require('https');
const fs = require('fs');
const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server;

const HTTPS_PORT = process.env.PORT || 8443;

// Util
function is_defined(v) {
  return typeof v != "undefined";
}

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
  } else if (request.url === '/killbot-server.js') {
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.end(fs.readFileSync('src/web-client/killbot-server.js'));
  }
})

// Web Socket server
const wss = new WebSocketServer({server});

// TODO: Make this reflect actual hostname
console.log("Web server is running! Check it out at https://192.168.1.22:"+HTTPS_PORT);

// Which client is our robot?
var robot_id = -1; // TODO remove test default value

// Track clients
var next_id = 0
var ids_to_clients = {};
var clients_to_ids = {};

// Client / Server exchange format:
// {
//  what = 'get_my_id' | 'i_am_robot' | 'call' ...
//  origin_client_id = 12345;
//  destination_client_id = 2345;
//  data = '...'
// }
// 
// Client can send messages with types:
// * get_my_id
// * webrtc
// * i_am_robot
// * call
// * offer
// * hangup
// * answer
// * get_robot_id
//
// Server can send messages with types
// * set_your_id
// * set_robot_id
// * webrtc
//

function send(clientId, message) {
  message.to = clientId;
  client  = ids_to_clients[clientId];
  if (typeof client != "undefined") {
    client.send(JSON.stringify(message));
  }
  console.log("SENT TO PEER "+clientId+":");
  console.log(message);
}

function onMessage(client, data) {
  message = JSON.parse(data);
  // Log it
  console.log("RECEIVED: ");
  console.log(message);

  // Check they are who they say they are...
  if (typeof message['origin_client_id'] != "undefined") {
    if (message.origin_client_id != clients_to_ids[client]) {
      console.log('Client '+clients_to_ids[client]+' is lying about their identity...');
      return;
    }
  }

  switch (message.what) {
    case 'get_my_id':
      // Assign client their ID
      ids_to_clients[next_id] = client
      clients_to_ids[client] = next_id
      send(next_id, {what: "set_your_id", data: next_id});
      next_id += 1;
      break;
    case 'i_am_robot':
      // Remember which client is robot
      robot_id = clients_to_ids[client];
      break;
    case 'get_robot_id':
      // client.send(JSON.stringify({'what': 'set_robot_id', 'data': robot_id}));
      send(clients_to_ids[client], {what: "set_robot_id", data: robot_id});
      break;
    case 'call':
    case 'offer':
    case 'answer':
    case 'iceCandidate':
    case 'iceCandidates':
      if (is_defined(message.to) && is_defined(message.from)) {
        send(message.to, message);
      } else {
        console.log("Could not route message because insufficent routing info:");
        console.log(message);
      }
      break;
    default:
      // Bad data
      console.log('Unknown message type: '+message.what);
  }


}

function onConnection(connection) {
  console.log('MADE CONNECTION');
}

wss.on('connection', function(ws) {
  onConnection(ws)
  ws.on('message', function(message) {
    onMessage(ws, message)
  });
});

server.listen(HTTPS_PORT, '0.0.0.0')

