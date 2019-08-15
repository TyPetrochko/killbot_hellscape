server:
	node src/server/server.js

serverwithlogs:
	node src/server/server.js > /tmp/server_logs.txt

rasclient:
	node src/ras/ras_client.js ws://192.168.1.22:12345

rasclientwithlogs:
	node src/ras/ras_client.js ws://192.168.1.22:12345 > /tmp/ras_logs.txt

restart:
	sudo service uv4l_raspicam restart
