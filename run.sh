#!/bin/bash
export NODE_PATH=./node_modules:/usr/local/lib/node_modules:/usr/lib/node_modules
#export PORT=5000
cd /home/ubuntu/bes-config-node
sudo nice -n -10 nodejs ./server.js > /dev/null &


