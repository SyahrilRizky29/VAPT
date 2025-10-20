// ===== auth.js (versi class, tetap aman tanpa DB + SHA-256) =====
export class AuthService {
  constructor() {}

  async _sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  async register(user) {
    const users = JSON.parse(localStorage.getItem("users")) || [];
    if (users.some(u => u.email === user.email)) {
      return false;
    }

    const passwordHash = await this._sha256(user.password);
    const newUser = {
      id: Date.now(),
      name: user.name,
      email: user.email,
      passwordHash,
      phone: user.phone,
      address: user.address,
    };

    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));
    return true;
  }

  async login(email, password) {
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const passwordHash = await this._sha256(password);
    const user = users.find(u => u.email === email && u.passwordHash === passwordHash);

    if (!user) {
      return false;
    }

    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const sessions = JSON.parse(localStorage.getItem("sessions")) || {};
    sessions[token] = user.id;
    localStorage.setItem("sessions", JSON.stringify(sessions));

    localStorage.setItem("authToken", token);
    localStorage.setItem("currentUser", JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address
    }));
    return true;
  }

  logout() {
    const token = localStorage.getItem("authToken");
    const sessions = JSON.parse(localStorage.getItem("sessions")) || {};

    if (token && sessions[token]) {
      delete sessions[token];
      localStorage.setItem("sessions", JSON.stringify(sessions));
    }

    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
  }

  isAuthenticated() {
    const token = localStorage.getItem("authToken");
    const sessions = JSON.parse(localStorage.getItem("sessions")) || {};
    return token && sessions[token];
  }

  getCurrentUser() {
    const user = localStorage.getItem("currentUser");
    return user ? JSON.parse(user) : null;
  }
}
