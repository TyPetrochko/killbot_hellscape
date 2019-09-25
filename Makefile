whoami:
	hostname -I

server:
	node src/server/server.js

serverwithlogs:
	node src/server/server.js > /tmp/server_logs.txt

rasclientheroku:
	node src/ras/ras_client.js ws://killbot-hellscape.herokuapp.com

rasclient:
	node src/ras/ras_client.js ws://127.0.0.1:12345

rasclientwithlogs:
	node src/ras/ras_client.js ws://127.0.0.1:12345 > /tmp/ras_logs.txt

control:
	python3 src/ras/main.py

logs:
	tail -f /var/log/syslog

conf:
	sudo vim /etc/uv4l/uv4l-raspicam.conf

restart:
	sudo service uv4l_raspicam restart
	sudo bin/PIGPIO/pigpiod
