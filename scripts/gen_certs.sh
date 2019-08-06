#!/bin/bash

####################
# INSTALL TEMPLATE #
####################
#
# Say a little about your install here.
# 
# Usage:
#   ./<MY_SCRIPT>.sh <ARG1> <ARG2> ...
#
#

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

say "Generating certificates..."
require_dir_exists "./certificates"

openssl req -x509 -newkey rsa:4096 -keyout certificates/key.pem -out certificates/cert.pem -days 365 -nodes

