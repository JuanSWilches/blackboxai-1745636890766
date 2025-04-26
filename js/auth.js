class SessionManager {
    static instance = null;
    constructor() {
        if (SessionManager.instance) return SessionManager.instance;
        this.currentUser = null;
        this.loadSession();
        SessionManager.instance = this;
    }
    static getInstance() {
        if (!SessionManager.instance) SessionManager.instance = new SessionManager();
        return SessionManager.instance;
    }
    login(email, password) {
        const users = {
            'admin@restaurant.com': { password: 'admin123', role: 'admin' },
            'cliente@email.com': { password: 'cliente123', role: 'client' }
        };
        if (users[email] && users[email].password === password) {
            this.currentUser = { email, role: users[email].role };
            this.saveSession();
            return true;
        }
        return false;
    }
    getCurrentUser() {
        return this.currentUser;
    }
    logout() {
        this.currentUser = null;
        this.clearSession();
    }
    saveSession() {
        if (this.currentUser) {
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        }
    }
    loadSession() {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
        }
    }
    clearSession() {
        localStorage.removeItem('currentUser');
    }
}

class UserFactory {
    createUser(type, data) {
        if (type === 'admin') return new AdminUser(data);
        if (type === 'client') return new ClientUser(data);
        throw new Error('Tipo de usuario no válido');
    }
}

class User {
    constructor(data) {
        this.email = data.email;
        this.role = data.role;
    }
}

class AdminUser extends User {
    constructor(data) {
        super(data);
        this.permissions = ['manage'];
    }
}

class ClientUser extends User {
    constructor(data) {
        super(data);
        this.permissions = ['reserve'];
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;
    loginForm.addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const session = SessionManager.getInstance();
        if (session.login(email, password)) {
            const user = new UserFactory().createUser(session.getCurrentUser().role, session.getCurrentUser());
            if (user.role === 'admin') window.location.href = '/pages/admin/dashboard.html';
            else window.location.href = '/pages/client/dashboard.html';
        } else {
            alert('Credenciales inválidas');
        }
    });
});

function logout() {
    SessionManager.getInstance().logout();
    window.location.href = '/index.html';
}


// Inicializar login
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;
    loginForm.addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const session = SessionManager.getInstance();
        if (session.login(email, password)) {
            const user = new UserFactory().createUser(session.getCurrentUser().role, session.getCurrentUser());
            if (user.role === 'admin') window.location.href = '/pages/admin/dashboard.html';
            else window.location.href = '/pages/client/dashboard.html';
        } else {
            alert('Credenciales inválidas');
        }
    });
});
