const { Router } = require('express');
const zmq = require('zeromq');
const uuid = require('node-uuid');
const sreq = zmq.socket('req');

sreq.connect('tcp://localhost:8000');
sreq.identity = 'Client';
const router = Router();

var responses = {};

sreq.on('message', function (data) {
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
    var msgId = uuid.v4();
    var data = { id: msgId, message: req.body };
    responses[msgId] = res;
    sreq.send(JSON.stringify(data));
});

exports.index_router = router;