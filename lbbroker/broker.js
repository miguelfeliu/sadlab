const zmq = require('zeromq/v5-compat');

// workers sockets
const worker_socket = zmq.socket('rep');

// frontend sockets
const frontend_push = zmq.socket('push');
const frontend_pull = zmq.socket('pull');

// queue sockets
const queue_push = zmq.socket('push');
const queue_pull = zmq.socket('pull');


// array con las ip de las colas, tanto para recibir clientes como worker
const queuesIp = [];

console.log('Broker en marcha!');
var count = 0;
// coneccion de los diferntes sockets
client_socket.bind('tcp://*:8007');

/*worker_socket.bind('tcp://*:8009');
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
});*/

client_socket.on('message', (client_id, del, data) => {
    console.log('client_id:', JSON.stringify(client_id));
    console.log('data: ', JSON.parse(data));
    client_socket.send([client_id, del, {
        texto: 'Hola mundo'
    }]);
    // client_queue_socket.send(data);
    count++;
});
