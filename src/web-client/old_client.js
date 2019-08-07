// Client-side code!
//

var streamButton;
var serverConnection;
var localVideo;
var localStream;
var HTTPS_PORT = 8443;

function errorHandler(error) {
  console.log(error);
}

function stream() {
  streamButton.disabled = true;
}

function start() {
  localVideo = document.getElementById('localVideo');
  remoteVideo = document.getElementById('remoteVideo');
  streamButton = document.getElementById('streamButton');

  streamButton.onclick = stream;

  var constraints = {
    video: true,
    audio: false,
  };

  // Start webcam...
  if(navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
      localStream = stream;
      localVideo.srcObject = stream;
    }).catch(errorHandler);
  } else {
    alert('Your browser does not support getUserMedia API');
  }

  serverConnection = new WebSocket('wss://' + window.location.hostname + ':' + HTTPS_PORT);
  serverConnection.onopen = function (e) {
    serverConnection.send(JSON.stringify({type: 'get_client_id'}))
  }
  serverConnection.onmessage = function(e) {
    message = JSON.parse(e.data);
    console.log('Got message: ');
    console.log(message);
    switch(message.type){
      case 'set_client_id':
        console.log('Got client id: '+message.data);
    }
  }

}

// Set everything up!
window.onload = start;
