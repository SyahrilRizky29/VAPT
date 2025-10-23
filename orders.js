export class OrderService {
  constructor(authService, cartService) {
    this.authService = authService;
    this.cartService = cartService;
  }

  getOrdersKey() {
    return 'orders';
  }

  getAllOrders() {
    const ordersStr = localStorage.getItem(this.getOrdersKey());
    return ordersStr ? JSON.parse(ordersStr) : [];
  }

  getUserOrders() {
    const user = this.authService.getCurrentUser();
    if (!user) return [];

    const allOrders = this.getAllOrders();
    return allOrders.filter(order => order.userId === user.id);
  }

  createOrder(orderData) {
    if (!this.authService.isAuthenticated()) {
      throw new Error('Silakan login terlebih dahulu');
    }

    const user = this.authService.getCurrentUser();
    const cartItems = this.cartService.getCartWithProducts();

    if (cartItems.length === 0) {
      throw new Error('Keranjang belanja kosong');
    }

    const order = {
      id: Date.now().toString(),
      userId: user.id,
      items: cartItems.map(item => ({
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        subtotal: item.subtotal
      })),
      totalAmount: this.cartService.getCartTotal(),
      deliveryAddress: orderData.deliveryAddress || user.address,
      phone: orderData.phone || user.phone,
      paymentMethod: orderData.paymentMethod,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const allOrders = this.getAllOrders();
    allOrders.push(order);
    localStorage.setItem(this.getOrdersKey(), JSON.stringify(allOrders));

    this.cartService.clearCart();

    return order;
  }

  getOrderById(orderId) {
    const orders = this.getAllOrders();
    return orders.find(order => order.id === orderId);
  }
}
