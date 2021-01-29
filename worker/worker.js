const zmq = require('zeromq/v5-compat');
const req_broker = zmq.socket('req');
const req_queue = zmq.socket('req');

req_broker.connect('tcp://localhost:8558');

req_broker.on('message', data => {
    const parsed_data = JSON.parse(data);
    console.log('Processing... ', parsed_data);
    req_queue.connect(parsed_data.queue_ip); // 'tcp://localhost:8123'
    req_queue.send(JSON.stringify({
        type: 'new'
    }));
})

// the worker asks to the broker for the queue ip
req_broker.send(JSON.stringify({
    type: 'request_queue_ip'
}));
