echo Realizando petición

curl --header "Content-Type: application/json" \
  --request POST \
  --data '{"message":"Hola mundo"}' \
  http://localhost:3000/echo
  
sleep 60
