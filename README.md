## Killbot Hellscape

![Image of Yaktocat](https://imgs.xkcd.com/comics/the_three_laws_of_robotics_2x.png)

# TODO

How many pieces of code do we need?
* Signaling server (Node.JS)
  * Handle WebRTC setup phase, track clients
* Echo server (JS / Node.JS)
  * Receive one stream from raspberry pi, forward to web clients
* Web server (Node.js / Nginx)
  * Serve up static web client
* Raspberry PI client (JS / Node.js)
  * Connect to local UV4L server w/ WebRTC, forward to echo server
* Web client (JS)
  * Connect to server, receive WebRTC stream

For our case, we can probably do 1-3 in the same server. For reference, see:

https://github.com/shanet/WebRTC-Example
