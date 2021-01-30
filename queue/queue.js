const zmq = require('zeromq/v5-compat');

// brokers sockets
const broker_push = zmq.socket('push');
const broker_sub = zmq.socket('sub');
// workers sockets
const worker_router = zmq.socket('router');
// queues sockets
const push_to_queue1 = zmq.socket('push');
const push_to_queue2 = zmq.socket('push');
const queue_router = zmq.socket('pull');

const workers_router_port = '8123';
const workers_router_ip = 'tcp://*:' + workers_router_port;

// queues data
const queue_topic = my_args[0];
const my_workers = [];
const jobs = [];
const assossiation_queue_name_queue_id = new Map();
const assossiation_queue_workers = new Map(); // map { queue_id -> num workers }
const my_args = process.argv.slice(2);

// bind
// bind worker
worker_router.bind(workers_router_ip);
// bind queue
queue_router.bind(my_args[1]);

// connect
// connect queue
push_to_queue1.connect(my_args[2]);
push_to_queue2.connect(my_args[3]);
// connect broker
broker_sub.connect('tcp://localhost:8447');
broker_push.connect('tcp://localhost:8111');

// init queue
broker_push.send(JSON.stringify({
    type: 'init_queue',
    port_worker_to_queue: workers_router_port
}));

push_to_queue1.send(JSON.stringify({
    type: 'init_queue',
    queue_name: queue_topic
}));

push_to_queue2.send(JSON.stringify({
    type: 'init_queue',
    queue_name: queue_topic
}));

// functions
function notifyChange() {
    const data = {
        type: 'notify_change',
        num_workers: my_workers.length
    };
    assossiation_queue_workers.forEach((num_workers, queue_id_string) => {
        queue_router.send([Buffer.from(JSON.parse(queue_id_string)), JSON.stringify(data)]);
    });
}

function printMap() {
    console.log('############## Print map: ##############')
    assossiation_queue_workers.forEach((num_workers, queue_id_string) => {
        console.log(queue_id_string + ' -> ' + num_workers);
    });
}

// broker
broker_sub.subscribe(queue_topic);
broker_sub.on('message', (topic, data) => {
    const parsed_data = JSON.parse(data);
    console.log('data:', parsed_data);
    // no hay workers disponibles
    if (my_workers.length == 0) {
        let found = false;
        for (let i = 0; i < assossiation_queue_workers.size; i++) {
            if (num_workers > 0) {
                queue_router.send([Buffer.from(JSON.parse(queue_id_string)), JSON.stringify(parsed_data)]);
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

    }
});

// queue
queue_router.on('message', (queue_id, data) => {
    const parsed_queue_id = JSON.stringify(queue_id.toJSON());
    const parsed_data = JSON.parse(data);
    if (parsed_data.type === 'init_queue') {
        assossiation_queue_name_queue_id.set(parsed_data.name,)
        assossiation_queue_workers.set(parsed_queue_id, 0);
    } else if (parsed_data.type === 'notify_change') {
        printMap();
        assossiation_queue_workers.set(parsed_queue_id, parsed_data.num_workers);
        printMap();
    }
});


// worker
worker_router.on('message', (worker_id, del, data) => {
    const parsed_data = JSON.parse(data);
    // entra un nuevo worker a la cola
    if (parsed_data.type === 'new') {
        console.log(worker_id.toJSON());
        console.log('a worker has joined');
        if (jobs.length === 0) {
            my_workers.push(JSON.stringify(worker_id));
            notifyChange();
        } else {
            const job = jobs.shift();
            worker_router.send([worker_id, del, JSON.stringify(job)]);
        }
    }
    // el worker ha finalizado su trabajo
    else if (parsed_data.type === 'response') {
        broker_push.send(JSON.stringify({
            type: 'response',
            ...parsed_data
        }));
    }
});
