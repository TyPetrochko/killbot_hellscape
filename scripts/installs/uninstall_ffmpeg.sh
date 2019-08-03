#!/bin/bash

# This script uninstalls / compiles ffmpeg from source. It was adapted from: 
# https://www.jungledisk.com/blog/2017/07/03/live-streaming-mpeg-dash-with-raspberry-pi-3/
#
# Usage:
#   ./install_ffmpeg.sh path/to/dump/ffmpeg/files

# If any line fails, abort
set -e

# Make some colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Dependencies
echo -e "${YELLOW}Removing dependencies. This requires root access. ${NC}"
sudo apt update --allow-releaseinfo-change
sudo apt-get remove autoconf automake build-essential libass-dev libfreetype6-dev \
  libsdl1.2-dev libtheora-dev libtool libva-dev libvdpau-dev libvorbis-dev libxcb1-dev libxcb-shm0-dev \
  libxcb-xfixes0-dev pkg-config texinfo zlib1g-dev libomxil-bellagio-dev
echo -e "${GREEN}Done uninstalling dependencies.${NC}"

echo -e "${RED}Note that any compiled binaries were not deleted."
echo -e "You can do this by manually deleting files in ./bin/, ./out/ that are related to FFMpeg.${NC}"
