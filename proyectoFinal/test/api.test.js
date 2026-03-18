import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import productModel from '../src/models/products.model.js';

describe('Tests de Integración - Ecommerce API', () => {
    
    beforeAll(async () => {
        // Si ya hay una conexión abierta por app.js, la usamos o reconectamos
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect('TU_MONGO_URI_AQUI');
        }
    });

    afterAll(async () => {
        // Limpiamos la base de datos de test al terminar (opcional)
        // await mongoose.connection.db.dropDatabase(); 
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        // IMPORTANTE: Solo borramos los productos de la DB de TEST antes de cada test
        await productModel.deleteMany({});
    });

    test('GET /api/products debería responder con status 200', async () => {
        const response = await request(app).get('/api/products');
        expect(response.status).toBe(200);
    });

    test('POST /api/products debería crear un nuevo producto', async () => {
        const nuevoProducto = {
            title: "Producto Test",
            description: "Descripción de prueba",
            code: "TEST1234",
            price: 100,
            stock: 5,
            category: "Pruebas"
        };
    
        const response = await request(app)
            .post('/api/products')
            .send(nuevoProducto);
    
        // Verificamos respuesta de la API
        expect(response.status).toBe(201); // O 200, según tu código
        expect(response.body.payload.code).toBe("TEST1234");
    
        // Verificamos que REALMENTE esté en la base de datos
        const productoEnDb = await productModel.findOne({ code: "TEST1234" });
        expect(productoEnDb).not.toBeNull();
        expect(productoEnDb.title).toBe("Producto Test");
    });

    test('POST /api/products debería fallar si falta el precio', async () => {
        const productoInvalido = {
            title: "Sin Precio",
            code: "ERR01"
            // Falta el price
        };
    
        const response = await request(app)
            .post('/api/products')
            .send(productoInvalido);
    
        // Esperamos un error de cliente (400 Bad Request)
        expect(response.status).toBe(400);
    });

    test('Debería agregar un producto existente a un carrito', async () => {
        // 1. Creamos un producto primero
        const prod = await productModel.create({
            title: "Mouse", code: "MO01", price: 10, stock: 10, category: "PC"
        });
    
        // 2. Creamos un carrito mediante la API
        const cartRes = await request(app).post('/api/carts').send();
        const cartId = cartRes.body.payload._id;
    
        // 3. Agregamos el producto al carrito
        const addRes = await request(app)
            .post(`/api/carts/${cartId}/product/${prod._id}`)
            .send();
    
        expect(addRes.status).toBe(200);
        
        // 4. Verificamos que el producto esté adentro
        const finalCartRes = await request(app).get(`/api/carts/${cartId}`);
        const productsInCart = finalCartRes.body.payload.products;
        
        // Verificamos que el ID coincida (ojo con el .toString() si comparas ObjectIds)
        expect(productsInCart[0].product._id.toString()).toBe(prod._id.toString());
    });
});