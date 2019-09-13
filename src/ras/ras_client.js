const WebSocket = require("ws")

// To change WS path / port, see options on /etc/uv4l/uv4l-raspicam.conf
const uv4l_url = "ws://127.0.0.1:8080/stream/webrtc"
const server_url = process.argv[2]

var my_id;
var uv4l_ws;
var signaling_server_ws;
var controlled_by_id;

const NETWORKING_LOOP_DURATION_MS = 1000;

///////////
// Utils //
///////////

function is_defined(v) {
  if (typeof v === "undefined") {
    return false;
  } else if (v === null) {
    return false;
  }
  return true;
}

function close_ws_if_open(ws) {
  if (is_defined(ws) && ws.readyState === WebSocket.OPEN) {
    ws.on("close", function () {});
    ws.close();
  }
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
  if (is_defined(message.to) && is_defined(message.from)) {
    // Decide who's controlling us
    if (! is_defined(controlled_by_id)) {
      controlled_by_id = message.from;
    }

    // Make sure no one else is trying to control us
    if (message.from != controlled_by_id) {
      console.log(
        "Got a message from client "
        + message.from
        + " but controlled by "
        + controlled_by_id);
    }
  } else {
    console.log("Insufficient routing info for message: ");
    console.log(message);
  }
  if (message.what == "hangup") {
    console.log("Hanging up.");
    controlled_by_id = null;
  }
  send(uv4l_ws, message);
}

function handle_signal_from_uv4l(message) {
  console.log("Received from uv4l: ");
  console.log(message);
  message.to = controlled_by_id;
  send(signaling_server_ws, message);
}

// Note that is_disconnected and is_connected are not complements. WebSockets
// in states CONNECTING or CLOSING are neither.
function is_disconnected(ws) {
  if (!is_defined(ws)) {
    return true;
  } else if (ws.readyState === WebSocket.CLOSED) {
    return true;
  }
  return false;
}

function is_connected(ws) {
  return (is_defined(ws) && ws.readyState === WebSocket.OPEN);
}


//////////////////////////////////
// Bridge Server Implementation //
//////////////////////////////////

setInterval(function() {
  // Priority #1 - connect to UV4L
  if (is_disconnected(uv4l_ws)) {
    uv4l_ws = new WebSocket(uv4l_url);
    uv4l_ws.on("error", function error(e) {
      console.log("Error connecting to uv4l WebSocket: "+e);
    });
    uv4l_ws.on("close", function close() {
      console.log("Disconnected from uv4l WebSocket");
      // close_ws_if_open(signaling_server_ws);
    });
    uv4l_ws.on("open", function open() {
      console.log("Connected to uv4l WebSocket");
      uv4l_ws.on("message", function (message) {
        structured = JSON.parse(message);
        
        console.log("RECEIVED FROM UV4L:");
        console.log(structured);
        switch (structured.what) {
          case "hangup":
          case "call":
          case "offer":
          case "answer":
          case "iceCandidate":
          case "iceCandidates":
          case "addIceCandidate":
            handle_signal_from_uv4l(structured);
            break;
          default:
            console.log("Bad message from uv4l!");
            console.log(structured);
        }
      }); 
    });
  }

  // Priority #2 - connect to signaling server
  if (is_connected(uv4l_ws) && is_disconnected(signaling_server_ws)) {
    console.log("Connecting to signaling server: "+server_url);
    signaling_server_ws = new WebSocket(server_url, {rejectUnauthorized:false});
    
    signaling_server_ws.on("error", function error(e) {
      console.log("Error connecting to our signaling server: "+e);
    });
    signaling_server_ws.on("close", function close() {
      console.log("Disconnected from signaling server");
    });
    signaling_server_ws.on("open", function open() {
      console.log("Connected to signaling server!");
      signaling_server_ws.on("message", function (message) {
        structured = JSON.parse(message);
        
        console.log("RECEIVED FROM SIGNALING SERVER:");
        console.log(structured);

        switch (structured.what) {
          case "set_your_id":
            my_id = structured.data
            send(signaling_server_ws, {what: "i_am_robot"});
            break;
          case 'hangup':
          case "call":
          case "offer":
          case "answer":
          case "iceCandidate":
          case "iceCandidates":
          case 'addIceCandidate':
            handle_signal_from_server(structured);
            break;
          default:
            console.log("Bad message from server!");
            console.log(structured);
        }
      });

      // 4. Start the chain...
      send(signaling_server_ws, {what: "get_my_id"});
    });
  }

  // No-op
  if(is_connected(uv4l_ws) && is_connected(signaling_server_ws)) {
    console.log("Connected to both!");
  }

  // Keep-alive
  if(is_connected(signaling_server_ws)) {
    send(signaling_server_ws, {what: "ping"});
  }

}, NETWORKING_LOOP_DURATION_MS);

