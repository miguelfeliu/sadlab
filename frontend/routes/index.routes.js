const { Router } = require('express');
const zmq = require('zeromq/v5-compat');
const uuid = require('node-uuid');
const push = zmq.socket('push');
const pull = zmq.socket('pull');

const pull_bind = process.env.FRONT_PUSH_BIND || 'tcp://*:8008';
pull.bind(pull_bind);
const push_connect = process.env.BROKER_PUSH_CONN || 'tcp://localhost:8009';
push.connect(push_connect);


const router = Router();

var responses = {};

pull.on('message', function (data) {
    const parsed_data = JSON.parse(data);
    const msgId = parsed_data.id;
    let res = responses[msgId];
    res.send(parsed_data.message);
    delete responses[msgId];
});

router.get('/', (req, res) => {
    res.send('Welcome to our FaaS');
});

router.post('/echo', (req, res) => {
    const msgId = uuid.v4();
    const data = { id: msgId, message: req.body };
    responses[msgId] = res;
    push.send(JSON.stringify(data));
});

exports.index_router = router;
