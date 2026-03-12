// ============================================
// МЕНЕДЖЕР БАЗЫ ДАННЫХ (работа с JSON файлом)
// ============================================

const DB_MANAGER = {
    // Текущие данные в памяти
    currentData: {
        users: {},
        products: {},
        orders: [],
        settings: {}
    },

    // Загрузка базы данных из файла
    loadDatabase: async function () {
        try {
            // Пробуем загрузить из localStorage сначала
            const localUsers = localStorage.getItem('users');
            const localProducts = localStorage.getItem('products');
            const localOrders = localStorage.getItem('orders');
            const localSettings = localStorage.getItem('settings');

            if (localUsers) this.currentData.users = JSON.parse(localUsers);
            if (localProducts) this.currentData.products = JSON.parse(localProducts);
            if (localOrders) this.currentData.orders = JSON.parse(localOrders);
            if (localSettings) this.currentData.settings = JSON.parse(localSettings);

            // Пробуем загрузить из файла (если есть)
            try {
                const response = await fetch('database.json');
                if (response.ok) {
                    const fileData = await response.json();

                    // Объединяем данные из файла с локальными (файл приоритетнее)
                    if (fileData.users) {
                        this.currentData.users = { ...this.currentData.users, ...fileData.users };
                        localStorage.setItem('users', JSON.stringify(this.currentData.users));
                    }
                    if (fileData.products) {
                        this.currentData.products = { ...this.currentData.products, ...fileData.products };
                        localStorage.setItem('products', JSON.stringify(this.currentData.products));
                    }
                    if (fileData.orders) {
                        this.currentData.orders = [...this.currentData.orders, ...fileData.orders];
                        localStorage.setItem('orders', JSON.stringify(this.currentData.orders));
                    }
                    if (fileData.settings) {
                        this.currentData.settings = { ...this.currentData.settings, ...fileData.settings };
                        localStorage.setItem('settings', JSON.stringify(this.currentData.settings));
                    }

                    console.log('База данных загружена из файла');
                }
            } catch (fileError) {
                console.log('Файл database.json не найден, используем локальные данные');
            }

            return this.currentData;
        } catch (error) {
            console.error('Ошибка загрузки БД:', error);
            return null;
        }
    },

    // Сохранение базы данных в файл
    saveDatabase: async function (data) {
        try {
            // Обновляем текущие данные
            if (data) {
                if (data.users) this.currentData.users = data.users;
                if (data.products) this.currentData.products = data.products;
                if (data.orders) this.currentData.orders = data.orders;
                if (data.settings) this.currentData.settings = data.settings;
            }

            // Подготавливаем данные для сохранения
            const saveData = {
                users: this.currentData.users,
                products: this.currentData.products,
                orders: this.currentData.orders,
                settings: this.currentData.settings,
                lastUpdated: new Date().toISOString()
            };

            // Создаем и скачиваем файл
            const jsonData = JSON.stringify(saveData, null, 2);
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = 'database.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Обновляем localStorage
            localStorage.setItem('users', JSON.stringify(this.currentData.users));
            localStorage.setItem('products', JSON.stringify(this.currentData.products));
            localStorage.setItem('orders', JSON.stringify(this.currentData.orders));
            localStorage.setItem('settings', JSON.stringify(this.currentData.settings));

            console.log('База данных сохранена в файл');

            // Показываем уведомление
            if (window.showNotification) {
                window.showNotification('База данных сохранена', 'success');
            }

            return true;
        } catch (error) {
            console.error('Ошибка сохранения БД:', error);
            if (window.showNotification) {
                window.showNotification('Ошибка сохранения БД', 'error');
            }
            return false;
        }
    },

    // Автоматическое сохранение при изменениях
    autoSave: function () {
        console.log('Автосохранение базы данных...');
        this.saveDatabase();
    },

    // Добавление пользователя
    addUser: function (userData) {
        try {
            // Загружаем актуальных пользователей
            let users = JSON.parse(localStorage.getItem('users')) || {};

            // Добавляем нового пользователя
            users[userData.email] = {
                name: userData.name,
                password: userData.password,
                role: userData.role || 'user',
                registered: new Date().toISOString()
            };

            // Сохраняем в localStorage
            localStorage.setItem('users', JSON.stringify(users));

            // Обновляем текущие данные
            this.currentData.users = users;

            // Автоматически сохраняем в файл
            this.autoSave();

            console.log('Пользователь добавлен:', userData.email);
            return true;
        } catch (error) {
            console.error('Ошибка добавления пользователя:', error);
            return false;
        }
    },

    // Обновление пользователя
    updateUser: function (email, userData) {
        try {
            let users = JSON.parse(localStorage.getItem('users')) || {};

            if (users[email]) {
                users[email] = { ...users[email], ...userData };
                localStorage.setItem('users', JSON.stringify(users));

                this.currentData.users = users;
                this.autoSave();

                console.log('Пользователь обновлен:', email);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Ошибка обновления пользователя:', error);
            return false;
        }
    },

    // Удаление пользователя
    deleteUser: function (email) {
        try {
            let users = JSON.parse(localStorage.getItem('users')) || {};

            if (users[email] && email !== 'admin@vetclinic.ru') {
                delete users[email];
                localStorage.setItem('users', JSON.stringify(users));

                this.currentData.users = users;
                this.autoSave();

                console.log('Пользователь удален:', email);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Ошибка удаления пользователя:', error);
            return false;
        }
    },

    // Добавление товара
    addProduct: function (productId, productData) {
        try {
            let products = JSON.parse(localStorage.getItem('products')) || {};

            products[productId] = {
                name: productData.name,
                price: parseInt(productData.price),
                category: productData.category,
                description: productData.description || '',
                inStock: true
            };

            localStorage.setItem('products', JSON.stringify(products));

            this.currentData.products = products;
            this.autoSave();

            console.log('Товар добавлен:', productId);
            return true;
        } catch (error) {
            console.error('Ошибка добавления товара:', error);
            return false;
        }
    },

    // Обновление товара
    updateProduct: function (productId, productData) {
        try {
            let products = JSON.parse(localStorage.getItem('products')) || {};

            if (products[productId]) {
                products[productId] = { ...products[productId], ...productData };
                localStorage.setItem('products', JSON.stringify(products));

                this.currentData.products = products;
                this.autoSave();

                console.log('Товар обновлен:', productId);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Ошибка обновления товара:', error);
            return false;
        }
    },

    // Удаление товара
    deleteProduct: function (productId) {
        try {
            let products = JSON.parse(localStorage.getItem('products')) || {};

            if (products[productId]) {
                delete products[productId];
                localStorage.setItem('products', JSON.stringify(products));

                this.currentData.products = products;
                this.autoSave();

                console.log('Товар удален:', productId);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Ошибка удаления товара:', error);
            return false;
        }
    },

    // Добавление заказа
    addOrder: function (orderData) {
        try {
            let orders = JSON.parse(localStorage.getItem('orders')) || [];

            const newOrder = {
                ...orderData,
                id: Date.now(),
                date: new Date().toISOString()
            };

            orders.push(newOrder);
            localStorage.setItem('orders', JSON.stringify(orders));

            this.currentData.orders = orders;
            this.autoSave();

            console.log('Заказ добавлен:', newOrder.orderNumber);
            return true;
        } catch (error) {
            console.error('Ошибка добавления заказа:', error);
            return false;
        }
    },

    // Удаление заказа
    deleteOrder: function (orderId) {
        try {
            let orders = JSON.parse(localStorage.getItem('orders')) || [];

            orders = orders.filter(o => o.id != orderId);
            localStorage.setItem('orders', JSON.stringify(orders));

            this.currentData.orders = orders;
            this.autoSave();

            console.log('Заказ удален:', orderId);
            return true;
        } catch (error) {
            console.error('Ошибка удаления заказа:', error);
            return false;
        }
    },

    // Обновление настроек
    updateSettings: function (settingsData) {
        try {
            let settings = JSON.parse(localStorage.getItem('settings')) || {};

            settings = { ...settings, ...settingsData };
            localStorage.setItem('settings', JSON.stringify(settings));

            this.currentData.settings = settings;
            this.autoSave();

            console.log('Настройки обновлены');
            return true;
        } catch (error) {
            console.error('Ошибка обновления настроек:', error);
            return false;
        }
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

        // Статистика по категориям товаров
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
            userCount,
            todayOrders,
            averageOrderValue: totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0,
            productsByCategory
        };
    },

    // Экспорт базы данных
    exportDatabase: function () {
        this.saveDatabase();
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

                    // Обновляем текущие данные
                    this.currentData = {
                        users: data.users,
                        products: data.products,
                        orders: data.orders || [],
                        settings: data.settings || {}
                    };

                    console.log('База данных импортирована');
                    resolve(data);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    },

    // Сброс до начальных данных
    resetToDefault: function () {
        // Начальные данные админа
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

        // Очищаем остальные данные
        localStorage.setItem('orders', JSON.stringify([]));
        localStorage.setItem('cart', JSON.stringify([]));
        localStorage.removeItem('currentUser');

        this.currentData = {
            users: defaultUsers,
            products: JSON.parse(localStorage.getItem('products')) || {},
            orders: [],
            settings: {}
        };

        this.autoSave();

        console.log('База данных сброшена до начальной');
    }
};

// Автоматическая инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    // Делаем DB_MANAGER глобальным
    window.DB_MANAGER = DB_MANAGER;

    // Загружаем данные
    await DB_MANAGER.loadDatabase();

    console.log('DB_MANAGER инициализирован');
});
window.DB_MANAGER = DB_MANAGER;