#!/bin/bash
# genmon pacman update notifier and processor
# requires: xfce4-genmon-plugin pacman-contrib expac

##############################################################
# CONFIGURABLE ITEMS
#
# panel icon to use when updates are available
ICON_UPDATES_AVAILABLE="mintupdate-updates-available"
#
# panel icon to use when system is up to date
#
ICON_UPTODATE="mintupdate-up-to-date"
#
# icon to use in notification bubble when notifying of updates
ICON_NOTIFY="mintupdate-updates-available"
#
# location of secondary execution file
YUP2="/tmp/yup2"
##############################################################

# create secondary execution file to run pacman and refresh plugin
cat << EOF > $YUP2
#!/bin/bash
sudo pacman -Syu
echo 
echo \"===== Done - Press enter to exit =====\"
read
xfce4-panel --plugin-event=genmon-$(xfconf-query -c xfce4-panel -lv | grep pac$ | awk '{print $1}' | tr -dc '0-9'):refresh:bool:true
exit 0
EOF
chmod +x $YUP2

# get updates informtation
LU=$(checkupdates)
LIST_UPDATES=$(echo $LU | sed 's/ /\n/4;P;D')
NUM_UPDATES=$(echo $LU | sed 's/ /\n/4;P;D' | sed '/^$/d' | wc -l)

# get info for summary text in tooltip
PINS=$(sed -n "/ installed $1/{s/].*/]/p;q}" /var/log/pacman.log | tr -d '[]' | sed 's/T/ /' | sed 's/+.*//')
PTOT=$(pacman -Q | wc -l)
PFOR=$(pacman -Qm | wc -l)
PEXP=$(pacman -Qe | wc -l)
PORP=$(pacman -Qdtq | wc -l)
PSIZ=$(expac "%n %m" | sort -gk2 | awk '{sum+=$2} END {printf "%.2f GiB\n", sum/2^30}')

# create summary string
SUMMARY="Install date: $PINS

Total installed packages: $PTOT
Foreign installed packages: $PFOR
Explicitly installed packages: $PEXP
Orphaned packages: $PORP

Total size of installed packages: $PSIZ"

# if updates exist, change icon and notify
if [ $NUM_UPDATES -gt 0 ]; then
	ICON=$ICON_UPDATES_AVAILABLE
	notify-send -i $ICON_NOTIFY "System Status" "Updates are available"
else
	ICON=$ICON_UPTODATE
fi

#################### do the genmon
# icon to display in pane
echo "<icon>$ICON</icon>"
# command to run when icon is clicked
echo -e "<iconclick>xfce4-terminal -T 'Sysytem Update' --color-bg '#032665' --color-text orange --icon update -e $YUP2</iconclick>"
# if updates exist, show them
if [[ $NUM_UPDATES -gt 0 ]]; then
	echo "<tool><b>---=== Updates available ===---</b>"
	echo " "
	echo "$LIST_UPDATES"
# otherwise show pacman summary
else
	echo "<tool><b>---=== System is up to date ===---</b>"
	echo " "
	echo "$SUMMARY"
fi
echo " "
# last updated stamp
echo "<small><i>Last checked: $(date)</i></small></tool>"
####################

exit 0

