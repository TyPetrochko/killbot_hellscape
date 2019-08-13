## Killbot Hellscape

![Image of Yaktocat](https://imgs.xkcd.com/comics/the_three_laws_of_robotics_2x.png)

# DONE
* Cloud Server
  * Serve web client html
    * DONE
  * Assign client ids, track robot IDs
    * DONE
  * Facilitate connecting 1 host to Raspberry directly
    * DONE
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

# TODO
* When web client disconnects from web server, it should automatically hangup
  * Handle "Hangup" disconnecting ras-client from UV4L!
* E2E Test
* Add control layer with data channels
* Clean server-side code
* Clean ras-client code
* Allow users to specify connection options (quality, hardware codec, etc.)
* Support 1:n broadcasting
* Support resetting robot / no robot available

# API
```javascript
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

# About
This project pulls largely from the following examples:
* https://github.com/MulletBoy/Raspberry-Pi-FishCam-Demo-Site
* https://github.com/shanet/WebRTC-Example

Go check them out! The first one has an awesome YouTube video / doc to go with
it:
* https://www.youtube.com/watch?v=5QAHlZoPlgI&t=625s
