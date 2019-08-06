## Killbot Hellscape

![Image of Yaktocat](https://imgs.xkcd.com/comics/the_three_laws_of_robotics_2x.png)

# TODO

* Cloud Server
  * Serve web client html
    * DONE
  * Assign client ids, track robot IDs
    * DONE
  * Facilitate connecting 1 host to Raspberry directly
* Raspberry PI client (JS / Node.js)
  * Forward packets between Cloud Websocket and local UV4L WebSocket
* Web client (JS)
  * Connect to Cloud server
    * DONE
  * Get self id
    * DONE
  * Get robot id
  * Call robot id

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
