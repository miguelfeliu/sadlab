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
const round_robin_queue_topics_requests = ['queueA', 'queueB', 'queueC'];

// functions
function get_next_queue_ip_for_workers() {
    const queue_ip = round_robin_queues_ip_workers.shift();
    round_robin_queues_ip_workers.push(queue_ip);
    return queue_ip;
}

function get_next_queue_for_requests() {
    const queue_ip = round_robin_queue_topics_requests.shift();
    round_robin_queue_topics_requests.push(queue_ip);
    return queue_ip;
}

// bind
// frontend
const fe_bind = process.env.FRONT_PULL_BIND || 'tcp://*:8009';
frontend_pull.bind(fe_bind);
// worker
const wo_bind = process.env.WORKER_ROUTER_BIND || 'tcp://*:8558';
worker_router.bind(wo_bind);
// queue
const qu_pub_bind = process.env.QUEUE_PUB_BIND || 'tcp://*:8447';
queue_pub.bind(qu_pub_bind);
const qu_pull_bind = process.env.QUEUE_PULL_BIND || 'tcp://*:8111';
queue_pull.bind(qu_pull_bind);

// connect
// frontend
const fe_push_conn = process.env.FRONT_PUSH_CONN || 'tcp://localhost:8008';
frontend_push.connect(fe_push_conn);

// init broker
console.log('Broker en marcha!');

// zeromq functions
// worker
worker_router.on('message', (worker_id, del, data) => {
    const parsed_data = JSON.parse(data);
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
    if (parsed_data.type === 'init_queue') {
        let full_ip = parsed_data.ip_worker_to_queue;
        round_robin_queues_ip_workers.push(full_ip);
    }
    else if (parsed_data.type === 'response') {
        frontend_push.send(JSON.stringify(parsed_data));
    }
});
