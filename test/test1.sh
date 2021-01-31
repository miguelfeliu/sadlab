#!/bin/sh

echo Iniciando test

echo Iniciando frontend...
gnome-terminal -e "node ../frontend/index.js"
sleep 0.5

echo Iniciando broker...
gnome-terminal -e "node ../lbbroker/broker.js"
sleep 0.5

echo Iniciando cola A...
gnome-terminal -e "node ../queue/queue.js queueA 8123"
sleep 0.5

echo Iniciando cola B...
gnome-terminal -e "node ../queue/queue.js queueB 8124"
sleep 0.5

echo Iniciando cola C...
gnome-terminal -e "node ../queue/queue.js queueC 8125"
sleep 0.5

echo Iniciando un worker...
gnome-terminal -e "node ../worker/worker.js"
sleep 0.5

echo Iniciando un worker...
gnome-terminal -e "node ../worker/worker.js"
sleep 0.5

echo Iniciando un worker...
gnome-terminal -e "node ../worker/worker.js"
sleep 0.5

curl --header "Content-Type: application/json" \
  --request POST \
  --data '{"message":"Hola mundo"}' \
  http://localhost:3000/echo

sleep 20