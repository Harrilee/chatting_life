#!/bin/sh

# echo "Connecting to device"
adb connect 172.25.194.242
echo "Execute adb script"
adb shell "su -c cp /data/data/com.tencent.mm/MicroMsg/26de9e3622003c181e176b856e19af12/EnMicroMsg.db /sdcard"

echo "Copy database from device"
adb pull /sdcard/EnMicroMsg.db .

python3 data_processing_new.py