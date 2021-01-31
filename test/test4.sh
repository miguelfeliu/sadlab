echo Iniciando test

echo Iniciando frontend...
node ../frontend/index.js &
sleep 0.5 &

echo Iniciando broker... &
node ../lbbroker/broker.js &
sleep 0.5 &

echo Iniciando cola A... &
node ../queue/queue.js queueA 8123 &
sleep 0.5 &

echo Iniciando cola B... &
node ../queue/queue.js queueB 8124 &
sleep 0.5 &

echo Iniciando cola C... &
node ../queue/queue.js queueC 8125 &
sleep 0.5 &

echo Iniciando un worker... &
node ../worker/worker.js &
sleep 0.5 &

echo Iniciando un worker... &
node ../worker/worker.js &
sleep 0.5 &

echo Iniciando un worker... &
node ../worker/worker.js &
sleep 0.5