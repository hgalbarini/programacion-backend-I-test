import express from 'express'
import CartManager from '../CartManager.js'
import ProductManager from "../ProductManager.js"; 
import {upload} from '../utils/utils.js';
import productModel from '../models/products.model.js';

const router = express.Router();

const cartManager = new CartManager();

let productManager = new ProductManager();

router.get('/', async (req, res) => {
    try {
        let { limit = 10, page = 1, sort, query } = req.query;
        
        // Filtro por categoría o disponibilidad
        let filter = {};
        if (query) {
            filter = { 
                $or: [
                    { category: query },
                    { status: query === 'true' }
                ]
            };
        }

        // Opciones de paginación y ordenamiento
        const options = {
            limit: parseInt(limit),
            page: parseInt(page),
            lean: true, // Para que Handlebars pueda leer los objetos
            sort: sort ? { price: sort === 'asc' ? 1 : -1 } : {}
        };

        const result = await productModel.paginate(filter, options);

        // Construcción de los links
        const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;
        
        res.json({
            status: "success",
            payload: result.docs,
            totalPages: result.totalPages,
            prevPage: result.prevPage,
            nextPage: result.nextPage,
            page: result.page,
            hasPrevPage: result.hasPrevPage,
            hasNextPage: result.hasNextPage,
            prevLink: result.hasPrevPage ? `${baseUrl}?page=${result.prevPage}&limit=${limit}${sort ? `&sort=${sort}` : ''}${query ? `&query=${query}` : ''}` : null,
            nextLink: result.hasNextPage ? `${baseUrl}?page=${result.nextPage}&limit=${limit}${sort ? `&sort=${sort}` : ''}${query ? `&query=${query}` : ''}` : null
        });

    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

router.get('/:pid', async (req, res) => {
    console.log(`get /api/products/${req.params.pid}`);
    try {
        const productId = req.params.pid;

        // Find the product by ID
        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        res.json(product);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/', upload.single('productImage'), async (req,res) => {
    console.log(`post /api/products/socketPOST`);
    try {
        const { title, description, code, price, stock, category, thumbnails, status } = req.body;
        
        // Validar que los campos requeridos estén presentes
        if (!title || !description || !code || !price || !stock || !category) {
            throw new Error("Missing required fields: title, description, code, price, stock, category");
        }

         // Create a new product object
         const newProduct = new productModel({
            title,
            description,
            code,
            price,
            stock,
            category,
            thumbnails: thumbnails || [],
            status: status !== undefined ? status : true
        });

        // Save the new product to the database
        const savedProduct = await newProduct.save();

        // Get the updated list of products
        const updatedProducts = await productModel.find();

        //obtengo el socket y emito el evento
        const io = req.app.get('socketio'); 
        if (io) {
            io.emit('updateProducts', updatedProducts);
            console.log('Evento updateProducts emitido a los clientes');
        }
        
        res.json({status: "Success", message: "Product added successfully"});  
    } catch (error) {
        res.status(400).json({status: "Error", error: error.message});
    }
})

router.post('/noSocketPOST', upload.single('productImage'), async (req,res) => {
    console.log(`post /api/products`);
    console.log('POST /api/products received');
    console.log('Content-Type header:', req.headers['content-type']);
    console.log('Request body:', req.body);
    console.log('Body type:', typeof req.body);
    try {
        const { title, description, code, price, stock, category, thumbnails, status } = req.body;
        
        // Validar que los campos requeridos estén presentes
        if (!title || !description || !code || !price || !stock || !category) {
            throw new Error("Missing required fields: title, description, code, price, stock, category");
        }

        // El ID se autogenera, no se acepta del body
        await productManager.addProduct(title, description, code, price, stock, category, thumbnails || [], status !== undefined ? status : true);
        res.json({status: "Success", message: "Product added successfully"});  
    } catch (error) {
        res.status(400).json({status: "Error", error: error.message});
    }
})

router.put('/:id', upload.single('productImage'), async (req, res) => {
    console.log(`put /api/products/${req.params.id}`);
    try {
        const { title, description, code, price, stock, category, thumbnails, status } = req.body;
        const productId = req.params.id;

        // Find the product by ID
        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        // Update the product fields
        if (title) product.title = title;
        if (description) product.description = description;
        if (code) product.code = code;
        if (price) product.price = price;
        if (stock) product.stock = stock;
        if (category) product.category = category;
        if (thumbnails) product.thumbnails = thumbnails;
        if (status !== undefined) product.status = status;

        // Save the updated product to the database
        await product.save();

        // Get the updated list of products
        const updatedProducts = await productModel.find();

        // Emit the 'updateProducts' event to the clients
        const io = req.app.get('socketio');
        if (io) {
            io.emit('updateProducts', updatedProducts);
            console.log('Evento updateProducts emitido a los clientes');
        }

        res.json({ status: "Success", message: "Product updated successfully" });
    } catch (error) {
        res.status(400).json({ status: "Error", error: error.message });
    }
});


router.delete('/:pid', async (req, res) => {
    console.log(`delete /api/products/${req.params.pid}`);
    const productId = req.params.pid;
    try {
        await productModel.findByIdAndDelete(productId);

        // Get the updated list of products
        const updatedProducts = await productModel.find();

        // Emit the 'updateProducts' event to the clients
        const io = req.app.get('socketio');
        if (io) {
            io.emit('updateProducts', updatedProducts);
            console.log('Evento updateProducts emitido a los clientes');
        }

        res.json({ status: "Success", message: `Product with id ${productId} deleted successfully` });
    } catch (error) {
        res.status(404).json({ status: "Error", error: error.message });
    }
});

export default router