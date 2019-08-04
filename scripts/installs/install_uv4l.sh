#!/bin/bash

####################
#   INSTALL UV4L   #
####################
#
# Usage:
#   ./install_uv4l.sh
#
# Adapted from https://www.youtube.com/watch?v=5QAHlZoPlgI&t=2062s

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

# Add debian package source
say "Adding uv4l repo as trusted package source"
curl http://www.linux-projects.org/listing/uv4l_repo/lpkey.asc | sudo apt-key add -
if grep -Fxq "deb http://www.linux-projects.org/listing/uv4l_repo/raspbian/stretch stretch main" /etc/apt/sources.list 
then
  success "Already trusted!"
else
  sudo bash -c "echo 'deb http://www.linux-projects.org/listing/uv4l_repo/raspbian/stretch stretch main' >> /etc/apt/sources.list"
  if grep -Fxq "deb http://www.linux-projects.org/listing/uv4l_repo/raspbian/stretch stretch main" /etc/apt/sources.list 
  then
    success "Successfully added!"
  else
    err "Couldn't add uv4l repo to /etc/apt/sources.list..."
  fi
fi

# Installing...
say "Installing uv4l libraries..."
sudo apt-get install uv4l uv4l-raspicam
sudo apt-get install uv4l-raspicam-extras uv4l-server uv4l-mjpegstream \
  uv4l-demos uv4l-xmpp-bridge
sudo apt-get install uv4l-webrtc

# Done! Start raspicam_uvl service?
success "Successfully installed!"
halt "Would you like to start raspicam service? You can do this manually with \
'sudo service uv4l_raspicam restart'"
sudo service uv4l_raspicam restart
success "Started! Visit http://<IP>:8080 for demo"
