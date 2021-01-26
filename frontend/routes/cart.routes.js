const { Router } = require('express');
const cart_module = require('../carrito_module');

const router = Router();

router.get('/get_available_products', async (req, res) => {
    const available_products = await cart_module.get_available_products();
    res.send(available_products);
});

router.get('/get_cart_products', async (req, res) => {
    const cart_products = await cart_module.get_cart_products();
    res.send(cart_products);
});

router.post('/add_product_to_cart_by_id', async (req, res) => {
    const response = await cart_module.add_product_to_cart_by_id(req.body.product_id);
    res.send(response);
});

router.post('/remove_product_from_cart_by_id', async (req, res) => {
    const response = await cart_module.remove_product_from_cart_by_id(req.body.product_id);
    res.send(response);
});

exports.cart_router = router;