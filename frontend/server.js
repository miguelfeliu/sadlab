const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Routes
const { index_router } = require('./routes/index.routes');
app.use(index_router)

exports.app = app;