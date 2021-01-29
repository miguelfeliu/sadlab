const zmq = require('zeromq/v5-compat');

// brokers sockets
const broker_push_init = zmq.socket('push');
const broker_pull = zmq.socket('pull');
// workers sockets
const workers_router = zmq.socket('router');
// queues sockets
const push_to_queue1 = zmq.socket('push');
const pull_from_queue1 = zmq.socket('pull');
const push_to_queue2 = zmq.socket('push');
const pull_from_queue2 = zmq.socket('pull');

// bind network data
const BROKER_PULL_IP = '127.0.0.1:8001';
const WORKERS_ROUTER_IP = '127.0.0.1:8002';
const PULL_FROM_QUEUE1_IP = '127.0.0.1:8003';
const PULL_FROM_QUEUE2_IP = '127.0.0.1:8004';

// connect network data
const BROKER_PUSH_INIT_IP = '127.0.0.1:8000';
const PUSH_TO_QUEUE1 = '127.0.0.1:8000';
const PUSH_TO_QUEUE2 = '127.0.0.1:8000';

// queues data
const my_workers = [];
const jobs = [];
// const other_workers = new Map(); // map { queue_ip -> length de la lista de workers }
// other_workers.set(SUB1_IP, 0);
// other_workers.set(SUB2_IP, 0);

// bind
broker_pull.bind('tcp://' + BROKER_PULL_IP);
workers_router.bind('tcp://' + WORKERS_ROUTER_IP);
pull_from_queue1.bind('tcp://' + PULL_FROM_QUEUE1_IP);
pull_from_queue2.bind('tcp://' + PULL_FROM_QUEUE2_IP);

// connect
broker_push_init.connect('tcp://' + BROKER_PUSH_INIT_IP);
push_to_queue1.connect('tcp://' + PUSH_TO_QUEUE1);
push_to_queue2.connect('tcp://' + PUSH_TO_QUEUE2);

// send pull ip to the broker
broker_push_init.send({
    ip: BROKER_PULL_IP
});

// functions
function notifyChange() {
    const data = {
        type: 'notify_change',
        ip: PUB_IP,
        workers: my_workers
    };
    push_to_queue1.send(JSON.stringify(data));
    push_to_queue2.send(JSON.stringify(data));
}

// broker
broker_pull.on('message', data => {
    const parsed_data = JSON.parse(data);
    if (my_workers.length == 0) {
        other_workers.forEach((num_workers, queue_id_string) => {
            if (num_workers > 0) {

            }
        });
    }
});

// queue
pull_from_queue1.on('message', data => {
    const parsed_data = JSON.parse(data);
    other_workers.get(parsed_data.ip) = parsed_data.amount_workers;
});

pull_from_queue2.on('message', data => {
    const parsed_data = JSON.parse(data);
    other_workers.get(parsed_data.ip) = parsed_data.amount_workers;
});

// worker
workers_router.on('message', (worker_id, del, data) => {
    const parsed_data = JSON.parse(data);
    if (parsed_data.type === 'new') {
        if (jobs.length === 0) {
            my_workers.push(JSON.stringify(worker_id));
            notifyChange();
        } else {

        }
    } else if (parsed_data.type === 'response') {

    }
});
