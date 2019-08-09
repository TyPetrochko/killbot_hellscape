server:
	node src/server/server.js

serverwithlogs:
	node src/server/server.js > /tmp/server_logs.txt

rasclient:
	node src/ras/ras_client.js

rasclientwithlogs:
	node src/ras/ras_client.js > /tmp/ras_logs.txt

restart:
	sudo service uv4l_raspicam restart
