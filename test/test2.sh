echo Iniciando test

echo Iniciando frontend...
start node ../frontend/index.js
sleep 0.5

echo Iniciando broker...
start node ../lbbroker/broker.js
sleep 0.5

echo Iniciando cola A...
start node ../queue/queue.js queueA 8123
sleep 0.5

echo Iniciando cola B...
start node ../queue/queue.js queueB 8124
sleep 0.5

echo Iniciando cola C...
start node ../queue/queue.js queueC 8125
sleep 0.5

echo Realizamos una petición en una nueva ventana
start ./test2_aux.sh
sleep 0.5

echo Iniciando un worker...
start node ../worker/worker.js
sleep 0.5

echo Iniciando un worker...
start node ../worker/worker.js
sleep 0.5

echo Iniciando un worker...
start node ../worker/worker.js
sleep 0.5

sleep 60