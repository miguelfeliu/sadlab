const zmq = require('zeromq/v5-compat');

// brokers sockets
const broker_push = zmq.socket('push');
const broker_sub = zmq.socket('sub');
// workers sockets
const worker_router = zmq.socket('router');
// queues sockets
const queues_router = zmq.socket('router');
// coordinator sockets
const coord_sub = zmq.socket('sub');
const coord_pub = zmq.socket('pub');

const my_args = process.argv.slice(2);

// bind network data
const WORKER_ROUTER_PORT = my_args[1];
const WORKER_ROUTER_IP = 'tcp://*:' + WORKER_ROUTER_PORT;

// queues data
const queue_topic = my_args[0];
const my_workers = [];
const pending_jobs = [];
const workers_global = new Map();

// bind
// worker bind
worker_router.bind(WORKER_ROUTER_IP);

// connect
//broker connect
broker_sub.connect('tcp://localhost:8447');
broker_push.connect('tcp://localhost:8111');
// coordinator connect
coord_pub.connect('tcp://127.0.0.1:5556');
coord_sub.subscribe('DATA');
coord_sub.connect('tcp://127.0.0.1:5555');

// init queue
broker_push.send(JSON.stringify({
    type: 'init_queue',
    port_worker_to_queue: WORKER_ROUTER_PORT
}));

// functions
function print_workers_global() {
    console.log('Asociación colas -> num_workers:');
    workers_global.forEach((num_workers, queue_name) => {
        console.log(queue_name, ': ', num_workers);
    });
}

// broker
broker_sub.subscribe(queue_topic);
broker_sub.on('message', (topic, data) => {
    const parsed_data = JSON.parse(data);
    console.log('data:', parsed_data);
    // no hay workers disponibles
    if (my_workers.length === 0) {
        let found = false;
        const queue_names = workers_global.keys();
        for (queue_name of queue_names) {
            if (workers_global.get(queue_name) > 0) {
                // envía a otra cola
                coord_pub.send(['DATA', JSON.stringify({
                    type: 'job',
                    queue_from: queue_topic,
                    queue_to: queue_name,
                    ...msg
                })]);
                found = true;
                break;
            }
        }
        if (!found) {
            // apila el trabajo a la lista de trabajos pendientes
            console.log('entra en found');
            pending_jobs.push(parsed_data);
        }
    }
    // hay workers disponibles localmente
    else {
        const worker_id = my_workers.shift();
        worker_router.send([Buffer.from(JSON.parse(worker_id)), '', JSON.stringify(parsed_data)]);
    }
});

// worker
worker_router.on('message', (worker_id, del, data) => {
    const parsed_data = JSON.parse(data);
    // entra un nuevo worker a la cola
    if (parsed_data.type === 'new') {
        console.log('a worker has joined');
        if (pending_jobs.length === 0) {
            console.log('No hay trabajos, guardamos worker');
            my_workers.push(JSON.stringify(worker_id));
        } else {
            const job = pending_jobs.shift();
            worker_router.send([worker_id, del, JSON.stringify(job)]);
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

// coordinator
coord_sub.on('message', function (topic, data) {
    const parsed_data = JSON.parse(data);
    // recibe el estatus global de los workers que tienen las demás colas
    if (parsed_data.type === 'queue_status') {
        parsed_data.queues.forEach(queue => {
            workers_global.set(queue.queue_name, queue.num_workers);
        });
    }
    // recibe un trabajo de otra cola
    else if (parsed_data.type === 'job') {
        console.log('Mensaje recibido por otra cola');
        if (my_workers.length > 0) {
            const worker_id = my_workers.shift();
            worker_router.send([Buffer.from(JSON.parse(worker_id)), '', JSON.stringify(parsed_data)]);
        }
    }
});

setInterval(() => {
    let msg = {
        type: 'queue_status',
        queue_name: queue_topic,
        num_workers: my_workers.length
    };
    coord_pub.send(['DATA', JSON.stringify(msg)]);
}, 10000);

setInterval(() => {
    print_workers_global();
}, 5000);
