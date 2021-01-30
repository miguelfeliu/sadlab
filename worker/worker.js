const zmq = require('zeromq/v5-compat');
const req_broker = zmq.socket('req');
const req_queue = zmq.socket('req');

req_broker.connect('tcp://localhost:8558');

req_broker.on('message', data => {
    const parsed_data = JSON.parse(data);
    console.log('Processing... ', parsed_data);
    req_queue.connect(parsed_data.queue_ip); // 'tcp://localhost:8123'
    console.log('identity:', req_queue.identity);
    console.log('identity:', req_queue.id);
    req_queue.send(JSON.stringify({
        type: 'new'
    }));
})

req_queue.on('message', data => {
    const parsed_data = JSON.parse(data);
    console.log('data del cliente', parsed_data);
    req_queue.send(JSON.stringify({
        type: 'response',
        message: parsed_data.message,
        id: parsed_data.id
    }));
});

// the worker asks to the broker for the queue ip
req_broker.send(JSON.stringify({
    type: 'request_queue_ip'
}));
