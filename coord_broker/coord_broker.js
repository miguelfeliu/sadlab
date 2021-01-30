const zmq = require('zeromq/v5-compat');

const xsub = zmq.socket('xsub');
const subListener = 'tcp://*:5556';
xsub.bind(subListener);

const xpub = zmq.socket('xpub');
const pubListener = 'tcp://*:5555';
xpub.bind(pubListener);

var workers = {};

xsub.on('message', (topic, data) => {
    const parsed_data = JSON.parse(data.toString());
    console.log('Received workers from', parsed_data.id);
    workers[parsed_data.id] = parsed_data.workers
    // workers = workers.concat(args);
    xpub.send([topic, JSON.stringify(workers)]);
});

xpub.on('message', function(data, bla) {
    // The data is a slow Buffer
    // The first byte is the subscribe (1) /unsubscribe flag (0)
    var type = data[0]===0 ? 'unsubscribe' : 'subscribe';
    // The channel name is the rest of the buffer
    var channel = data.slice(1).toString();
    console.log('XPUB REC-> ' + type + ':' + channel);
    // We send it to subSock, so it knows to what channels to listen to
    xsub.send(data);
  });