const zmq = require('zeromq');
const req_broker = zmq.socket('req');
const req_queue = zmq.socket('req');

req_broker.connect('tcp://localhost:8009');

const data = {   
    type: 'worker'        
}; 

req_broker.send(JSON.stringify(data));

req_broker.on('message', (data) => {
    const parsed_data = JSON.parse(data);            
    req_queue.connect(parsed_data.ipworker);
    req_queue.send(['', '', '']);
})

req_queue.on('message', (c, sep, msg) => {
    console.log('Processing... ', JSON.parse(msg));
	req_queue.send([c, '', msg])
})