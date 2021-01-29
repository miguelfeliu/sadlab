const zmq = require('zeromq/v5-compat');

// workers sockets
const worker_router = zmq.socket('router');

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
worker_router.bind('tcp://*:8558');
// queue
queue_pub.bind('tcp://*:8447');
queue_pull.bind('tcp://*:8111');
// connect
// frontend
frontend_push.connect('tcp://localhost:8008');
// worker

// zeromq functions
// worker
worker_router.on('message', (worker_id, del, data) => {
    const parsed_data = JSON.parse(data);
    console.log('Request from worker:', parsed_data);
    if (parsed_data.type === 'request_queue_ip') {
        const queue_ip = get_next_queue_ip_for_workers();
        worker_router.send([worker_id, del, JSON.stringify({
            queue_ip: queue_ip
        })]);
    }
    else if (parsed_data.type === 'job_finished') {
        frontend_push.send(data);
    }
});

// frontend
frontend_pull.on('message', data => {
    const parsed_data = JSON.parse(data);
    const queue_topic = get_next_queue_for_requests();
    queue_pub.send([queue_topic, JSON.stringify(parsed_data)]);
});

// queue
queue_pull.on('message', data => {
    const parsed_data = JSON.parse(data);
    console.log('entra en queue_pull');
    if (parsed_data.type === 'init_queue') {
        const workers_router_ip = 'tcp://localhost:' + parsed_data.port_worker_to_queue;
        console.log('ip', workers_router_ip);
        round_robin_queues_ip_workers.push(workers_router_ip);
    }
    else if (parsed_data.type === 'response') {
        console.log('enviando petición resuelta al frontend desde el broker');
        frontend_push.send(JSON.stringify(parsed_data));
    }
    
});