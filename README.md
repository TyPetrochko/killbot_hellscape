## Killbot Hellscape

![Image of Yaktocat](https://imgs.xkcd.com/comics/the_three_laws_of_robotics_2x.png)

# TODO
In signaling server, we need to route between the web client and ras-client.

* Cloud Server
  * Serve web client html
    * DONE
  * Assign client ids, track robot IDs
    * DONE
  * Facilitate connecting 1 host to Raspberry directly
* Raspberry PI client (JS / Node.js)
  * Forward packets between Cloud Websocket and local UV4L WebSocket
    * DONE
* Web client (JS)
  * Connect to Cloud server
    * DONE
  * Get self id
    * DONE
  * Get robot id
    * DONE
  * Call robot id
    * DONE

For the web client, let's expose the following API:
```
server = new KillbotServer(url, onReady = function () { ... });

// Either...
server.connectToRobot({
  onStream: function (stream) { ... },
  onClose: function () { ... }
  onError: function (err) { ... },
})

server.tellRobot({
  data: "go-forward", // hopefully something more specific...
  onSuccess: function (response) { ... },
  onError: function (error) { ... },
})


// Or...
server.streamFromServer({
  onError: function (err) { ... },
  onStream: function (stream) { ... },
  onHangup: function () { ... }
})
```

For our case, we can probably do 1-3 in the same server. For reference, see:

https://github.com/shanet/WebRTC-Example

Some mental notes on how WebRTC works (NOT done):
1. Caller creates RTCPeerConnection, which will gather ice candidates in the
   background
2. Caller creates an offer...
2. Each time an ice candidate is found, it sends it to the other peer (via 
   signaling server)
3. The callee creates an RTCPeerConnection too, and forwards its ice candidates
   when IT finds them
4. When an ice candidate is RECEIVED, it calls peerConnection.addIceCandidate()
   on the new candidate

See: https://webrtcglossary.com/trickle-ice/ for help

