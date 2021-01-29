const zmq = require('zeromq/v5-compat');
const worker_socket = zmq.socket('rep');
const queue_for_ip_socket = zmq.socket('pull');
const client_queue_socket = zmq.socket('push');
const client_socket = zmq.socket('router');

// array con las ip de las colas, tanto para recibir clientes como worker
const queuesIp = [];

var count = 0;
// coneccion de los diferntes sockets
client_socket.bind('tcp://*:8007');
worker_socket.bind('tcp://*:8009');
queue_for_ip_socket.bind('tcp://*:8008');

// recibimos las ip mediante el push de las colas
queue_for_ip_socket.on('message', (data) => {    
    const parsed_data = JSON.parse(data);
    if (parsed_data.type === 'new') {
        // creo un objeto para la ip worker
        const queueip = {       
            ip: parsed_data.ip  
        };       
        // meto las ip en el array        
        queuesIp.push(queueip);
        //conecto la cola nueva al broker
        client_queue_socket.connect(queueip.ipclient);
    } 
});

// WORKER NUEVO SOLICITA UNA COLA
worker_socket.on('message', (data) => {
    const parsed_data = JSON.parse(data);
    if (parsed_data.type === 'worker') {
        worker_socket.send(queuesIp[count % queuesIp.length].ip);
        count++;
    }   
});

client_socket.on('message', (data) => {
    client_queue_socket.send(data)
    count++;
});
