// The main API abstraction for Killbot Hellscape.
// Conventions: 
//  - use snake_case for internal members
//  - use camelCase for exposed API
//

function get_my_id(ws) {
  ws.send(JSON.stringify({what: "get_my_id"}));
}

function get_robot_id(ws) {
  ws.send(JSON.stringify({what: "get_robot_id"}));
}

function is_defined(v) {
  if (typeof v === "undefined") {
    return false;
  } else if (v === null) {
    return false;
  } else {
    return true;
  }
}


function KillbotServer(url, onReady) {
  var self = this;
  
  this.init = function () {
    self.ready = false;
    self.server = new WebSocket(url);
    self.ids_to_peers = {};
    self.ids_to_ice_candidates = {};
    self.ids_to_streams = {};
    self.ids_to_data_channels = {};
    self.my_id = null;
    self.robot_id = null;

    // User will provide these callbacks when they connect
    self.on_stream = function () {};
    self.on_close = function () {};
    self.on_data = function () {};
    self.on_error = function () {};

    self.server.onopen = function (e) {
      self.setupRouting();
      self.onReady = onReady;
      get_my_id(self.server);
      get_robot_id(self.server);
    };
  }


  ////////////////////
  // High-level API //
  ////////////////////
  
  self.connectToRobot = function (conf) {
    console.log("Connecting to robot id: "+self.robot_id);
    self.on_stream = conf.onStream || function () {};
    self.on_close = conf.onClose || function () {};
    self.on_data_channel = conf.onDataChannel || function () {};
    self.on_error = conf.onError || function (e) {
      console.log("Error: " + e);
    };

    if (! self.ready) {
      self.on_error("Killbot Server is not ready yet!");
      return;
    }

    if (! is_defined(self.robot_id)) {
      self.on_error("No robot connected!");
      return;
    }
    
    self.stream_from(self.robot_id)
  };

  self.stop = function() {
    self.send_to_client({what: "hangup"}, self.robot_id);
    Object.keys(self.ids_to_peers).forEach(function (id) {
      self.purge_client_id(id);
    });
  };
  
  /////////////////////
  // Low-level Impl. //
  /////////////////////
  
  self.stream_from = function(client_id) {
    // 1. Make a new peer
    var config = {"iceServers": [{"urls": ["stun:stun.l.google.com:19302"]}]};
    var options = {optional: []};
    var pc = new RTCPeerConnection(config, options);

    self.ids_to_peers[client_id] = pc

    // 2. Handle "Ice Candidates" (hacks we can use to traverse NAT)
    iceCandidates = [];
    pc.onicecandidate = function (e) {
      if (e.candidate) {
        var candidate = {
          sdpMLineIndex: e.candidate.sdpMLineIndex,
          sdpMid: e.candidate.sdpMid,
          candidate: e.candidate.candidate
        };

        var request = {
          what: "addIceCandidate",
          data: JSON.stringify(candidate)
        };

        self.send_to_client(request, client_id);
      }
    };

    // 3. Handle successfully added media track
    if ('ontrack' in pc) {
      pc.ontrack = function (e) {
        console.log("Got remote stream!");
        self.on_stream(e.streams[0]);
        self.track_stream(client_id, e.streams[0]);
      };
    } else {  // onaddstream() deprecated
        console.log("Got remote stream! (Deprecated version)");
        pc.onaddstream = function (e) {
          self.on_stream(e.stream);
      };
    }

    // 4. These probably won't be called...
    pc.onremovestream = function (e) {
      console.log("A data stream was removed.");
    };
    pc.ondatachannel = function (e) {
      console.log("A data stream is available! More info:");
      console.log("https://www.linux-projects.org/uv4l/tutorials/webrtc-data-channels/");
      self.track_data_channel(client_id, e.channel);
    };

    pc.oniceconnectionstatechange = function() {
      if(pc.iceConnectionState == 'disconnected') {
        console.log('Stream disconnected');
      }
    }

    // 5. Try to connect
    var request = {
      what: "call",
      options: {
        // See https://www.linux-projects.org/documentation/uv4l-server/
        force_hw_vcodec: false, // TODO Let users toggle this
        vformat: 60,
        trickle_ice: true
      }
    };

    self.send_to_client(request, client_id);
  }

  // Route messages from the server accordingly
  self.setupRouting = function () {
    self.server.onmessage = function (e) {
      var message = JSON.parse(e.data);
      var what = message.what;
      var to = message.to;

      console.log("RECEIVED: "+e.data);

      // Make sure it was meant for us
      if (is_defined(to) && is_defined(self.my_id) && to != self.my_id) {
        self.on_error(`We (${self.my_id}) accidentally got a message meant for ${to}:`);
        console.log(self.my_id);
        console.log(message.to);
        console.log(message);
        return;
      }

      switch (what) {
        // WebRTC signals
        case "offer":
          self.handle_offer(message);
          break;
        case "iceCandidate":
          self.handle_ice_candidate(message);
          break;
        case "iceCandidates":
          self.handle_ice_candidates(message);
          break;
        case "answer":
          break;
        // Server signals
        case "set_your_id":
          self.set_my_id(message.data);
          break;
        case "set_robot_id":
          self.set_robot_id(message.data);
          break;
        default:
          self.on_error("Bad message type: " + message);
      };
    };
  }



  /////////////////////
  // Low-level Utils //
  /////////////////////

  self.send_to_client = function (request, client_id) {
    console.log("Sending request to "+client_id+":");
    console.log(request);
    if (! is_defined(self.my_id)) {
      self.on_error("Can't send without an id... Aborting.");
      return;
    }

    request.from = self.my_id;
    request.to = client_id;
    self.server.send(JSON.stringify(request));
  }

  self.handle_offer = function (message) {
    peer = self.ids_to_peers[message.from];
    if (! peer) {
      self.on_error("Unknown peer: "+message.from);
      return;
    }
    var mediaConstraints = {
      optional: [],
      mandatory: {
          OfferToReceiveAudio: true,
          OfferToReceiveVideo: true
      }
    };

    peer.setRemoteDescription(new RTCSessionDescription(JSON.parse(message.data)),
      function onRemoteSdpSuccess() {
        console.log("Remote SDP success!");
        // Start the exchange by sending an answer
        peer.createAnswer(function (sessionDescription) {
          peer.setLocalDescription(sessionDescription);
          // TODO fix - ws no exist!
          var request = {
              what: "answer",
              data: JSON.stringify(sessionDescription)
          };
          self.send_to_client(request, message.from);
        }, function (error) {
            self.on_error("failed to create answer: " + error);
        }, mediaConstraints);
      },
      function onRemoteSdpError(e) {
        self.on_error("Got error connecting, something is broken: "+e);
      },
    );
  };

  // Trickle used
  self.handle_ice_candidate = function (message) {
    peer = self.ids_to_peers[message.from];
    if (! peer) {
      self.on_error("Unknown peer: "+message.from);
      return;
    }
    if (! message.data) {
      console.log("Received all ice candidates");
      return;
    }

    var elt = JSON.parse(message.data);
    let candidate = new RTCIceCandidate({
      sdpMLineIndex: elt.sdpMLineIndex,
      candidate: elt.candidate
    });

    // Track candidates
    if(! self.ids_to_ice_candidates[message.from]) {
      self.ids_to_ice_candidates[message.from] = [];
    }
    self.ids_to_ice_candidates[message.from].push(candidate);

    // Send candidates
    self.send_ice_candidates(message.from);
  };

  // Trickle NOT used
  self.handle_ice_candidates = function (message) {
    peer = self.ids_to_peers[message.from];
    if (! is_defined(peer)) {
      self.on_error("Unknown peer: " + message.from);
      return;
    }
    
    var candidates = JSON.parse(message.data);
    for (var i = 0; candidates && i < candidates.length; i++) {
      var elt = candidates[i];
      let candidate = new RTCIceCandidate({
        sdpMLineIndex: elt.sdpMLineIndex,
        candidate: elt.candidate
      });
      
      // Track candidates
      if(! self.ids_to_ice_candidates[message.from]) {
        self.ids_to_ice_candidates[message.from] = [];
      }
      self.ids_to_ice_candidates[message.from].push(candidate);
    }
    self.send_ice_candidates(message.from);
  };

  self.send_ice_candidates = function (peer_id) {
    peer = self.ids_to_peers[peer_id];
    candidates = self.ids_to_ice_candidates[peer_id];

    if (! is_defined(peer)) {
      self.on_error("Peer "+peer_id+" does not exist");
      return;
    }

    candidates.forEach(function(candidate) {
      console.log("ADDING CANDIDATE: ");
      console.log(candidate);
      peer.addIceCandidate(candidate, 
        function(){
          console.log("Candidate added: "+JSON.stringify(candidate));
        }, 
        function(err){
          self.on_error("Could not add candidate "+JSON.stringify(candidate)+": "+err);
        }
      );
    });
  };

  self.set_my_id = function (id) {
    self.my_id = id;
    
    // Are we ready to start?
    if (is_defined(self.my_id) && is_defined(self.robot_id)) {
      self.ready = true;
      self.onReady();
    }
  };

  self.set_robot_id = function(id) {
    self.robot_id = id;
    
    // Are we ready to start?
    if (is_defined(self.my_id) && is_defined(self.robot_id)) {
      self.ready = true;
      self.onReady();
    }
  };

  self.track_stream = function (client_id, stream) {
    if (! is_defined(self.ids_to_streams[client_id])) {
      self.ids_to_streams[client_id] = [];
    }
    self.ids_to_streams[client_id].push(stream);
  };

  self.track_data_channel = function (client_id, data_channel) {
    self.on_data_channel(data_channel);
    if (! is_defined(self.ids_to_data_channels[client_id])) {
      self.ids_to_data_channels[client_id] = [];
    }
    self.ids_to_data_channels[client_id].push(data_channel);
  };

  self.purge_client_id = function(id) {
    if (is_defined(self.ids_to_streams[id])) {
      self.ids_to_streams[id].forEach(function(stream) {
        // Adapted from Official UV4L examples
        try {
          if (stream.getVideoTracks().length)
            stream.getVideoTracks()[0].stop();
          if (stream.getAudioTracks().length)
            stream.getAudioTracks()[0].stop();
          stream.stop(); // deprecated
        } catch (e) {
          for (var i = 0; i < stream.getTracks().length; i++)
            stream.getTracks()[i].stop();
        }
      });
      self.ids_to_streams[id] = null;
    }
    if (is_defined(self.ids_to_data_channels[id])) {
      self.ids_to_data_channels[id].forEach(function(channel) {
        channel.close();
      });
      self.ids_to_data_channels[id] = null;
    }
    self.ids_to_peers[id].close();
    self.ids_to_peers[id] = null;
    self.ids_to_ice_candidates[id] = null;
  }

  // Initialize
  self.init();
}
