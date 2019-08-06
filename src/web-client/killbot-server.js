// The main API abstraction for Killbot Hellscape.
// Conventions: 
//  - use snake_case for internal members
//  - use camelCase for exposed API
//

function get_my_id(ws) {
  // TODO
}

function get_robot_id(ws) {
  // TODO
}


function KillbotServer(url, onReady) {
  this.ready = false;
  this.server = new WebSocket(url);
  this.ids_to_peers = {};

  this.server.onopen = function (e) {
    this.ready = true;
    this.my_id = get_my_id(this.server)
    onReady();
  }

  this.setupRouting();

  ////////////////////
  // High-level API //
  ////////////////////
  
  this.connectToRobot = function (conf) {
    on_stream = config.onStream || function (s) {};
    on_close = config.onClose || function () {};
    on_error = config.onError || function(err) {};

    if (! this.ready) {
      on_error("Killbot Server is not ready yet!");
      return;
    }

    this.robot_id = get_robot_id(this.server);
    if (! this.robot_id) {
      on_error("No robot connected!");
      return;
    }

    this.stream_from({
      client_id: this.robot_id,
      on_stream: on_stream,
      on_close: on_close,
      on_error: on_error,
    })
  }
  
  /////////////////////
  // Low-level Impl. //
  /////////////////////
  
  this.stream_from = function(conf) {
    client_id = conf.client
    on_stream = conf.on_stream
    on_hangup = conf.on_hangup
    on_error = conf.on_error

    // 1. Make a new peer
    var config = {"iceServers": [{"urls": ["stun:stun.l.google.com:19302"]}]};
    var options = {optional: []};
    var pc = new RTCPeerConnection(config, options);

    this.ids_to_peers[client_id] = pc

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

        this.send_to_client(request, client_id)
      }
    }

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
    }
    pc.ondatachannel = function (e) {
      console.log("A data stream is available! More info:");
      console.log("https://www.linux-projects.org/uv4l/tutorials/webrtc-data-channels/");
    }

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

    this.send_to_client(request, client_id);
  }

  // Route messages from the server accordingly
  this.setupRouting = function () {
    this.server.onmessage = function (e) {
      var message = JSON.parse(e);
      var what = message.what
      var to = message.to_client_id

      // Make sure it was meant for us
      if (to != this.my_id) {
        console.log(`We (${this.my_id}) accidentally got a message meant for ${to}`);
        return;
      }

      switch (what) {
        case "offer":
          this.handle_offer(message);
          break;
        case "iceCandidate":
          this.handle_ice_candidate(message);
          break;
        case "iceCandidates":
          this.handle_ice_candidates(message);
          break
        case "answer":
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

  this.send_to_client(request, client_id) {
    // TODO
  }

  this.handle_offer(message) {
    // TODO
  }

  this.handle_ice_candidate(message) {
    // TODO
  }

  this.handle_ice_candidates(message) {
    // TODO
  }
}
