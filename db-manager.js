// ============================================
// МЕНЕДЖЕР БАЗЫ ДАННЫХ (упрощенная версия)
// ============================================

const DB_MANAGER = {
    // Текущие данные
    currentData: {
        users: {},
        products: {},
        orders: [],
        settings: {}
    },

    // Загрузка данных
    loadDatabase: function () {
        return new Promise((resolve) => {
            console.log('Загрузка данных...');

            // Загружаем из localStorage
            this.currentData.users = JSON.parse(localStorage.getItem('users')) || {};
            this.currentData.products = JSON.parse(localStorage.getItem('products')) || {};
            this.currentData.orders = JSON.parse(localStorage.getItem('orders')) || [];
            this.currentData.settings = JSON.parse(localStorage.getItem('settings')) || {};

            console.log('Данные загружены');
            resolve(this.currentData);
        });
    },

    // Сохранение в файл
    exportDatabase: function () {
        const data = {
            users: this.currentData.users,
            products: this.currentData.products,
            orders: this.currentData.orders,
            settings: this.currentData.settings,
            lastUpdated: new Date().toISOString()
        };

        const jsonData = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'database.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    // Добавление пользователя
    addUser: function (userData) {
        let users = JSON.parse(localStorage.getItem('users')) || {};
        users[userData.email] = {
            name: userData.name,
            password: userData.password,
            role: userData.role || 'user',
            registered: new Date().toISOString()
        };
        localStorage.setItem('users', JSON.stringify(users));
        this.currentData.users = users;
        return true;
    },

    // Обновление пользователя
    updateUser: function (email, userData) {
        let users = JSON.parse(localStorage.getItem('users')) || {};
        if (users[email]) {
            users[email] = { ...users[email], ...userData };
            localStorage.setItem('users', JSON.stringify(users));
            this.currentData.users = users;
            return true;
        }
        return false;
    },

    // Удаление пользователя
    deleteUser: function (email) {
        if (email === 'admin@vetclinic.ru') return false;

        let users = JSON.parse(localStorage.getItem('users')) || {};
        if (users[email]) {
            delete users[email];
            localStorage.setItem('users', JSON.stringify(users));
            this.currentData.users = users;
            return true;
        }
        return false;
    },

    // Добавление товара
    addProduct: function (id, productData) {
        let products = JSON.parse(localStorage.getItem('products')) || {};
        products[id] = {
            name: productData.name,
            price: parseInt(productData.price),
            category: productData.category,
            description: productData.description || ''
        };
        localStorage.setItem('products', JSON.stringify(products));
        this.currentData.products = products;
        return true;
    },

    // Обновление товара
    updateProduct: function (id, productData) {
        let products = JSON.parse(localStorage.getItem('products')) || {};
        if (products[id]) {
            products[id] = { ...products[id], ...productData };
            localStorage.setItem('products', JSON.stringify(products));
            this.currentData.products = products;
            return true;
        }
        return false;
    },

    // Удаление товара
    deleteProduct: function (id) {
        let products = JSON.parse(localStorage.getItem('products')) || {};
        if (products[id]) {
            delete products[id];
            localStorage.setItem('products', JSON.stringify(products));
            this.currentData.products = products;
            return true;
        }
        return false;
    },

    // Добавление заказа
    addOrder: function (orderData) {
        let orders = JSON.parse(localStorage.getItem('orders')) || [];
        orders.push(orderData);
        localStorage.setItem('orders', JSON.stringify(orders));
        this.currentData.orders = orders;
        return true;
    },

    // Удаление заказа
    deleteOrder: function (orderId) {
        let orders = JSON.parse(localStorage.getItem('orders')) || [];
        orders = orders.filter(o => o.id != orderId);
        localStorage.setItem('orders', JSON.stringify(orders));
        this.currentData.orders = orders;
        return true;
    },

    // Получение статистики
    getStats: function () {
        const users = this.currentData.users || {};
        const orders = this.currentData.orders || [];
        const products = this.currentData.products || {};

        const totalUsers = Object.keys(users).length;
        const totalOrders = orders.length;
        const totalProducts = Object.keys(products).length;
        const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);

        const adminCount = Object.values(users).filter(u => u.role === 'admin').length;

        const today = new Date().toDateString();
        const todayOrders = orders.filter(o => new Date(o.date).toDateString() === today).length;

        // Статистика по категориям
        const productsByCategory = {};
        Object.values(products).forEach(p => {
            productsByCategory[p.category] = (productsByCategory[p.category] || 0) + 1;
        });

        return {
            totalUsers,
            totalOrders,
            totalProducts,
            totalRevenue,
            adminCount,
            userCount: totalUsers - adminCount,
            todayOrders,
            averageOrderValue: totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0,
            productsByCategory
        };
    },

    // Сброс до начальных данных
    resetToDefault: function () {
        const defaultUsers = {
            'admin@vetclinic.ru': {
                name: 'Admin',
                password: 'admin123',
                role: 'admin',
                registered: new Date().toISOString()
            },
            'user@example.com': {
                name: 'Иван Петров',
                password: 'user123',
                role: 'user',
                registered: new Date().toISOString()
            }
        };

        localStorage.setItem('users', JSON.stringify(defaultUsers));
        localStorage.setItem('orders', JSON.stringify([]));
        localStorage.removeItem('currentUser');

        this.currentData.users = defaultUsers;
        this.currentData.orders = [];
    }
};

// Делаем глобальным
window.DB_MANAGER = DB_MANAGER;
console.log('DB_MANAGER загружен');