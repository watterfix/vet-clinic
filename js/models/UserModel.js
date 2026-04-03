class UserModel {
    constructor(dbManager) {
        this.db = dbManager;
        this.currentUser = null;
    }

    async login(email, password) {
        await this.db.waitForInit();

        const { data, error } = await this.db.getSupabase()
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !data) {
            throw new Error('Пользователь не найден');
        }

        if (data.password !== password) {
            throw new Error('Неверный пароль');
        }

        this.currentUser = {
            id: data.id,
            email: data.email,
            name: data.name,
            role: data.role
        };

        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

        return this.currentUser;
    }

    async register(userData) {
        await this.db.waitForInit();

        // Проверяем существование
        const existing = await this.db.getSupabase()
            .from('users')
            .select('email')
            .eq('email', userData.email)
            .single();

        if (existing.data) {
            throw new Error('Пользователь с таким email уже существует');
        }

        const newUser = {
            email: userData.email,
            name: userData.name,
            password: userData.password,
            role: userData.role || APP_CONFIG.ROLES.USER,
            registered: new Date().toISOString()
        };

        const result = await this.db.insert('users', newUser);
        return result;
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
    }

    getCurrentUser() {
        if (!this.currentUser) {
            const saved = localStorage.getItem('currentUser');
            if (saved) {
                this.currentUser = JSON.parse(saved);
            }
        }
        return this.currentUser;
    }

    isAdmin() {
        const user = this.getCurrentUser();
        return user && user.role === APP_CONFIG.ROLES.ADMIN;
    }

    isAuthenticated() {
        return this.getCurrentUser() !== null;
    }

    async getAllUsers() {
        if (!this.isAdmin()) {
            throw new Error('Доступ запрещен');
        }
        return await this.db.getAll('users');
    }

    async deleteUser(email) {
        if (!this.isAdmin()) {
            throw new Error('Доступ запрещен');
        }

        if (email === 'admin@vetclinic.ru') {
            throw new Error('Нельзя удалить главного администратора');
        }

        await this.db.getSupabase()
            .from('users')
            .delete()
            .eq('email', email);

        return true;
    }
}

window.UserModel = UserModel;