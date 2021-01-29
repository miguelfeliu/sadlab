const zmq = require('zeromq/v5-compat');
const req = zmq.socket('req');

req.bindSync('tcp://127.0.0.1:8001');
// req.send('Hola2')
req.on('message', message => {
    console.log(message + '');
    req.send('Hola2')
});