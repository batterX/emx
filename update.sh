#!/bin/sh
# update.sh

sudo rm /home/pi/BatterX
sudo cp /home/pi/emx/BatterX /home/pi
sudo chmod 777 /home/pi/BatterX

sudo rm /home/pi/MqttStream
sudo cp /home/pi/emx/MqttStream /home/pi
sudo chmod 777 /home/pi/MqttStream

sudo rm /home/pi/FWUpdate
sudo cp /home/pi/emx/FWUpdate /home/pi
sudo chmod 777 /home/pi/FWUpdate

sudo cp /home/pi/emx/launcher.sh /home/pi
sudo chmod 777 /home/pi/launcher.sh

sudo cp /home/pi/emx/updater.sh /home/pi
sudo chmod 777 /home/pi/updater.sh

sudo cp /home/pi/emx/html /var/www -r
sudo chmod 777 /var/www -R



sudo kill $(pgrep "BatterX")
sudo kill $(pgrep "MqttStream")
sudo kill $(pgrep "FWUpdate")



sudo rm /home/pi/emx -r

sudo rm /home/pi/update.sh
