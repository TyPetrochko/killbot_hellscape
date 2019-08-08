const WebSocket = require("ws")

var my_id;
var uv4l_ws;
var server_ws;
var controlled_by_id;

///////////
// Utils //
///////////
function is_defined(v) {
  return typeof v != "undefined";
}

function send(ws, request) {
  request.from = my_id;
  ws.send(JSON.stringify(request));
  console.log("SEND: ");
  console.log(request);
}

function handle_id_received(message) {
  my_id = message.data;
  console.log("Received my id: "+my_id);
}

function handle_signal_from_server(message) {
  console.log("Received from server: ");
  console.log(message);
  if (is_defined(message.to) && is_defined(message.from)) {
    // Decide who's controlling us
    if (! is_defined(controlled_by_id)) {
      controlled_by_id = message.from;
    }

    // Make sure no one else is trying to control us
    if (message.from != controlled_by_id) {
      console.log("Got a message from client "+message.from+" but controlled by "+controlled_by_id);
    }
  } else {
    console.log("Insufficient routing info for message: ");
    console.log(message);
  }
  send(uv4l_ws, message);
}

function handle_signal_from_uv4l(message) {
  console.log("Received from uv4l: ");
  console.log(message);
  message.to = controlled_by_id;
  send(server_ws, message);
}

//////////////////////////////////
// Bridge Server Implementation //
//////////////////////////////////

// 1. Connect to local uv4l WebSocket
// To change WS path / port, see options on /etc/uv4l/uv4l-raspicam.conf
const uv4l_url = "ws://127.0.0.1:8080/stream/webrtc"
uv4l_ws = new WebSocket(uv4l_url);

uv4l_ws.on("error", function error(e) {
  console.log("Error connecting to uv4l WebSocket: "+e);
});

uv4l_ws.on("open", function open() {
  console.log("Connected to uv4l WebSocket");
  
  // 2. Connect to our signaling server
  const server_url = "wss://192.168.1.22:8443" // Testing locally
  server_ws = new WebSocket(server_url, {rejectUnauthorized:false});
  
  server_ws.on("error", function error(e) {
    console.log("Error connecting to our WebSocket: "+e);
  });

  server_ws.on("open", function open() {
    console.log("Connected to OUR WebSocket");
    
    // 3. Set up callbacks
    uv4l_ws.on("message", function (message) {
      structured = JSON.parse(message);
      
      console.log("RECEIVED FROM UV4L:");
      console.log(structured);
      switch (structured.what) {
        case "call":
        case "offer":
        case "answer":
        case "iceCandidate":
        case "iceCandidates":
          handle_signal_from_uv4l(structured);
          break;
        default:
          console.log("Bad message from uv4l!");
          console.log(structured);
      }
    });

    server_ws.on("message", function (message) {
      structured = JSON.parse(message);
      
      console.log("RECEIVED FROM SERVER:");
      console.log(structured);

      switch (structured.what) {
        case "set_your_id":
          my_id = structured.data
          send(server_ws, {what: "i_am_robot"});
          break;
        case "call":
        case "offer":
        case "answer":
        case "iceCandidate":
        case "iceCandidates":
          handle_signal_from_server(structured);
          break;
        default:
          console.log("Bad message from server!");
          console.log(structured);
      }
    });

    // 4. Start the chain...
    send(server_ws, {what: "get_my_id"});
  });
});


