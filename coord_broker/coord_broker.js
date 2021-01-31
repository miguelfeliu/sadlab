const zmq = require('zeromq/v5-compat');

// queue sockets
const queue_xsub = zmq.socket('xsub');
const queue_xpub = zmq.socket('xpub');

// bind
queue_xsub.bind('tcp://*:5556');
queue_xpub.bind('tcp://*:5555');

const assossiation_queue_workers = new Map();

// functions
function print_assossiation_queue_workers() {
    assossiation_queue_workers.forEach((num_workers, queue_name) => {
        console.log('Asociación colas -> num_workers:');
        console.log(queue_name, ': ', num_workers);
    });
}

function send_queue_status(topic) {
    const list_queue_workers = [];
        assossiation_queue_workers.forEach((num_workers, queue_name) => {
            list_queue_workers.push({
                queue_name: queue_name,
                num_workers: num_workers
            });
        });
    queue_xpub.send([topic, JSON.stringify({
        type: 'queue_status',
        queues: list_queue_workers
    })]);
}

// queue
queue_xsub.on('message', (topic, data) => {
    const parsed_data = JSON.parse(data);
    if (parsed_data.type === 'queue_status') {
        assossiation_queue_workers.set(parsed_data.queue_name, parsed_data.num_workers);
        send_queue_status(topic);
    }
    else if (parsed_data.type === 'job') {
        queue_xpub.send([topic, JSON.stringify(parsed_data)]);
    }
    /*else if (parsed_data.type === 'heartbeat') {
        console.log('heartbeat parsed data', parsed_data);
        const index_of_alive_queue = queues_pending_for_heatbeat.indexOf(parsed_data.queue_name);
        queues_pending_for_heatbeat = queues_pending_for_heatbeat.splice(index_of_alive_queue, 1);
    }*/
});

queue_xpub.on('message', (data, bla) => {
    // The data is a slow Buffer
    // The first byte is the subscribe (1) /unsubscribe flag (0)
    var type = data[0]===0 ? 'unsubscribe' : 'subscribe';
    // The channel name is the rest of the buffer
    var channel = data.slice(1).toString();
    console.log('XPUB REC-> ' + type + ':' + channel);
    // We send it to subSock, so it knows to what channels to listen to
    queue_xsub.send(data);
  });

  setInterval(() => {
      print_assossiation_queue_workers();
  }, 5000);
  