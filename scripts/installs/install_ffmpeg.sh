#!/bin/bash

# This script installs / compiles ffmpeg from source. It was adapted from: 
# https://www.jungledisk.com/blog/2017/07/03/live-streaming-mpeg-dash-with-raspberry-pi-3/
#
# Usage:
#   ./install_ffmpeg.sh path/to/dump/ffmpeg/files

# If any line fails, abort
set -e

# Assert first arg is a directory
if [ -d $1 ]
then
  echo "Placing ffmpg files in $1"
else
  echo "Bad destination for ffmpeg: $1"
  exit 1
fi

echo 'First, we need to install some dependencies. This requires root access.'
sudo apt-get update
sudo apt-get install autoconf automake build-essential libass-dev libfreetype6-dev \
  libsdl1.2-dev libtheora-dev libtool libva-dev libvdpau-dev libvorbis-dev libxcb1-dev libxcb-shm0-dev \
  libxcb-xfixes0-dev pkg-config texinfo zlib1g-dev

echo 'Done installing dependencies'


