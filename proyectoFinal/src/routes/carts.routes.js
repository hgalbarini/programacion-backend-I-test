import express from 'express'
import CartManager from '../CartManager.js'
import ProductManager from "../ProductManager.js"; 
import cartModel from '../models/carts.model.js';


const router = express.Router();

const cartManager = new CartManager();

let productManager = new ProductManager();

router.post('/', async (req, res) => {
    console.log(`post /api/carts`);
    try {
        const newCart = new cartModel();
        await newCart.save();
        res.json({ status: "Success", cart: newCart });
    } catch (error) {
        res.status(500).json({ status: "Error", error: error.message });
    }
});

router.get('/:cid', async (req, res) => {
    const { cid } = req.params;
    try {
        // .lean() sirve para que devuelva un objeto JS plano (más rápido)
        const cart = await cartModel.findById(cid);
        
        if (!cart) return res.status(404).json({ status: "Error", message: "Cart not found" });
        
        res.json({ status: "Success", cart: cart });
    } catch (error) {
        res.status(500).json({ status: "Error", error: error.message });
    }
});

router.post('/:cid/product/:pid', async (req, res) => {
    const { cid, pid } = req.params;
    try {
        // 1. Buscamos el carrito
        const cart = await cartModel.findById(cid);
        if (!cart) return res.status(404).json({ status: "Error", message: "Cart not found" });

        // 2. Buscamos si el producto ya está en el carrito
        const productIndex = cart.products.findIndex(p => p.product.toString() === pid);

        if (productIndex !== -1) {
            // Si ya existe, aumentamos la cantidad
            cart.products[productIndex].quantity += 1;
        } else {
            // Si no existe, lo agregamos al array
            cart.products.push({ product: pid, quantity: 1 });
        }

        // 3. Guardamos los cambios en MongoDB
        await cart.save();
        res.json({ status: "Success", message: "Product added to cart", cart: cart });

    } catch (error) {
        res.status(500).json({ status: "Error", error: error.message });
    }
});

router.delete('/:cid/products/:pid', async (req, res) => {
    const { cid, pid } = req.params;
    try {
        // $pull elimina del array el objeto que coincida con el product ID
        const result = await cartModel.findByIdAndUpdate(
            cid,
            { $pull: { products: { product: pid } } },
            { new: true }
        );

        if (!result) return res.status(404).json({ status: "Error", message: "Cart not found" });

        res.json({ status: "Success", message: "Product removed from cart", cart: result });
    } catch (error) {
        res.status(500).json({ status: "Error", error: error.message });
    }
});

router.put('/:cid', async (req, res) => {
    const { cid } = req.params;
    const { products } = req.body; // Se espera { "products": [ { "product": "id", "quantity": 5 }, ... ] }

    try {
        const cart = await cartModel.findByIdAndUpdate(
            cid,
            { products },
            { new: true }
        );

        if (!cart) return res.status(404).json({ status: "Error", message: "Cart not found" });

        res.json({ status: "Success", message: "Cart updated completely", cart });
    } catch (error) {
        res.status(500).json({ status: "Error", error: error.message });
    }
});

router.put('/:cid/products/:pid', async (req, res) => {
    const { cid, pid } = req.params;
    const { quantity } = req.body; // Se espera { "quantity": 10 }

    try {
        if (!quantity || isNaN(quantity)) {
            return res.status(400).json({ status: "Error", message: "Quantity must be a valid number" });
        }

        // Buscamos el carrito y el producto dentro del array para actualizar solo el campo quantity
        const cart = await cartModel.findOneAndUpdate(
            { _id: cid, "products.product": pid },
            { $set: { "products.$.quantity": quantity } },
            { new: true }
        );

        if (!cart) return res.status(404).json({ status: "Error", message: "Cart or Product not found in cart" });

        res.json({ status: "Success", message: "Product quantity updated", cart });
    } catch (error) {
        res.status(500).json({ status: "Error", error: error.message });
    }
});

// DELETE api/carts/:cid
router.delete('/:cid', async (req, res) => {
    const { cid } = req.params;
    try {
        // Buscamos por ID y seteamos el array de productos a vacío []
        const cart = await cartModel.findByIdAndUpdate(
            cid,
            { $set: { products: [] } },
            { new: true }
        );

        if (!cart) {
            return res.status(404).json({ 
                status: "Error", 
                message: "Cart not found" 
            });
        }

        res.json({ 
            status: "Success", 
            message: "All products removed from cart", 
            cart: cart 
        });
    } catch (error) {
        res.status(500).json({ 
            status: "Error", 
            error: error.message 
        });
    }
});

export default router