import { getProductById } from './products.js';

export class CartService {
  constructor(authService) {
    this.authService = authService;
  }

  getCartKey() {
    const user = this.authService.getCurrentUser();
    return user ? `cart_${user.id}` : null;
  }

  getCart() {
    const key = this.getCartKey();
    if (!key) return [];

    const cartStr = localStorage.getItem(key);
    return cartStr ? JSON.parse(cartStr) : [];
  }

  saveCart(cart) {
    const key = this.getCartKey();
    if (!key) return;

    localStorage.setItem(key, JSON.stringify(cart));
  }

  addToCart(productId, quantity = 1) {
    if (!this.authService.isAuthenticated()) {
      throw new Error('Silakan login terlebih dahulu');
    }

    const cart = this.getCart();
    const existingItem = cart.find(item => item.productId === productId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({
        productId,
        quantity,
        addedAt: new Date().toISOString()
      });
    }

    this.saveCart(cart);
    return cart;
  }

  updateQuantity(productId, quantity) {
    const cart = this.getCart();
    const item = cart.find(item => item.productId === productId);

    if (item) {
      if (quantity <= 0) {
        return this.removeFromCart(productId);
      }
      item.quantity = quantity;
      this.saveCart(cart);
    }

    return cart;
  }

  removeFromCart(productId) {
    let cart = this.getCart();
    cart = cart.filter(item => item.productId !== productId);
    this.saveCart(cart);
    return cart;
  }

  clearCart() {
    this.saveCart([]);
  }

  getCartWithProducts() {
    const cart = this.getCart();
    return cart.map(item => {
      const product = getProductById(item.productId);
      return {
        ...item,
        product,
        subtotal: product ? product.price * item.quantity : 0
      };
    }).filter(item => item.product);
  }

  getCartTotal() {
    const cartItems = this.getCartWithProducts();
    return cartItems.reduce((total, item) => total + item.subtotal, 0);
  }

  getCartCount() {
    const cart = this.getCart();
    return cart.reduce((total, item) => total + item.quantity, 0);
  }
}
