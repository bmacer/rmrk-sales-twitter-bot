#/usr/bin/sh
source /home/pi/.bashrc

until cd /home/pi/rmrk/rmrk-sales-twitter-bot && node index.js; do
    echo "running, respawning..." >&2
    sleep 1
done


#node index.js 2 > /dev/null 2>&1 &
#node index.js 2>&1 &
#p=$!
#echo $p > process.txt





