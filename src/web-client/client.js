// Author: Tyler Petrochko
//
const protocol = location.protocol === "https:" ? "wss:" : "ws:";
const port_suffix = location.port ? ':'+location.port: '';
const URL = protocol + location.hostname + port_suffix;

var killbotServer;
var streamButton;
var stopButton;
var fullscreenButton;
var sendButton;
var videoPlayer;
var sendReceivePanel;
var log;

var dataChannel;

// Raw input
var keys = {
  "KeyW": false,
  "KeyA": false,
  "KeyS": false,
  "KeyD": false,
  "ShiftLeft": false,
  "Space": false,
};

// Semantic input represntation
var axes = {
  vertical: 0.0,
  horizontal: 0.0,
  shift: false,
  space: false,
};

function setAxes () {
  // If tab isn't active, zero all input
  if (document.hidden) {
    for (var keyCode in keys) {
      keys[keyCode] = false;
    }
  }
  // Vertical
  if (keys["KeyW"] && keys["KeyS"]) {
    axes["vertical"] = 0.0;
  } else if (keys["KeyW"]) {
    axes["vertical"] = 1.0;
  } else if (keys["KeyS"]) {
    axes["vertical"] = -1.0;
  } else {
    axes["vertical"] = 0.0;
  }

  // Horizontal
  if (keys["KeyA"] && keys["KeyD"]) {
    axes["horizontal"] = 0.0;
  } else if (keys["KeyA"]) {
    axes["horizontal"] = -1.0;
  } else if (keys["KeyD"]) {
    axes["horizontal"] = 1.0;
  } else {
    axes["horizontal"] = 0.0;
  }

  // Buttons
  if (keys["ShiftLeft"]) {
   axes["shift"] = true;
  } else {
    axes["shift"] = false;
  }

  if (keys["Space"]) {
    axes["space"] = true;
  } else {
    axes["space"] = false;
  }
}

function send(data) {
  if (dataChannel && dataChannel.readyState == "open") {
    dataChannel.send(data);
  }
}

function start () {
  streamButton.disabled = true;
  stopButton.disabled = false;
  killbotServer = new KillbotServer(URL, function onReady() {
    console.log("Killbot server is ready!");
    killbotServer.connectToRobot({
      onStream: function(stream) {
        console.log("Received a video stream!");
        videoPlayer.srcObject = stream;
      },
      onClose: function () {alert("Closed connection...");},
      onError: function (e) {alert("Got error: " + e);},
      onDataChannel: function (channel) {
        dataChannel = channel;
        channel.onmessage = function(e) {
          console.log(e.data);
          log.value = (log.value || "") + e.data + "\n"
          log.scrollTop = log.scrollHeight;
        };
        channel.onclose = function() {
          dataChannel = null;
        }
        channel.onerror = function(e) {
          alert("Data channel error: " + e);
        }
      }
    });
  });

  sendReceivePanel.style = "visibility: visible";
}

function stop () {
  killbotServer.stop();
  videoPlayer.srcObject = null;
  streamButton.disabled = false;
  stopButton.disabled = true;

  log.value = "";
  sendReceivePanel.style = "visibility: hidden";
}

function goFullscreen() {
  console.log("Going fullscreen...");
  if (videoPlayer.requestFullScreen) {
    videoPlayer.requestFullScreen();
  } else if (videoPlayer.webkitRequestFullScreen) {
    videoPlayer.webkitRequestFullScreen();
  } else if (videoPlayer.mozRequestFullScreen) {
    videoPlayer.mozRequestFullScreen();
  }
}

function sendMessage() {
  field = document.getElementById("messageText");
  send(field.value);
  field.value = "";
}

function keydown (e) {
  console.log("DOWN: " + e.code);
  keys[e.code] = true;
}

function keyup (e) {
  console.log("UP: " + e.code);
  keys[e.code] = false;
}

// Main control loop - dt is "time since last call"
function update (dt) {
  console.log("Update: " + dt);
  setAxes();

  if(dataChannel && dataChannel.readyState == "open") {
    send(JSON.stringify(axes));
  }
}

function setup () {
  stopButton = document.getElementById("stopButton");
  sendButton = document.getElementById("sendButton");
  streamButton = document.getElementById("streamButton");
  fullscreenButton = document.getElementById("fullscreenButton");
  videoPlayer = document.getElementById("video-player");
  sendReceivePanel = document.getElementById("sendReceivePanel");
  log = document.getElementById("log");
  
  sendButton.onclick = sendMessage;
  streamButton.onclick = start; 
  stopButton.onclick = stop;
  fullscreenButton.onclick = goFullscreen;
  
  stopButton.disabled = true;

  window.addEventListener('keydown', keydown, true);
  window.addEventListener('keyup', keyup, true);
}

// Call update regularly
t = (new Date()).getTime();
setInterval(function () {
  t2 = (new Date()).getTime();
  update(t2 - t);
  t = t2;
}, 100);

window.onload = setup;
window.onbeforeunload = function () {
  streamButton.disabled = false;
  stop();
}
