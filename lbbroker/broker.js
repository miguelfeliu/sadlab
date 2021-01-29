const zmq = require('zeromq/v5-compat');

// workers sockets
const worker_push = zmq.socket('push');
const worker_pull = zmq.socket('pull');

// frontend sockets
const frontend_push = zmq.socket('push');
const frontend_pull = zmq.socket('pull');

// queue sockets
const queue_pub = zmq.socket('pub');
const queue_pull = zmq.socket('pull');

// round robin queues
const round_robin_queues_ip_workers = []; // las ips de los socket pull donde recibiran las colas

const round_robin_queue_topics_requests = ['queueA', 'queueB', 'queueC']; // los ids del socket router

// functions
function get_next_queue_ip_for_workers() {
    const queue_ip = round_robin_queues_ip_workers.shift();
    round_robin_queues_ip_workers.push(queue_ip);
    return queue_ip;
}

function get_next_queue_for_requests() {
    const queue_ip = round_robin_queue_topics_requests.shift();
    round_robin_queue_topics_requests.push(queue_ip);
    // return queue_ip;
    return 'queueA';
}

console.log('Broker en marcha!');

// bind
// frontend
frontend_pull.bind('tcp://*:8009');
// worker

// queue
queue_pub.bind('tcp://*:8447');

// connect
// frontend
frontend_push.connect('tcp://localhost:8008');
// worker

// queue

// worker
worker_pull.on('message', data => {
    const parsed_data = JSON.parse(data);
    if (parsed_data.type === 'request_queue_ip') {
        const queue_ip = get_next_queue_ip_for_workers();
        worker_push.send({
            queue_ip: queue_ip
        });
    }
    else if (parsed_data.type === 'job_finished') {
        frontend_push.send(data);
    }
});

// frontend
frontend_pull.on('message', data => {
    const parsed_data = JSON.parse(data);
    const queue_topic = get_next_queue_for_requests();
    queue_pub.send([queue_topic, JSON.stringify(data)]);
});
