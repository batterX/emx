#!/bin/sh
# updater.sh

cd /home/pi

sudo rm -rf emx

git clone https://github.com/batterx/emx.git

sudo cp /home/pi/emx/update.sh /home/pi
sudo chmod 777 /home/pi/update.sh

sudo sh /home/pi/update.sh
