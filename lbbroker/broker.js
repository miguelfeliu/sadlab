const zmq = require('zeromq/v5-compat');
const client_worker_socket = zmq.socket('rep');
const queue_for_ip_socket = zmq.socket('pull');
const cliente_queue_socket = zmq.socket('push');

// array con las ip de las colas, tanto para recibir clientes como worker
const queuesIP = [];

// coneccion de los diferntes sockets
client_worker_socket.bind('tcp://*:8009');
queue_for_ip_socket.bind('tcp://*:8008');

// recibimos las ip mediante el push de las colas
queue_for_ip_socket.on('message', (data) => {    
    const parsed_data = JSON.parse(data);
    if (parsed_data.type === 'new') {
        // creo un objeto para la ip worker
        const queueip = {   
            nodo: parsed_data.message.id ,         
            ipworker: parsed_data.message.worker ,
            ipclient: parsed_data.message.client            
        };       
        // meto las ip en el array        
        queuesIP.push(queueip);
        //conecto la cola nueva al broker
        cliente_queue_socket.connect(queueip.ipclient);
    } 
});

// WORKER NUEVO SOLICITA UNA COLA
client_worker_socket.on('message', (data) => {
    const parsed_data = JSON.parse(data);
    if(parsed_data.type === 'worker')
    {
        client_worker_socket.send(queuesIP[0].ipworker);
    }    
    else {
        client_worker_socket.send(queuesIP[0].ipclient);
    }     
});
