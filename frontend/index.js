const { app } = require('./server');

const server_port = 3000;

async function main() {
    await app.listen(server_port);
    console.log("Server listen at port", server_port);
}

main();