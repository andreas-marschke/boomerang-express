#!/bin/sh
### BEGIN INIT INFO
# Provides:          skeleton
# Required-Start:    $remote_fs $syslog
# Required-Stop:     $remote_fs $syslog
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: Example initscript
# Description:       This file should be used to construct scripts to be
#                    placed in /etc/init.d.
### END INIT INFO

# Author: Foo Bar <foobar@baz.org>
#
# Please remove the "Author" lines above and replace them
# with your own name if you copy and modify this script.

# Do NOT "set -e"

LOG_DIR="/var/log/nodejs"

# Path where boomerang-express is installed
APP_PATH="/opt/nodejs/boomerang-express"

# STDERR to file:
STDERR="$LOG_DIR/boomerang-express.stderr"

# STDOUT to file: 
STDOUT="$LOG_DIR/boomerang-express.stdout"

# forever logs to:
LOG="$LOG_DIR/boomerang-express.forever"

# basepath for pids etc.:
BASEPATH="/var/run/nodejs/"

# pidfile is saved at: 
PIDFILE="$BASEPATH/boomerang-express.pid"

# Max retries: 
MAX=3

# minUptime
MINUPTIME="100ms"

# spinSleepTime
SPINSLEEPTIME="1000ms"

EXTRA_ARGS="--append --no-colors"

PATH=/sbin:/usr/sbin:/bin:/usr/bin
DESC="NodeJS: Boomerang-Express - logs away boomerang GET requests"
NAME=boomerang-express
SCRIPTNAME=/etc/init.d/$NAME

[ -r /etc/default/$NAME ] && . /etc/default/$NAME

DAEMON=$APP_PATH/node_modules/forever/bin/forever

do_start() {
    $DAEMON start -m $MAX -l $LOG -o $STDOUT -e $STDERR -p $BASEPATH --pidFile $PIDFILE --minUptime $MINUPTIME --spinSleepTime $SPINSLEEPTIME $EXTRA_ARGS $APP_PATH/app.js || return 1
}

do_stop() {
    $DAEMON stop -m $MAX -l $LOG -o $STDOUT -e $STDERR -p $BASEPATH --pidFile $PIDFILE  --minUptime $MINUPTIME --spinSleepTime $SPINSLEEPTIME $EXTRA_ARGS $APP_PATH/app.js || return 1
}

do_restart() {
    $DAEMON restart -m $MAX -l $LOG -o $STDOUT -e $STDERR -p $BASEPATH --pidFile $PIDFILE  --minUptime $MINUPTIME --spinSleepTime $SPINSLEEPTIME $EXTRA_ARGS $APP_PATH/app.js || return 1
}

do_list() {
    $DAEMON list || return 1
}

case "$1" in
    start)
	do_start
	;;
    stop)
	do_stop
	;;
    restart)
	do_restart
	;;
    list)
	do_list
	;;
    *)
	echo "Usage: $SCRIPTNAME {start|stop|stopall|restart|restartall|list}" >&2
	;;
esac

:
