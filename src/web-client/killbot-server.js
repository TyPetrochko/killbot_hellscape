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
  return typeof v !== "undefined";
}


function KillbotServer(url, onReady) {
  var self = this;
  this.init = function () {
    self.ready = false;
    self.server = new WebSocket(url);
    self.ids_to_peers = {};
    self.ids_to_ice_candidates = {};

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
    on_stream = conf.onStream || function (s) {};
    on_close = conf.onClose || function () {};
    on_error = conf.onError || function(err) {};

    if (! self.ready) {
      console.log("Killbot Server is not ready yet!");
      return;
    }

    if (! is_defined(self.robot_id)) {
      console.log("No robot connected!");
      return;
    }

    self.stream_from({
      client_id: self.robot_id,
      on_stream: on_stream,
      on_close: on_close,
      on_error: on_error,
    })
  };
  
  /////////////////////
  // Low-level Impl. //
  /////////////////////
  
  self.stream_from = function(conf) {
    client_id = conf.client_id
    on_stream = conf.on_stream
    on_hangup = conf.on_hangup
    on_error = conf.on_error

    // 1. Make a new peer
    var config = {"iceServers": [{"urls": ["stun:stun.l.google.com:19302"]}]};
    var options = {optional: []};
    var pc = new RTCPeerConnection(config, options);

    self.ids_to_peers[client_id] = pc

    // 2. Handle "Ice Candidates" (hacks we can use to traverse NAT)
    iceCandidates = [];
    hasRemoteDesc = false;
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
        on_stream(e.streams[0]);
      };
    } else {  // onaddstream() deprecated
        pc.onaddstream = function (e) {
          on_stream(e.stream);
      };
    }

    // 4. These probably won't be called...
    pc.onremovestream = function (e) {
      console.log("A data stream was removed.");
    };
    pc.ondatachannel = function (e) {
      console.log("A data stream is available! More info:");
      console.log("https://www.linux-projects.org/uv4l/tutorials/webrtc-data-channels/");
    };

    // 5. Try to connect
    var request = {
      what: "call",
      options: {
        // See https://www.linux-projects.org/documentation/uv4l-server/
        force_hw_vcodec: true, // TODO Let users toggle this
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
      var what = message.what
      var to = message.to_client_id

      console.log("Received message: "+e.data);

      // Make sure it was meant for us
      if (is_defined(to) && to != self.my_id) {
        console.log(`We (${self.my_id}) accidentally got a message meant for ${to}`);
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
          console.log("Bad message type:");
          console.log(message);
      };
    };
  }



  /////////////////////
  // Low-level Utils //
  /////////////////////

  self.send_to_client = function (request, client_id) {
    console.log("Sending request to "+client_id);
    console.log(request);
    if (! is_defined(self.my_id)) {
      console.log("Can't send without an id... Aborting.");
      return;
    }

    request.from = self.my_id;
    request.to = client_id;
    self.server.send(JSON.stringify(request));
  }

  self.handle_offer = function (message) {
    peer = self.ids_to_peers[message.from];
    if (! peer) {
      console.log("Unknown peer: "+message.from);
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
        // Start the exchange by sending an answer
        pc.createAnswer(function (sessionDescription) {
          pc.setLocalDescription(sessionDescription);
          var request = {
              what: "answer",
              data: JSON.stringify(sessionDescription)
          };
          ws.send(JSON.stringify(request));
        }, function (error) {
            onError("failed to create answer: " + error);
        }, mediaConstraints);
      },
      function onRemoteSdpError(e) {
        console.log("Got error connecting, something is broken: "+e);
      },
    );
  };

  // Trickle used
  self.handle_ice_candidate = function (message) {
    peer = self.ids_to_peers[message.from];
    if (! peer) {
      console.log("Unknown peer: "+message.from);
      return;
    }
    if (! message.data) {
      console.log("Received all ice candidates");
      return;
    }

    var elt = JSON.parse(msg.data);
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
      console.log("Unknown peer: "+message.from);
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
      console.log("Peer "+peer_id+" does not exist");
      return;
    }

    candidates.forEach(function(candidate) {
      peer.addIceCandidate(candidate, 
        function(){
          console.log("Candidate added: "+JSON.stringify(candidate));
        }, 
        function(err){
          console.log("Could not add candidate "+JSON.stringify(candidate)+": "+err);
        }
      );
    });
  };

  self.set_my_id = function (id) {
    console.log("My id is: "+id);
    self.my_id = id;
    
    // Are we ready to start?
    if (is_defined(self.my_id) && is_defined(self.robot_id)) {
      self.ready = true;
      self.onReady();
    }
  };

  self.set_robot_id = function(id) {
    console.log("Robot id is: "+id);
    self.robot_id = id;
    
    // Are we ready to start?
    if (is_defined(self.my_id) && is_defined(self.robot_id)) {
      self.ready = true;
      self.onReady();
    }
  };

  // Initialize
  self.init();
}
