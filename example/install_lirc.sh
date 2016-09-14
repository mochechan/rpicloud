#!/bin/bash
echo installing lirc for raspberry pi 2
# http://alexba.in/blog/2013/01/06/setting-up-lirc-on-the-raspberrypi/
# https://github.com/OpenELEC/OpenELEC.tv/issues/3908
sudo apt-get -y install lirc 
echo 'dtoverlay=lirc-rpi,gpio_in_pin=18,gpio_out_pin=22' | sudo tee -a /boot/config.txt
#sudo modprobe lirc_rpi
echo lirc_dev | sudo tee -a /etc/modules
echo lirc_rpi gpio_in_pin=18 gpio_out_pin=22 | sudo tee -a /etc/modules
sudo cp -avi ./hardware.conf /etc/lirc/
sudo mv -vi /etc/lirc/lircd.conf /etc/lirc/lircd.conf.bak
exit 99;
#sudo /etc/init.d/lirc stop 
#mode2 -d /dev/lirc0
#sudo /etc/init.d/lirc restart 
#irrecord --disable-namespace --force --device=/dev/lirc0 apple_remote
#irw 
#irsend SEND_ONCE apple_remote up

