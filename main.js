import { AuthService } from './auth.js';
import { CartService } from './cart.js';
import { OrderService } from './orders.js';
import { getProducts, searchProducts } from './products.js';

const authService = new AuthService();
const cartService = new CartService(authService);
const orderService = new OrderService(authService, cartService);

let currentPage = 'home';

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
}

function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (badge) {
    const count = cartService.getCartCount();
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-block' : 'none';
  }
}

function updateAuthButton() {
  const authBtn = document.getElementById('authBtn');
  const profileLink = document.getElementById('profileLink');

  if (authService.isAuthenticated()) {
    const user = authService.getCurrentUser();
    authBtn.textContent = "Logout";
    authBtn.onclick = () => {
      if (confirm('Apakah Anda yakin ingin logout?')) {
        authService.logout();
        updateAuthButton();
        updateCartBadge();
        navigateTo('home');
      }
    };

    if (profileLink) {
      profileLink.style.display = 'flex';
    }
  } else {
    authBtn.textContent = 'Login';
    authBtn.onclick = openAuthModal;

    if (profileLink) {
      profileLink.style.display = 'none';
    }
  }
}

function openAuthModal() {
  const modal = document.getElementById('authModal');
  modal.style.display = 'block';
}

function closeAuthModal() {
  const modal = document.getElementById('authModal');
  modal.style.display = 'none';
}

function showAlert(message, type = 'success') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type}`;
  alertDiv.textContent = message;
  alertDiv.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    background: ${type === 'success' ? '#4caf50' : '#f44336'};
    color: white;
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;
  document.body.appendChild(alertDiv);

  setTimeout(() => {
    alertDiv.remove();
  }, 3000);
}

function renderHomePage() {
  const products = getProducts();

  return `
    <div class="home-page">
      <div class="hero">
        <h1>Selamat Datang di Kebab House</h1>
        <p>Kebab terbaik dengan cita rasa autentik Turki</p>
      </div>

      <div class="search-section">
        <input
          type="text"
          id="searchInput"
          class="search-input"
          placeholder="Cari kebab favorit Anda..."
        />
        <button id="searchButton" class="btn btn-primary">Search</button>
      </div>
      <div id="resultInfo"></div>

      <div class="products-grid" id="productsGrid">
        ${products.map(product => `
          <div class="product-card">
            <img src="${product.image}" alt="${product.name}" />
            <div class="product-info">
              <h3>${product.name}</h3>
              <p class="product-description">${product.description}</p>
              <div class="product-footer">
                <span class="price">${formatRupiah(product.price)}</span>
                <button class="btn btn-primary btn-add-cart" data-product-id="${product.id}">
                  Tambah
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderCartPage() {
  if (!authService.isAuthenticated()) {
    return `
      <div class="empty-state">
        <h2>Silakan Login</h2>
        <p>Anda harus login untuk melihat keranjang belanja</p>
        <button class="btn btn-primary" onclick="document.getElementById('authBtn').click()">
          Login Sekarang
        </button>
      </div>
    `;
  }

  const cartItems = cartService.getCartWithProducts();

  if (cartItems.length === 0) {
    return `
      <div class="empty-state">
        <h2>Keranjang Kosong</h2>
        <p>Belum ada produk di keranjang belanja Anda</p>
        <button class="btn btn-primary" onclick="window.navigateTo('home')">
          Mulai Belanja
        </button>
      </div>
    `;
  }

  const total = cartService.getCartTotal();

  return `
    <div class="cart-page">
      <h2>Keranjang Belanja</h2>
      <div class="cart-items">
        ${cartItems.map(item => `
          <div class="cart-item">
            <img src="${item.product.image}" alt="${item.product.name}" />
            <div class="cart-item-info">
              <h3>${item.product.name}</h3>
              <p class="price">${formatRupiah(item.product.price)}</p>
            </div>
            <div class="cart-item-actions">
              <div class="quantity-control">
                <button class="btn-quantity" data-action="decrease" data-product-id="${item.productId}">-</button>
                <span class="quantity">${item.quantity}</span>
                <button class="btn-quantity" data-action="increase" data-product-id="${item.productId}">+</button>
              </div>
              <p class="subtotal">${formatRupiah(item.subtotal)}</p>
              <button class="btn-remove" data-product-id="${item.productId}">Hapus</button>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="cart-summary">
        <h3>Total: ${formatRupiah(total)}</h3>
        <button class="btn btn-primary btn-checkout">Checkout</button>
      </div>
    </div>
  `;
}

function renderCheckoutPage() {
  if (!authService.isAuthenticated()) {
    navigateTo('home');
    return '';
  }

  const user = authService.getCurrentUser();
  const cartItems = cartService.getCartWithProducts();
  const total = cartService.getCartTotal();

  return `
    <div class="checkout-page">
      <h2>Checkout</h2>
      <div class="checkout-container">
        <div class="checkout-form">
          <h3>Informasi Pengiriman</h3>
          <form id="checkoutForm">
            <div class="form-group">
              <label>Nama Lengkap</label>
              <input type="text" value="${user.fullName}" readonly />
            </div>
            <div class="form-group">
              <label>No. Telepon</label>
              <input type="tel" id="checkoutPhone" value="${user.phone}" required />
            </div>
            <div class="form-group">
              <label>Alamat Pengiriman</label>
              <textarea id="checkoutAddress" required>${user.address}</textarea>
            </div>
            <div class="form-group">
              <label>Metode Pembayaran</label>
              <select id="paymentMethod" required>
                <option value="">Pilih metode pembayaran</option>
                <option value="cod">Cash on Delivery (COD)</option>
                <option value="transfer">Transfer Bank</option>
                <option value="ewallet">E-Wallet</option>
              </select>
            </div>
            <button type="submit" class="btn btn-primary btn-full">Konfirmasi Pesanan</button>
          </form>
        </div>
        <div class="order-summary">
          <h3>Ringkasan Pesanan</h3>
          <div class="summary-items">
            ${cartItems.map(item => `
              <div class="summary-item">
                <span>${item.product.name} x${item.quantity}</span>
                <span>${formatRupiah(item.subtotal)}</span>
              </div>
            `).join('')}
          </div>
          <div class="summary-total">
            <strong>Total:</strong>
            <strong>${formatRupiah(total)}</strong>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderProfilePage() {
  if (!authService.isAuthenticated()) {
    navigateTo('home');
    return '';
  }

  const user = authService.getCurrentUser();
  const orders = orderService.getUserOrders();
  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);

  return `
    <div class="profile-page">
      <h2>Profil Saya</h2>

      <div class="profile-container">
        <div class="profile-card">
          <div class="profile-avatar">
            <div class="avatar-circle">${user.fullName.charAt(0).toUpperCase()}</div>
          </div>

          <div class="profile-info">
            <h3>${user.fullName}</h3>
            <p class="profile-email">${user.email}</p>
          </div>

          <div class="profile-stats">
            <div class="stat-item">
              <div class="stat-value">${totalOrders}</div>
              <div class="stat-label">Total Pesanan</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${formatRupiah(totalSpent)}</div>
              <div class="stat-label">Total Belanja</div>
            </div>
          </div>
        </div>

        <div class="profile-details">
          <h3>Informasi Kontak</h3>

          <div class="detail-group">
            <label>Nama Lengkap</label>
            <div class="detail-value">${user.fullName}</div>
          </div>

          <div class="detail-group">
            <label>Email</label>
            <div class="detail-value">${user.email}</div>
          </div>

          <div class="detail-group">
            <label>No. Telepon</label>
            <div class="detail-value">${user.phone || '-'}</div>
          </div>

          <div class="detail-group">
            <label>Alamat</label>
            <div class="detail-value">${user.address || '-'}</div>
          </div>

          <button class="btn btn-primary btn-edit-profile">Edit Profil</button>
        </div>
      </div>
    </div>
  `;
}

function renderOrdersPage() {
  if (!authService.isAuthenticated()) {
    return `
      <div class="empty-state">
        <h2>Silakan Login</h2>
        <p>Anda harus login untuk melihat pesanan</p>
        <button class="btn btn-primary" onclick="document.getElementById('authBtn').click()">
          Login Sekarang
        </button>
      </div>
    `;
  }

  const orders = orderService.getUserOrders();

  if (orders.length === 0) {
    return `
      <div class="empty-state">
        <h2>Belum Ada Pesanan</h2>
        <p>Anda belum memiliki riwayat pesanan</p>
        <button class="btn btn-primary" onclick="window.navigateTo('home')">
          Mulai Belanja
        </button>
      </div>
    `;
  }

  return `
    <div class="orders-page">
      <h2>Pesanan Saya</h2>
      <div class="orders-list">
        ${orders.map(order => `
          <div class="order-card">
            <div class="order-header">
              <div>
                <h3>Order #${order.id}</h3>
                <p class="order-date">${new Date(order.createdAt).toLocaleString('id-ID')}</p>
              </div>
              <span class="order-status status-${order.status}">${order.status}</span>
            </div>
            <div class="order-items">
              ${order.items.map(item => `
                <div class="order-item">
                  <span>${item.productName} x${item.quantity}</span>
                  <span>${formatRupiah(item.subtotal)}</span>
                </div>
              `).join('')}
            </div>
            <div class="order-footer">
              <div>
                <p><strong>Alamat:</strong> ${order.deliveryAddress}</p>
                <p><strong>Pembayaran:</strong> ${order.paymentMethod.toUpperCase()}</p>
              </div>
              <div class="order-total">
                <strong>Total: ${formatRupiah(order.totalAmount)}</strong>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function navigateTo(page) {
  currentPage = page;
  const mainContent = document.getElementById('mainContent');

  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });

  const activeLink = document.querySelector(`[data-page="${page}"]`);
  if (activeLink) {
    activeLink.classList.add('active');
  }

  let content = '';
  switch (page) {
    case 'home':
      content = renderHomePage();
      break;
    case 'cart':
      content = renderCartPage();
      break;
    case 'checkout':
      content = renderCheckoutPage();
      break;
    case 'orders':
      content = renderOrdersPage();
      break;
    case 'profile':
      content = renderProfilePage();
      break;
  }

  mainContent.innerHTML = content;
  attachEventListeners();
}

function attachEventListeners() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    const searchButton = document.getElementById('searchButton');
    if (searchButton) {
      searchButton.addEventListener('click', () => {
        const query = document.getElementById('searchInput').value;
        const products = query ? searchProducts(query) : getProducts();
        const grid = document.getElementById('productsGrid');
        // handler klik
        document.getElementById('searchButton').addEventListener('click', () => {
          const query = document.getElementById('searchInput').value;
          // VULNERABLE: menaruh isi input langsung ke innerHTML
          document.getElementById('resultInfo').innerHTML = `Hasil: ${query}`;
        });


        if (products.length === 0) {
          grid.innerHTML = '<div class="empty-state"><p>Produk tidak ditemukan</p></div>';
        } else {
          grid.innerHTML = products.map(product => `
        <div class="product-card">
          <img src="${product.image}" alt="${product.name}" />
          <div class="product-info">
            <h3>${product.name}</h3>
            <p class="product-description">${product.description}</p>
            <div class="product-footer">
              <span class="price">${formatRupiah(product.price)}</span>
              <button class="btn btn-primary btn-add-cart" data-product-id="${product.id}">
                Tambah
              </button>
            </div>
          </div>
        </div>
      `).join('');
        }

        document.querySelectorAll('.btn-add-cart').forEach(btn => {
          btn.addEventListener('click', handleAddToCart);
        });
      });
    }

  }

  document.querySelectorAll('.btn-add-cart').forEach(btn => {
    btn.addEventListener('click', handleAddToCart);
  });

  document.querySelectorAll('.btn-quantity').forEach(btn => {
    btn.addEventListener('click', handleQuantityChange);
  });

  document.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', handleRemoveItem);
  });

  const checkoutBtn = document.querySelector('.btn-checkout');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => navigateTo('checkout'));
  }

  const checkoutForm = document.getElementById('checkoutForm');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', handleCheckout);
  }

  const editProfileBtn = document.querySelector('.btn-edit-profile');
  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', handleEditProfile);
  }
}

function handleAddToCart(e) {
  const productId = e.target.dataset.productId;

  if (!authService.isAuthenticated()) {
    showAlert('Silakan login terlebih dahulu', 'error');
    openAuthModal();
    return;
  }

  try {
    cartService.addToCart(productId, 1);
    updateCartBadge();
    showAlert('Produk berhasil ditambahkan ke keranjang');
  } catch (error) {
    showAlert(error.message, 'error');
  }
}

function handleQuantityChange(e) {
  const productId = e.target.dataset.productId;
  const action = e.target.dataset.action;

  const cart = cartService.getCart();
  const item = cart.find(i => i.productId === productId);

  if (item) {
    const newQuantity = action === 'increase' ? item.quantity + 1 : item.quantity - 1;
    cartService.updateQuantity(productId, newQuantity);
    updateCartBadge();
    navigateTo('cart');
  }
}

function handleRemoveItem(e) {
  const productId = e.target.dataset.productId;
  cartService.removeFromCart(productId);
  updateCartBadge();
  navigateTo('cart');
}

function handleCheckout(e) {
  e.preventDefault();

  const orderData = {
    phone: document.getElementById('checkoutPhone').value,
    deliveryAddress: document.getElementById('checkoutAddress').value,
    paymentMethod: document.getElementById('paymentMethod').value
  };

  try {
    const order = orderService.createOrder(orderData);
    showAlert('Pesanan berhasil dibuat!');
    updateCartBadge();
    navigateTo('orders');
  } catch (error) {
    showAlert(error.message, 'error');
  }
}

function handleEditProfile() {
  const user = authService.getCurrentUser();

  const mainContent = document.getElementById('mainContent');
  mainContent.innerHTML = `
    <div class="profile-page">
      <h2>Edit Profil</h2>

      <div class="profile-edit-form">
        <form id="editProfileForm">
          <div class="form-group">
            <label>Nama Lengkap</label>
            <input type="text" id="editFullName" value="${user.fullName}" required />
          </div>

          <div class="form-group">
            <label>Email</label>
            <input type="email" value="${user.email}" readonly disabled />
            <small>Email tidak dapat diubah</small>
          </div>

          <div class="form-group">
            <label>No. Telepon</label>
            <input type="tel" id="editPhone" value="${user.phone || ''}" required />
          </div>

          <div class="form-group">
            <label>Alamat</label>
            <textarea id="editAddress" required>${user.address || ''}</textarea>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-cancel">Batal</button>
            <button type="submit" class="btn btn-primary">Simpan Perubahan</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const editForm = document.getElementById('editProfileForm');
  editForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const updatedData = {
      fullName: document.getElementById('editFullName').value,
      phone: document.getElementById('editPhone').value,
      address: document.getElementById('editAddress').value
    };

    const users = authService.getAllUsers();
    const userIndex = users.findIndex(u => u.id === user.id);

    if (userIndex !== -1) {
      users[userIndex] = {
        ...users[userIndex],
        fullName: updatedData.fullName,
        phone: updatedData.phone,
        address: updatedData.address
      };

      localStorage.setItem('users', JSON.stringify(users));

      const currentUser = {
        ...user,
        fullName: updatedData.fullName,
        phone: updatedData.phone,
        address: updatedData.address
      };

      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      authService.currentUser = currentUser;

      showAlert('Profil berhasil diperbarui!');
      updateAuthButton();
      navigateTo('profile');
    }
  });

  const cancelBtn = document.querySelector('.btn-cancel');
  cancelBtn.addEventListener('click', () => {
    navigateTo('profile');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('authModal');
  const closeBtn = modal.querySelector('.close');
  const showRegisterLink = document.getElementById('showRegister');
  const showLoginLink = document.getElementById('showLogin');

  closeBtn.onclick = closeAuthModal;

  window.onclick = (e) => {
    if (e.target === modal) {
      closeAuthModal();
    }
  };

  showRegisterLink.onclick = (e) => {
    e.preventDefault();
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
  };

  showLoginLink.onclick = (e) => {
    e.preventDefault();
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
  };

  document.getElementById('loginFormElement').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
      authService.login(email, password);
      closeAuthModal();
      updateAuthButton();
      updateCartBadge();
      showAlert('Login berhasil!');
      navigateTo('home');
    } catch (error) {
      showAlert(error.message, 'error');
    }
  });

  document.getElementById('registerFormElement').addEventListener('submit', (e) => {
    e.preventDefault();

    const userData = {
      email: document.getElementById('registerEmail').value,
      password: document.getElementById('registerPassword').value,
      confirmPassword: document.getElementById('registerConfirmPassword').value,
      fullName: document.getElementById('registerName').value,
      phone: document.getElementById('registerPhone').value,
      address: document.getElementById('registerAddress').value
    };

    try {
      authService.register(userData);
      showAlert('Registrasi berhasil! Silakan login.');
      document.getElementById('registerForm').style.display = 'none';
      document.getElementById('loginForm').style.display = 'block';
      document.getElementById('registerFormElement').reset();
    } catch (error) {
      showAlert(error.message, 'error');
    }
  });

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = e.currentTarget.dataset.page;
      navigateTo(page);
    });
  });

  window.navigateTo = navigateTo;

  updateAuthButton();
  updateCartBadge();
  navigateTo('home');
});
