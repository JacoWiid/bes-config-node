#!/bin/sh

PID=$(pgrep nodejs)
if pgrep -x "nodejs" > /dev/null
then
	echo "killing nodejs"
	kill $PID 
else
	echo "nodejs not running"
fi

