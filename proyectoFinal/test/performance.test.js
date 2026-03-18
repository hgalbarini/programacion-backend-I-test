import http from 'k6/http';
import { check, sleep } from 'k6';

// 1. CONFIGURACIÓN DEL ESCENARIO
export const options = {
    stages: [
        { duration: '10s', target: 20 }, // Rampa de subida: de 0 a 20 usuarios en 10s
        { duration: '20s', target: 20 }, // Meseta: se mantiene con 20 usuarios por 20s
        { duration: '10s', target: 0 },  // Rampa de bajada: vuelve a 0 usuarios
    ],
    thresholds: {
        http_req_failed: ['rate<0.01'], // Menos del 1% de las peticiones pueden fallar
        http_req_duration: ['p(95)<250'], // El 95% de las peticiones deben ser menores a 250ms
    },
};

// URL de tu servidor local
const BASE_URL = 'http://localhost:8080';

// 2. FUNCIÓN PRINCIPAL (Lo que hace cada "Usuario Virtual")
export default function () {
    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    // PASO 1: Ver productos (GET)
    let resProducts = http.get(`${BASE_URL}/api/products`);
    check(resProducts, {
        'GET Products status 200': (r) => r.status === 200,
    });

    sleep(1); // Simula tiempo de lectura del usuario

    // PASO 2: Crear un carrito (POST)
    let resCart = http.post(`${BASE_URL}/api/carts`, JSON.stringify({}), params);
    let cartId;
    
    const cartCheck = check(resCart, {
        'POST Cart status 200/201': (r) => r.status === 200 || r.status === 201,
    });

    // Si el carrito se creó bien, extraemos el ID para el siguiente paso
    if (cartCheck) {
        const body = JSON.parse(resCart.body);
        cartId = body.payload ? body.payload._id : body._id;
    }

    sleep(1);

    // PASO 3: Agregar un producto al carrito (POST)
    // NOTA: Asegúrate de usar un ID de producto que EXISTA en tu base de datos de Atlas
    if (cartId) {
        const productId = '65f123abc456def789012345'; // <--- CAMBIA ESTO por un ID real de tu DB
        let resAdd = http.post(`${BASE_URL}/api/carts/${cartId}/product/${productId}`, JSON.stringify({}), params);
        
        check(resAdd, {
            'Add Product status 200': (r) => r.status === 200,
        });
    }

    sleep(2);
}