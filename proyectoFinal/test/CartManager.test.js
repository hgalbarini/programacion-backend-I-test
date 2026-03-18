
//para explicar ejemplo: addProductToCart

import { jest } from '@jest/globals';

// 1. Mockeamos el módulo ANTES de importarlo
jest.unstable_mockModule('fs/promises', () => ({
    default: {
        readFile: jest.fn(),
        writeFile: jest.fn(),
    }
}));

// 2. Importamos dinámicamente los módulos para que tomen el mock
const fs = (await import('fs/promises')).default;
// IMPORTANTE: Ajusta la ruta a tu CartManager.js real
const { default: CartManager } = await import('../src/CartManager.js');

describe('CartManager Unit Tests', () => {
    let manager;

    beforeEach(() => {
        jest.clearAllMocks();
        manager = new CartManager();
    });

    // --- Pruebas de Inicialización y Creación ---
    
    test('createCart debería generar un carrito con ID 1 si el archivo está vacío', async () => {
        fs.readFile.mockRejectedValueOnce(new Error('File not found'));
        fs.writeFile.mockResolvedValueOnce();

        const cart = await manager.createCart();

        expect(cart).toEqual({ id: 1, products: [] });
        expect(fs.writeFile).toHaveBeenCalled();
    });

    // --- Pruebas de Búsqueda ---

    test('getCartById debería devolver el carrito si existe', async () => {
        const mockData = JSON.stringify([{ id: 10, products: [] }]);
        fs.readFile.mockResolvedValueOnce(mockData);

        const cart = await manager.getCartById(10);
        
        expect(cart.id).toBe(10);
    });

    test('getCartById debería lanzar error si el ID no existe', async () => {
        fs.readFile.mockResolvedValueOnce(JSON.stringify([]));

        await expect(manager.getCartById(99))
            .rejects.toThrow('Cart not found with id: 99');
    });

    // --- Pruebas de Lógica de Productos ---

    test('addProductToCart debe sumar 1 a quantity si el producto ya existe', async () => {
        const initialCarts = [{ 
            id: 1, 
            products: [{ product: 500, quantity: 1 }] 
        }];
        
        fs.readFile.mockResolvedValueOnce(JSON.stringify(initialCarts));
        fs.writeFile.mockResolvedValueOnce();

        const updatedCart = await manager.addProductToCart(1, 500);

        expect(updatedCart.products[0].quantity).toBe(2);
    });

    test('addProductToCart debe crear el producto si no estaba en el carrito', async () => {
        const initialCarts = [{ id: 1, products: [] }];
        
        fs.readFile.mockResolvedValueOnce(JSON.stringify(initialCarts));
        fs.writeFile.mockResolvedValueOnce();

        const updatedCart = await manager.addProductToCart(1, 999);

        expect(updatedCart.products).toContainEqual({ product: 999, quantity: 1 });
    });
});