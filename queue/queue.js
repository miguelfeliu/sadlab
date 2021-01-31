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
let my_workers = [];
const pending_jobs = [];
const workers_global = new Map();

// manage disconnected queues
let workers_pending_for_heatbeat = [];

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

function notify_coordinator() {
    let msg = {
        type: 'queue_status',
        queue_name: queue_topic,
        num_workers: my_workers.length
    };
    coord_pub.send(['DATA', JSON.stringify(msg)]);
}

// broker
broker_sub.subscribe(queue_topic);
broker_sub.on('message', (topic, data) => {
    const parsed_data = JSON.parse(data);
    console.log('llega2', parsed_data);
    // no hay workers disponibles
    if (my_workers.length === 0) {
        let found = false;
        const queue_names = workers_global.keys();
        for (queue_name of queue_names) {
            if (workers_global.get(queue_name) > 0) {
                // envía a otra cola
                coord_pub.send(
                    [
                        'DATA',
                        JSON.stringify({
                            type: 'job',
                            queue_from: queue_topic,
                            queue_to: queue_name,
                            ...parsed_data
                        })
                    ]
                );
                found = true;
                break;
            }
        }
        if (!found) {
            // apila el trabajo a la lista de trabajos pendientes
            pending_jobs.push(parsed_data);
        }
    }
    // hay workers disponibles localmente
    else {
        const worker_id = my_workers.shift();
        worker_router.send(
            [
                Buffer.from(JSON.parse(worker_id)),
                '',
                JSON.stringify({
                    type: 'request_job',
                    ...parsed_data
                })
            ]
        );
    }
});

// worker
worker_router.on('message', (worker_id, del, data) => {
    const parsed_data = JSON.parse(data);
    // entra un nuevo worker a la cola
    if (parsed_data.type === 'new') {
        // no hay trabajos pendientes
        if (pending_jobs.length === 0) {
            console.log('No hay trabajos, guardamos worker');
            my_workers.push(JSON.stringify(worker_id));
            notify_coordinator();
        }
        // hay trabajos pendientes
        else {
            const job = pending_jobs.shift();
            worker_router.send(
                [
                    worker_id,
                    del,
                    JSON.stringify({
                        type: 'request_job',
                        ...job
                    })
                ]
            );
        }
    }
    // el worker ha finalizado su trabajo
    else if (parsed_data.type === 'response') {
        console.log('llega8', parsed_data);
        broker_push.send(JSON.stringify({
            type: 'response',
            ...parsed_data
        }));
        if (pending_jobs.length === 0) {
            console.log('No hay trabajos, guardamos worker');
            my_workers.push(JSON.stringify(worker_id));
            notify_coordinator();
        } else {
            const job = pending_jobs.shift();
            worker_router.send(
                [
                    worker_id,
                    del,
                    JSON.stringify({
                        type: 'request_job',
                        job
                    })
                ]
            );
        }
    } else if (parsed_data.type === 'heartbeat') {
        const index_alive_worker = workers_pending_for_heatbeat.indexOf(JSON.stringify(worker_id));
        workers_pending_for_heatbeat.splice(index_alive_worker, 1);
    }
});

// coordinator
coord_sub.on('message', function (topic, data) {
    let parsed_data = JSON.parse(data);
    // recibe el estatus global de los workers que tienen las demás colas
    if (parsed_data.type === 'queue_status') {
        parsed_data.queues.forEach(queue => {
            workers_global.set(queue.queue_name, queue.num_workers);
        });
    }
    // recibe un trabajo de otra cola
    else if (parsed_data.type === 'job' && parsed_data.queue_to === queue_topic) {
        if (my_workers.length > 0) {
            const worker_id = my_workers.shift();
            // parsed_data.type = 'response';
            worker_router.send(
                [
                    Buffer.from(JSON.parse(worker_id)),
                    '',
                    JSON.stringify({
                        type: 'request_job',
                        ...parsed_data
                    })
                ]
            );
        }
    }
});

// heartbeat
setInterval(() => {
    // si hay colas que no han respondido al heartbeat
    if (workers_pending_for_heatbeat.length > 0) {
        workers_pending_for_heatbeat.forEach(worker_id => {
            const index_worker_not_alive = my_workers.indexOf(worker_id);
            my_workers.splice(index_worker_not_alive, 1);
        });
        notify_coordinator();
    }
    workers_pending_for_heatbeat = [];
    my_workers.forEach(worker_id => {
        workers_pending_for_heatbeat.push(worker_id);
    });
    my_workers.forEach(worker_id => {
        worker_router.send(
            [
                Buffer.from(JSON.parse(worker_id)),
                '',
                JSON.stringify({
                    type: 'heartbeat'
                })
            ]
        );
    });
}, 4000);

setInterval(() => {
    print_workers_global();
}, 5000);

notify_coordinator();