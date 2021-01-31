node ../../worker/worker.js &
pid_worker = $!
# esperamos a que todos los workers esten levantados
sleep 10
kill -9 $pid_worker
