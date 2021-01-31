const zmq = require('zeromq/v5-compat');

// queue sockets
const queue_xsub = zmq.socket('xsub');
const queue_xpub = zmq.socket('xpub');

// bind
const xsub_bind_addr = process.env.XSUB_BIND || 'tcp://*:5556';
queue_xsub.bind(xsub_bind_addr);
const xpub_bind_addr = process.env.XPUB_BIND || 'tcp://*:5555';
queue_xpub.bind(xpub_bind_addr);

const assossiation_queue_workers = new Map();

// init coord_broker
console.log('Coordinador en marcha!');

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
});

queue_xpub.on('message', (data, bla) => {
    var type = data[0]===0 ? 'unsubscribe' : 'subscribe';
    
    var channel = data.slice(1).toString();
    
    queue_xsub.send(data);
  });

  setInterval(() => {
      print_assossiation_queue_workers();
  }, 5000);
  