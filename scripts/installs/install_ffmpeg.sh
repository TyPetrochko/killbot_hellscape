#!/bin/bash

# This script installs / compiles ffmpeg from source. It was adapted from: 
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

if [ $# -eq 0 ]
then
  echo -e "${RED}Usage:${NC}"
  echo -e "${RED}    ./install_ffmpeg.sh <path/to/dump/ffmpeg/files>${NC}"
  exit 1
fi

# Assert first arg is a directory
if [ -d $1 ]
then
  echo -e "${YELLOW}Placing ffmpg files in $1 ${NC}"
else
  echo -e "${RED}Bad destination for ffmpeg: $1 ${NC}"
  exit 1
fi

# Dependencies
echo -e "${YELLOW}First, we need to install some dependencies. This requires root access. ${NC}"
sudo apt update --allow-releaseinfo-change
sudo apt-get install autoconf automake build-essential libass-dev libfreetype6-dev \
  libsdl1.2-dev libtheora-dev libtool libva-dev libvdpau-dev libvorbis-dev libxcb1-dev libxcb-shm0-dev \
  libxcb-xfixes0-dev pkg-config texinfo zlib1g-dev libomxil-bellagio-dev
echo -e "${GREEN}Done installing dependencies.${NC}"

# Get FFMpeg
echo -e "${YELLOW}Cloning ffmpeg into $1. Will skip if $1 is not empty${NC}"
if [ ! "$(ls -A $1)" ]
then
  git clone https://github.com/ffmpeg/FFMpeg --depth 1 $1
else
  echo -e "${YELLOW}$1 is not empty. Continuing...${NC}"
fi

# Verify git clone
if [ "$(ls -A $1)" ]
then 
  echo -e "${YELLOW}Looks like it $1 is not empty. Going to assume the download worked.${NC}"
else
  echo -e "${RED}Looks like download failed, $1 is empty.${NC}"
  exit 1
fi

# Continue?
echo -e "${YELLOW}Next, we'll make FFmpeg from scratch (this could take a while)${NC}"

read -p "Continue (y/n)?" choice
case "$choice" in 
  y|Y ) echo -e "${GREEN}Yes. Continuing...${NC}";;
  n|N ) echo -e "${GREEN}No. Aborting...${NC}" && exit 1;;
  * ) echo "Invalid. Aborting" && exit 1;;
esac

# Configure FFMpeg
echo -e "${YELLOW}Configuring FFMpeg. This could take a while (won't see anything till it's done)${NC}"
(cd $1 && ./configure --enable-gpl --enable-nonfree --enable-mmal --enable-omx --enable-omx-rpi)

# Build FFMpeg
echo -e "${YELLOW}Building FFMpeg. This could take a while.${NC}"
(cd $1 && make -j4)


