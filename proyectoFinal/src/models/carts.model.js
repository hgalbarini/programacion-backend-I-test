import mongoose from "mongoose";

const cartsCollection = 'carts';

const cartSchema = new mongoose.Schema({
    // Definimos products como un array de objetos
    products: {
        type: [
            {
                // Referencia al ID del producto
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'products' // Asegúrate de que tu modelo de productos se llame 'products'
                },
                // Cantidad de ese producto
                quantity: {
                    type: Number,
                    default: 1
                }
            }
        ],
        default: [] // Por defecto, un carrito nuevo empieza vacío
    }
});

const cartModel = mongoose.model(cartsCollection, cartSchema);

export default cartModel;