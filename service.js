const express = require('express');
const server = express();

// settings
server.set('port', process.env.PORT || 8081);

server.use(express.json({limit: '50mb'}));

//se llama un controlador
server.use('/request', require('./controller/request'));

//listen
server.listen(server.get('port'), function() {
    console.log(`server on port ${server.get('port')}`);
})