const { Router } = require('express');
const zmq = require('zeromq/v5-compat');
const uuid = require('node-uuid');
const push = zmq.socket('push');
const pull = zmq.socket('pull');

pull.bind('tcp://*:8008');
push.connect('tcp://localhost:8009');


const router = Router();

var responses = {};

pull.on('message', function (data) {
    console.log('Received');
    const parsed_data = JSON.parse(data);
    console.log(parsed_data);
    const msgId = parsed_data.id;
    let res = responses[msgId];

    res.send(parsed_data.message);
    delete responses[msgId];
    console.log(responses);
});

router.get('/', (req, res) => {
    res.send('Welcome to our FaaS');
});

router.post('/echo', (req, res) => {
    console.log('Post funcionando');
    const msgId = uuid.v4();
    const data = { id: msgId, message: req.body };
    responses[msgId] = res;
    push.send(JSON.stringify(data));
});

exports.index_router = router;