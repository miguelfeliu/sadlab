const zmq = require('zeromq/v5-compat');

// brokers sockets
const broker_push = zmq.socket('push');
const broker_sub = zmq.socket('sub');
// workers sockets
const workers_router = zmq.socket('router');
// queues sockets
const push_to_queue1 = zmq.socket('push');
const push_to_queue2 = zmq.socket('push');
const queues_router = zmq.socket('router');

const coord_sub = zmq.socket('sub');
const coord_pub = zmq.socket('pub');

const my_args = process.argv.slice(2);

// bind network data
/*const BROKER_PULL_IP = '127.0.0.1:8001';
const WORKERS_ROUTER_IP = '127.0.0.1:8002';
const QUEUES_ROUTER_IP = '127.0.0.1:8003';*/

// connect network data
/*const BROKER_PUSH_INIT_IP = '127.0.0.1:8000';
const PUSH_TO_QUEUE1 = '127.0.0.1:8000';
const PUSH_TO_QUEUE2 = '127.0.0.1:8000';*/
const workers_router_port = my_args[1];//'8123';
const workers_router_ip = 'tcp://*:' + workers_router_port;

// queues data
const queue_topic = my_args[0];
const my_workers = [];
const jobs = [];
const assossiation_queue_workers = new Map(); // map { queue_id -> num workers }
var workers_global = {};

// bind
workers_router.bind(workers_router_ip);
/*workers_router.bind('tcp://' + WORKERS_ROUTER_IP);
queues_router.bind('tcp://' + QUEUES_ROUTER_IP);*/

// connect
broker_sub.connect('tcp://localhost:8447');
broker_push.connect('tcp://localhost:8111');
/*;
push_to_queue1.connect('tcp://' + PUSH_TO_QUEUE1);
push_to_queue2.connect('tcp://' + PUSH_TO_QUEUE2);*/

// init queue
broker_push.send(JSON.stringify({
    type: 'init_queue',
    port_worker_to_queue: workers_router_port
}));

// functions
/*function notifyChange() {
    const data = {
        type: 'notify_change',
        ip: PUB_IP,
        workers: my_workers
    };
    assossiation_queue_workers.forEach((num_workers, queue_id_string) => {
        queues_router.send([Buffer.from(JSON.parse(queue_id_string)), JSON.stringify(data)]);
    });
}*/

// broker
broker_sub.subscribe(queue_topic);
broker_sub.on('message', (topic, data) => {
    const parsed_data = JSON.parse(data);
    console.log('data:', parsed_data);
    // no hay workers disponibles
    if (my_workers.length === 0) {
        let found = false;
        for (let i = 0; i < assossiation_queue_workers.size; i++) {
            if (num_workers > 0) {
                queues_router.send([Buffer.from(JSON.parse(queue_id_string)), JSON.stringify(parsed_data)]);
                found = true;
                break;
            }
        }
        if (!found) {
            console.log('entra en found');
            jobs.push(parsed_data);
        }
    }
    // hay workers disponibles localmente
    else {
        let worker_id = my_workers.shift();
        workers_router.send([Buffer.from(JSON.parse(worker_id)), '', JSON.stringify(parsed_data)]);
    }
});

/*
// queue
queues_router.on('message', (queue_id, data) => {
    const parsed_data = JSON.parse(data);
    assossiation_queue_workers.get(parsed_data.ip) = parsed_data.amount_workers;
});
*/

// worker
workers_router.on('message', (worker_id, del, data) => {
    const parsed_data = JSON.parse(data);
    // entra un nuevo worker a la cola
    if (parsed_data.type === 'new') {
        console.log('a worker has joined');
        if (jobs.length === 0) {
            console.log('No hay trabajos, guardamos worker');
            my_workers.push(JSON.stringify(worker_id));
            // notifyChange();
        } else {
            const job = jobs.shift();
            workers_router.send([worker_id, del, JSON.stringify(job)]);
        }
    }
    // el worker ha finalizado su trabajo
    else if (parsed_data.type === 'response') {
        broker_push.send(JSON.stringify({
            type: 'response',
            ...parsed_data
        }));
        my_workers.push(JSON.stringify(worker_id));
    }
});

coord_sub.subscribe('DATA');
coord_sub.connect('tcp://127.0.0.1:5555');

coord_sub.on('message', function(topic, data) {
    const parsed_data = JSON.parse(data);
    workers_global = parsed_data;
    console.log(topic.toString(), workers_global);
});

coord_pub.connect('tcp://127.0.0.1:5556');

setInterval(function () {
    let msg = {
        id: queue_topic,
        workers: my_workers
    };
    coord_pub.send(['DATA ', JSON.stringify(msg)])}, 10000);

