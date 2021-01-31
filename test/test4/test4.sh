echo Iniciando test

echo Iniciando frontend...
gnome-terminal -e "node ../../frontend/index.js"
sleep 0.5

echo Iniciando broker balanceador de carga...
gnome-terminal -e "node ../../lbbroker/broker.js"
sleep 0.5

echo Iniciando broker de coordinación...
gnome-terminal -e "node ../../../coord_broker/coord_broker.js"
sleep 0.5

echo Iniciando cola A...
gnome-terminal -e "node ../../queue/queue.js queueA 8123"
sleep 0.5

echo Iniciando cola B...
gnome-terminal -e "node ../../queue/queue.js queueB 8124"
sleep 0.5

echo Iniciando cola C...
gnome-terminal -e "node ../../queue/queue.js queueC 8125"
sleep 0.5

echo Iniciando un worker...
gnome-terminal -e "node ../../worker/worker.js"
sleep 10

echo Iniciando un worker...
gnome-terminal -e "node ../../worker/worker.js"
sleep 10

echo Iniciando un worker...
gnome-terminal -e "node ../../worker/worker.js"
sleep 10

sleep 60
