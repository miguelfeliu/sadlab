const zmq = require('zeromq/v5-compat');
const req = zmq.socket('req');
const cart_module = require('./carrito_module');

req.connect('tcp://127.0.0.1:8001');
const init_connection_data = { type: 'new_cart' };
req.send(JSON.stringify(init_connection_data));

async function process_action(message, client_id) {
    if (message.action == 'get_available_products') {
        const available_products = await cart_module.get_available_products();
        return available_products;
    } else if (message.action === 'get_cart_products') {
        const cart_products = cart_module.get_cart_products();
        return cart_products;
    } else if (message.action === 'add_product_to_cart_by_id') {
        const response = await cart_module.add_product_to_cart_by_id(message.product_id);
        return response;
    } else if (message.action === 'remove_product_from_cart_by_id') {
        const response = await cart_module.remove_product_from_cart_by_id(message.product_id);
        return response;
    } else if (message.action === 'finish_cart') {
        req.send(JSON.stringify({
            type: 'finish_cart',
            message: {
                text: 'El carrito ha sido cerrado'
            },
            client_id: client_id
        }));
        return process.exit(0);
    }
}

req.on('message', async data => {
    const parsed_data = JSON.parse(data);
    const result = await process_action(parsed_data.message, parsed_data.client_id);
    const response_data = {
        type: 'response',
        client_id: parsed_data.client_id,
        message: result
    };
    req.send(JSON.stringify(response_data));
});
