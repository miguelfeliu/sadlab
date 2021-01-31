echo Iniciando test

echo Iniciando frontend...
gnome-terminal -e "node ../../frontend/index.js"
sleep 0.5

echo Iniciando broker balanceador de carga...
gnome-terminal -e "node ../../lbbroker/broker.js"
sleep 0.5

echo Iniciando broker de coordinación...
gnome-terminal -e "node ../../coord_broker/coord_broker.js"
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

echo Iniciando un worker que se conectará a la cola A...
gnome-terminal -e "./test3_aux.sh"
sleep 2

echo Iniciando un workerque se conectará a la cola B...
gnome-terminal -e "node ../../worker/worker.js"
sleep 2

echo Iniciando un worker que se conectará a la cola C...
gnome-terminal -e "node ../../worker/worker.js"
sleep 2

# esperamos a que el primer worker que se ha conectado se desconecte
sleep 20

curl --header "Content-Type: application/json" \
  --request POST \
  --data '{"message":"Hola mundo"}' \
  http://localhost:3000/echo

sleep 60
