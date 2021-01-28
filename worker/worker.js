const zmq = require('zeromq');
const req = zmq.socket('req');

req.connect('tcp://localhost:8001');

req.send(['', '', '']);

req.on('message', (c, sep, msg)=> {
    console.log('Processing... ', JSON.parse(msg));
	req.send([c,'',msg])
})
