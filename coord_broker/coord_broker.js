const zmq = require('zeromq/v5-compat');

// queue sockets
const queue_xsub = zmq.socket('xsub');
const queue_xpub = zmq.socket('xpub');

//bind
queue_xsub.bind('tcp://*:5556');
queue_xpub.bind('tcp://*:5555');

var assossiation_queue_workers = {};

queue_xsub.on('message', (topic, data) => {
    const parsed_data = JSON.parse(data.toString());
    console.log('Received workers from', parsed_data.id);
    assossiation_queue_workers[parsed_data.id] = parsed_data.workers;
    queue_xpub.send([topic, JSON.stringify(assossiation_queue_workers)]);
});

queue_xpub.on('message', (data, bla) => {
    // The data is a slow Buffer
    // The first byte is the subscribe (1) /unsubscribe flag (0)
    let type = data[0]===0 ? 'unsubscribe' : 'subscribe';
    // The channel name is the rest of the buffer
    let channel = data.slice(1).toString();
    console.log('XPUB REC-> ' + type + ':' + channel);
    // We send it to subSock, so it knows to what channels to listen to
    queue_xsub.send(data);
  });
