import express from 'express'
import ProductManager from "../ProductManager.js"; 
import productModel from '../models/products.model.js';
import cartModel from '../models/carts.model.js';

const router = express.Router();

let productManager = new ProductManager();



router.get('/products', async (req, res) => {
    let { page = 1, limit = 10 } = req.query;
    const result = await productModel.paginate({}, { page, limit, lean: true });
    
    // Formateamos los datos para Handlebars
    res.render('products', {
        products: result.docs,
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage,
        prevPage: result.prevPage,
        nextPage: result.nextPage,
        page: result.page
    });
});

// Ruta para ver un carrito específico
router.get('/carts/:cid', async (req, res) => {
    try {
        const cart = await cartModel.findById(req.params.cid).populate('products.product').lean();
        res.render('cartDetail', { cart });
    } catch (error) {
        res.status(500).send("Error al cargar el carrito");
    }
});

router.get('/home', async (req,res) => {
    console.log('home');
    let data = await productManager.getProducts();
    res.render('home', { products: data });
}) 

router.get('/realtimeproducts', async (req,res) => {
    console.log('realtimeproducts');
    let data = await productManager.getProducts();
    res.render('realTimeProducts', { products: data });
}) 



export default router