#!/bin/bash

# This script installs / compiles janus gateway from source. It was adapted from:
# 
#
# Usage:
#   ./install_janus.sh

# If any line fails, abort
set -e

# Make some colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

say () {
  echo -e "${YELLOW}$1${NC}"
  sleep 1
}
success () {
  echo -e "${GREEN}$1${NC}"
  sleep 1
}

err () {
  echo -e "${RED}$1${NC}"
  sleep 1
}

halt () {
  echo -e "${YELLOW}$1${NC}"
  read -p "(y/n)?" choice
  case "$choice" in 
    y|Y ) success "Yes." ;;
    n|N ) err "No. Aborting." && exit 1;;
    * ) echo "Invalid. Aborting" && exit 1;;
  esac
}

assert_dir_exists() {
  say "Making sure $1 exists..."
  if [ -d $1 ]
  then
    success "It exists."
  else
    err "It does NOT exist. Aborting."
    exit 1
  fi
}

require_dir_exists() {
  say "Making sure $1 exists..."
  if [ -d $1 ]
  then
    success "It exists."
  else
    halt "It does NOT exist. Make it?"
    mkdir -p $1
  fi
}


# Make ./bin/
require_dir_exists "./bin"

# Install dependencies
say "Updating & installing dependencies..."

sudo apt update
sudo apt-get install libmicrohttpd-dev libjansson-dev libnice-dev libssl-dev \
  libsrtp-dev libsofia-sip-ua-dev libglib2.0-dev libopus-dev libogg-dev \
  libini-config-dev libcollection-dev pkg-config gengetopt libtool automake \
  dh-autoreconf libconfig-dev libsrtp2-dev
success "All dependencies successfully installed!"

# Get Janus gateway
say "Fetching Janus Gateway..."
if [ -d "./bin/janus-gateway" ]
then
  success "Already fetched!"
else
  git clone https://github.com/meetecho/janus-gateway.git ./bin/janus-gateway
  assert_dir_exists "./bin/janus-gateway"
fi


# Setting up / configuring
(cd ./bin/janus-gateway && sh autogen.sh)
(cd ./bin/janus-gateway && ./configure --disable-websockets --disable-data-channels \
  --disable-rabbitmq --disable-docs --prefix=/opt/janus)
(cd ./bin/janus-gateway && make)
(cd ./bin/janus-gateway && sudo make install)
(cd ./bin/janus-gateway && sudo make configs)

# Manual portion
say "At this point, you'll have to configure Janus. For WebRTC demo, Add the \
following lines (and comment out the other example streams by adding a \
semicolon before each line) to /opt/janus/etc/janus/janus.plugin.streaming.cfg"

cat << EOF
[gst-rpwc]
type = rtp
id = 1
description = RPWC H264 test streaming
audio = no
video = yes
videoport = 8004
videopt = 96
videortpmap = H264/90000
videofmtp = profile-level-id=42e028\;packetization-mode=1
EOF

say "OR, if /opt/janus/etc/janus/janus.plugin.streaming.cfg doesn't exist, \
add the following to /opt/janus/etc/janus/janus.plugin.streaming.jcfg"

cat << EOF
gst-rpwc: {
  type = rtp
  id = 1
  description = "RPWC H264 test streaming"
  audio = no
  video = yes
  videoport = 8004
  videopt = 96
  videortpmap = "H264/90000"
  videofmtp = "profile-level-id=42e028\;packetization-mode=1"
}
EOF

halt "Done?"
success "Congratulations! Your Janus install in directory ./opt/janus \
and ./bin/janus-gateway/ is complete."

# Do you want Gstreamer?
halt "Do you want to install Gstreamer? This is required for WebRTC demo"
sudo apt-get install gstreamer1.0-tools

# Do you want Nginx?
halt "Do you want to install Nginx? This is required for WebRTC demo"
sudo aptitude install nginx

# Setup the demo?
halt "Do you want to setup the Janus demo? This will copy the Janus demo \
files into /usr/share/nginx/www/ and REMOVE any other files in this \
directory. If you're doing anything else with Nginx, this will delete all \
your progress."
sudo rm -rf /usr/share/nginx/www/*
sudo cp -r /opt/janus/share/janus/demos/ /usr/share/nginx/www/



