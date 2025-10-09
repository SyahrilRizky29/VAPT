export class AuthService {
  constructor() {
    this.currentUser = this.getCurrentUser();
  }

  register(userData) {
    const users = this.getAllUsers();

    if (users.find(u => u.email === userData.email)) {
      throw new Error('Email sudah terdaftar');
    }

    if (userData.password !== userData.confirmPassword) {
      throw new Error('Password tidak cocok');
    }

    const newUser = {
      id: Date.now().toString(),
      email: userData.email,
      password: userData.password,
      fullName: userData.fullName,
      phone: userData.phone,
      address: userData.address,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    const userWithoutPassword = { ...newUser };
    delete userWithoutPassword.password;

    return userWithoutPassword;
  }

  login(email, password) {
    const users = this.getAllUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
      throw new Error('Email atau password salah');
    }

    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password;

    localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
    this.currentUser = userWithoutPassword;

    return userWithoutPassword;
  }

  logout() {
    localStorage.removeItem('currentUser');
    this.currentUser = null;
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated() {
    return this.currentUser !== null;
  }

  getAllUsers() {
    const usersStr = localStorage.getItem('users');
    return usersStr ? JSON.parse(usersStr) : [];
  }
}
