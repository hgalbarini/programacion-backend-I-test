import express from "express";
import handlebars from 'express-handlebars';
import CartManager from "./CartManager.js";
import ProductManager from "./ProductManager.js"; 
import cartsRouter from "./routes/carts.routes.js";
import productsRouter from "./routes/products.routes.js";
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import viewsRouter from './routes/views.router.js';
import mongoose from 'mongoose';





const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = 8080;
const MONGO_URI = 'mongodb+srv://hugogalb9595_db_user:ShgYxqdnqOPhn3RL@cluster0.ok5hgzh.mongodb.net/ecommerce?retryWrites=true&w=majority'

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
    })

// Configuración de Handlebars con Helpers
app.engine('handlebars', handlebars.engine({
    helpers: {
        // Definimos la función multiply para usarla en las vistas
        multiply: (a, b) => {
            return (a || 0) * (b || 0);
        }
    }
}));
app.set('views', path.join(__dirname, 'views' ) );
app.set('view engine', 'handlebars');


let productManager = new ProductManager();
let cartManager = new CartManager();
app.use(express.json());
app.use(express.static(path.join(__dirname,'..','public')));

//VIEWS ROUTER
app.use('/', viewsRouter);

// PRODUCT ROUTES

app.use('/api/products',productsRouter)

// CART ROUTES
app.use('/api/carts',cartsRouter)

const httpServer = app.listen(PORT, () => { console.log(`Servidor con Express en el puerto ${PORT}`) })

const io = new Server(httpServer);
app.set('socketio',io);  //seteo esto para que se pueda acceder desde las rutas

io.on('connection',  socket => {
    console.log('Nuevo cliente conectado con el id ' + socket.id );
})


