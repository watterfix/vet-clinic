// ============================================
// МЕНЕДЖЕР БАЗЫ ДАННЫХ (работа с JSON файлом)
// ============================================

const DB_MANAGER = {
    // Загрузка базы данных из файла
    loadDatabase: async function () {
        try {
            const response = await fetch('database.json');
            if (!response.ok) {
                throw new Error('Не удалось загрузить базу данных');
            }
            const data = await response.json();

            // Сохраняем в localStorage для обратной совместимости
            localStorage.setItem('users', JSON.stringify(data.users));
            localStorage.setItem('products', JSON.stringify(data.products));
            localStorage.setItem('orders', JSON.stringify(data.orders));
            localStorage.setItem('settings', JSON.stringify(data.settings));

            console.log('База данных загружена из файла');
            return data;
        } catch (error) {
            console.error('Ошибка загрузки БД:', error);
            return null;
        }
    },

    // Сохранение базы данных в файл
    saveDatabase: async function (data) {
        try {
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

            // Также сохраняем в localStorage
            if (data.users) localStorage.setItem('users', JSON.stringify(data.users));
            if (data.products) localStorage.setItem('products', JSON.stringify(data.products));
            if (data.orders) localStorage.setItem('orders', JSON.stringify(data.orders));
            if (data.settings) localStorage.setItem('settings', JSON.stringify(data.settings));

            console.log('База данных сохранена в файл');
            return true;
        } catch (error) {
            console.error('Ошибка сохранения БД:', error);
            return false;
        }
    },

    // Экспорт базы данных
    exportDatabase: function () {
        const data = {
            users: JSON.parse(localStorage.getItem('users')) || {},
            products: JSON.parse(localStorage.getItem('products')) || {},
            orders: JSON.parse(localStorage.getItem('orders')) || [],
            settings: JSON.parse(localStorage.getItem('settings')) || {}
        };

        this.saveDatabase(data);
    },

    // Импорт базы данных из файла
    importDatabase: function (file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);

                    // Валидация структуры данных
                    if (!data.users || !data.products) {
                        reject(new Error('Неверный формат файла базы данных'));
                        return;
                    }

                    // Сохраняем в localStorage
                    localStorage.setItem('users', JSON.stringify(data.users));
                    localStorage.setItem('products', JSON.stringify(data.products));
                    localStorage.setItem('orders', JSON.stringify(data.orders || []));
                    localStorage.setItem('settings', JSON.stringify(data.settings || {}));

                    resolve(data);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    },

    // Добавление пользователя
    addUser: async function (userData) {
        const users = JSON.parse(localStorage.getItem('users')) || {};
        users[userData.email] = {
            name: userData.name,
            password: userData.password,
            role: userData.role || 'user',
            registered: new Date().toISOString()
        };

        localStorage.setItem('users', JSON.stringify(users));

        // Автоматически экспортируем в файл
        this.exportDatabase();

        return true;
    },

    // Обновление пользователя
    updateUser: function (email, userData) {
        const users = JSON.parse(localStorage.getItem('users')) || {};
        if (users[email]) {
            users[email] = { ...users[email], ...userData };
            localStorage.setItem('users', JSON.stringify(users));
            this.exportDatabase();
            return true;
        }
        return false;
    },

    // Добавление заказа
    addOrder: function (orderData) {
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        orders.push({
            ...orderData,
            id: Date.now(),
            date: new Date().toISOString()
        });

        localStorage.setItem('orders', JSON.stringify(orders));
        this.exportDatabase();

        return true;
    },

    // Обновление товара
    updateProduct: function (productId, productData) {
        const products = JSON.parse(localStorage.getItem('products')) || {};
        if (products[productId]) {
            products[productId] = { ...products[productId], ...productData };
            localStorage.setItem('products', JSON.stringify(products));
            this.exportDatabase();
            return true;
        }
        return false;
    },

    // Получение статистики
    getStats: function () {
        const users = JSON.parse(localStorage.getItem('users')) || {};
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        const products = JSON.parse(localStorage.getItem('products')) || {};

        const totalUsers = Object.keys(users).length;
        const totalOrders = orders.length;
        const totalProducts = Object.keys(products).length;
        const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);

        const adminCount = Object.values(users).filter(u => u.role === 'admin').length;
        const userCount = totalUsers - adminCount;

        const today = new Date().toDateString();
        const todayOrders = orders.filter(o => new Date(o.date).toDateString() === today).length;

        return {
            totalUsers,
            totalOrders,
            totalProducts,
            totalRevenue,
            adminCount,
            userCount,
            todayOrders,
            averageOrderValue: totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0
        };
    }
};

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    // Пробуем загрузить данные из файла
    const data = await DB_MANAGER.loadDatabase();

    // Если файл не загрузился, используем локальные данные
    if (!data) {
        console.log('Используем локальные данные');
        // Инициализируем admin если нет
        const users = JSON.parse(localStorage.getItem('users')) || {};
        if (!users['admin@vetclinic.ru']) {
            users['admin@vetclinic.ru'] = {
                name: 'Admin',
                password: 'admin123',
                role: 'admin',
                registered: new Date().toISOString()
            };
            localStorage.setItem('users', JSON.stringify(users));
        }
    }
});