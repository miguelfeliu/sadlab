const zmq = require('zeromq/v5-compat');
const req_broker = zmq.socket('req');
const req_queue = zmq.socket('req');

const wr_conn_addr = process.env.BROKER_REQ_CONN || 'tcp://localhost:8558';
req_broker.connect(wr_conn_addr);

// init worker
console.log('Worker en marcha!');

req_broker.on('message', data => {
    const parsed_data = JSON.parse(data);
    req_queue.connect(parsed_data.queue_ip);
    req_queue.send(JSON.stringify({
        type: 'new'
    }));
})

req_queue.on('message', data => {
    let parsed_data = JSON.parse(data);
    if (parsed_data.type === 'request_job') {
        console.log('Procesando', parsed_data);
        parsed_data.type = 'response';
        req_queue.send(JSON.stringify(parsed_data));
    }
    else if (parsed_data.type === 'heartbeat') {
        req_queue.send(JSON.stringify({
            type: 'heartbeat'
        }));
    }
});

// the worker asks to the broker for the queue ip
req_broker.send(JSON.stringify({
    type: 'request_queue_ip'
}));
