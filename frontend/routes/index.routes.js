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
    data = JSON.parse(data);
    var msgId = data.id;
    var res = responses[msgId];

    res.send(data.message);
    delete responses[msgId];
    console.log(responses);
});

router.get('/', (req, res) => {
    res.send('Welcome to our FaaS');
});

router.post('/echo', (req, res) => {
    console.log('Post funcionando');
    var msgId = uuid.v4();
    var data = { id: msgId, message: req.body };
    responses[msgId] = res;
    push.send(JSON.stringify(data));
});

exports.index_router = router;