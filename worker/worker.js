const zmq = require('zeromq/v5-compat');
const req_broker = zmq.socket('req');
const req_queue = zmq.socket('req');

req_broker.connect('tcp://localhost:8558');

req_broker.on('message', data => {
    const parsed_data = JSON.parse(data);
    req_queue.connect(parsed_data.queue_ip);
    req_queue.send(JSON.stringify({
        type: 'new'
    }));
})

req_queue.on('message', data => {
    const parsed_data = JSON.parse(data);
    console.log('llega7', parsed_data);
    req_queue.send(JSON.stringify({
        type: 'response',
        ...parsed_data
    }));
});

// the worker asks to the broker for the queue ip
req_broker.send(JSON.stringify({
    type: 'request_queue_ip'
}));
