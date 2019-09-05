server:
	node src/server/server.js

serverwithlogs:
	node src/server/server.js > /tmp/server_logs.txt

rasclientheroku:
	node src/ras/ras_client.js ws://killbot-hellscape.herokuapp.com

rasclient:
	node src/ras/ras_client.js ws://192.168.1.22:12345

rasclientwithlogs:
	node src/ras/ras_client.js ws://192.168.1.22:12345 > /tmp/ras_logs.txt

control:
	python3 src/ras/data.py

logs:
	tail -f /var/log/syslog

conf:
	sudo vim /etc/uv4l/uv4l-raspicam.conf

restart:
	sudo service uv4l_raspicam restart
