node ../../worker/worker.js &
pid_worker = $!
sleep 10
kill -9 $pid_worker
