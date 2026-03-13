// ============================================
// МЕНЕДЖЕР БАЗЫ ДАННЫХ (с JSONBin.io)
// ============================================

const DB_MANAGER = {
    // Ваши данные из JSONBin
    BIN_ID: '69b34a7ab7ec241ddc639917',
    API_KEY: '$2a$10$nh6Q.DQPxUy3JGi6.fEL3e6DOeE02iVHQ1FBZ7N5FeF8sW0atefpK',
    BASE_URL: 'https://api.jsonbin.io/v3',

    currentData: {
        users: [],
        products: [],
        orders: [],
        messages: [],
        settings: {}
    },

    // ============================================
    // ОСНОВНЫЕ МЕТОДЫ
    // ============================================

    // Загрузка данных с сервера
    async loadDatabase() {
        console.log('🔄 Загрузка данных с JSONBin...');

        try {
            const response = await fetch(`${this.BASE_URL}/b/${this.BIN_ID}/latest`, {
                headers: {
                    'X-Master-Key': this.API_KEY
                },
                cache: 'no-cache'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            this.currentData = result.record || result;

            // Убеждаемся, что все поля - массивы
            if (!Array.isArray(this.currentData.users)) this.currentData.users = [];
            if (!Array.isArray(this.currentData.products)) this.currentData.products = [];
            if (!Array.isArray(this.currentData.orders)) this.currentData.orders = [];
            if (!Array.isArray(this.currentData.messages)) this.currentData.messages = [];
            if (!this.currentData.settings) this.currentData.settings = {};

            console.log(`✅ Загружено пользователей: ${this.currentData.users.length}`);
            console.log(`✅ Загружено товаров: ${this.currentData.products.length}`);
            console.log(`✅ Загружено заказов: ${this.currentData.orders.length}`);

            // Сохраняем в localStorage для совместимости
            this.saveToLocalStorage();

            return this.currentData;

        } catch (error) {
            console.error('❌ Ошибка загрузки:', error);
            this.loadFromLocalStorage();
            return this.currentData;
        }
    },

    // Сохранение данных на сервер (исправленная версия)
async saveToServer() {
    console.log('💾 Сохранение данных...', this.currentData);

    try {
        const response = await fetch(`${this.BASE_URL}/b/${this.BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': this.API_KEY,
                'X-Bin-Versioning': 'false' // Добавляем для отключения версионирования
            },
            body: JSON.stringify(this.currentData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const result = await response.json();
        console.log('✅ Данные сохранены на JSONBin:', result);
        this.saveToLocalStorage();
        return true;

    } catch (error) {
        console.error('❌ Ошибка сохранения на JSONBin:', error);
        
        // Сохраняем локально как резервную копию
        this.saveToLocalStorage();
        
        // Показываем уведомление пользователю
        if (window.showNotification) {
            window.showNotification('Заказ сохранен локально. Проблема с соединением с сервером.', 'warning');
        }
        
        return false;
    }
}

    // Сохранение в localStorage (для совместимости со старым кодом)
    saveToLocalStorage() {
        try {
            // Сохраняем полный бэкап
            localStorage.setItem('db_backup', JSON.stringify(this.currentData));

            // Конвертируем пользователей в объект для старого формата
            const usersObj = {};
            this.currentData.users.forEach(user => {
                usersObj[user.email] = {
                    name: user.name,
                    password: user.password,
                    role: user.role,
                    registered: user.registered
                };
            });

            // Конвертируем товары в объект для старого формата
            const productsObj = {};
            this.currentData.products.forEach(product => {
                productsObj[product.id] = {
                    name: product.name,
                    price: product.price,
                    category: product.category,
                    description: product.description
                };
            });

            localStorage.setItem('users', JSON.stringify(usersObj));
            localStorage.setItem('products', JSON.stringify(productsObj));
            localStorage.setItem('orders', JSON.stringify(this.currentData.orders));
            localStorage.setItem('messages', JSON.stringify(this.currentData.messages));

        } catch (error) {
            console.error('Ошибка сохранения в localStorage:', error);
        }
    },

    // Загрузка из localStorage
    loadFromLocalStorage() {
        try {
            const backup = localStorage.getItem('db_backup');
            if (backup) {
                this.currentData = JSON.parse(backup);
                console.log('📁 Данные загружены из localStorage');
            }
        } catch (error) {
            console.error('Ошибка загрузки из localStorage:', error);
        }
    },

    // ============================================
    // МЕТОДЫ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ
    // ============================================

    // Получение пользователя по email
    getUserByEmail(email) {
        return this.currentData.users.find(u => u.email === email);
    },

    // Проверка существования пользователя
    userExists(email) {
        return this.currentData.users.some(u => u.email === email);
    },

    // Добавление пользователя
    async addUser(userData) {
        const newUser = {
            id: userData.email,
            email: userData.email,
            name: userData.name,
            password: userData.password,
            role: userData.role || 'user',
            registered: new Date().toISOString()
        };

        this.currentData.users.push(newUser);
        await this.saveToServer();
        return newUser;
    },

    // Обновление пользователя
    async updateUser(email, userData) {
        const index = this.currentData.users.findIndex(u => u.email === email);
        if (index === -1) return false;

        this.currentData.users[index] = {
            ...this.currentData.users[index],
            ...userData
        };

        await this.saveToServer();
        return true;
    },

    // Удаление пользователя
    async deleteUser(email) {
        if (email === 'admin@vetclinic.ru') {
            console.warn('Нельзя удалить главного администратора');
            return false;
        }

        this.currentData.users = this.currentData.users.filter(u => u.email !== email);
        await this.saveToServer();
        return true;
    },

    // ============================================
    // МЕТОДЫ ДЛЯ ТОВАРОВ
    // ============================================

    // Добавление товара
    async addProduct(productData) {
        this.currentData.products.push(productData);
        await this.saveToServer();
        return productData;
    },

    // Обновление товара
    async updateProduct(id, productData) {
        const index = this.currentData.products.findIndex(p => p.id === id);
        if (index === -1) return false;

        this.currentData.products[index] = {
            ...this.currentData.products[index],
            ...productData
        };

        await this.saveToServer();
        return true;
    },

    // Удаление товара
    async deleteProduct(id) {
        this.currentData.products = this.currentData.products.filter(p => p.id !== id);
        await this.saveToServer();
        return true;
    },

    // Получение товара по ID
    getProduct(id) {
        return this.currentData.products.find(p => p.id === id);
    },

    // ============================================
    // МЕТОДЫ ДЛЯ ЗАКАЗОВ
    // ============================================

    // Добавление заказа (исправленная версия)
async addOrder(orderData) {
    // Создаем копию данных заказа с уникальным ID
    const newOrder = {
        ...orderData,
        id: Date.now().toString(), // Уникальный ID заказа
        date: orderData.date || new Date().toISOString(),
        status: 'new' // Добавляем статус заказа
    };
    
    // Убеждаемся, что у каждого товара есть все необходимые поля
    if (newOrder.items) {
        newOrder.items = newOrder.items.map(item => ({
            id: item.id || Date.now() + Math.random(),
            name: item.name,
            price: item.price,
            quantity: item.quantity || 1
        }));
    }
    
    this.currentData.orders.push(newOrder);
    await this.saveToServer();
    console.log('✅ Заказ добавлен в базу данных:', newOrder);
    return newOrder;
}

    // Удаление заказа
    async deleteOrder(orderId) {
        this.currentData.orders = this.currentData.orders.filter(o => o.id != orderId);
        await this.saveToServer();
        return true;
    },

    // Получение заказа по ID
    getOrder(orderId) {
        return this.currentData.orders.find(o => o.id == orderId);
    },

    // Получение заказов пользователя
    getUserOrders(email) {
        return this.currentData.orders.filter(o => o.user === email);
    },

    // ============================================
    // МЕТОДЫ ДЛЯ СООБЩЕНИЙ
    // ============================================

    // Добавление сообщения
    async addMessage(messageData) {
        const newMessage = {
            ...messageData,
            id: Date.now().toString(),
            date: new Date().toISOString(),
            status: 'new'
        };

        this.currentData.messages.push(newMessage);
        await this.saveToServer();
        return newMessage;
    },

    // Получение всех сообщений
    getMessages() {
        return this.currentData.messages;
    },

    // Отметить сообщение как прочитанное
    async markMessageAsRead(messageId) {
        const index = this.currentData.messages.findIndex(m => m.id === messageId);
        if (index === -1) return false;

        this.currentData.messages[index].status = 'read';
        await this.saveToServer();
        return true;
    },

    // Удаление сообщения
    async deleteMessage(messageId) {
        this.currentData.messages = this.currentData.messages.filter(m => m.id !== messageId);
        await this.saveToServer();
        return true;
    },

    // ============================================
    // МЕТОДЫ ДЛЯ СТАТИСТИКИ
    // ============================================

    // Получение статистики
    getStats() {
        const totalUsers = this.currentData.users.length;
        const totalOrders = this.currentData.orders.length;
        const totalProducts = this.currentData.products.length;
        const totalMessages = this.currentData.messages.length;

        const totalRevenue = this.currentData.orders.reduce((sum, order) => sum + (order.total || 0), 0);
        const adminCount = this.currentData.users.filter(u => u.role === 'admin').length;

        const today = new Date().toDateString();
        const todayOrders = this.currentData.orders.filter(o => new Date(o.date).toDateString() === today).length;

        // Статистика по категориям товаров
        const productsByCategory = {};
        this.currentData.products.forEach(p => {
            productsByCategory[p.category] = (productsByCategory[p.category] || 0) + 1;
        });

        return {
            totalUsers,
            totalOrders,
            totalProducts,
            totalMessages,
            totalRevenue,
            adminCount,
            userCount: totalUsers - adminCount,
            todayOrders,
            averageOrderValue: totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0,
            productsByCategory
        };
    },

    // ============================================
    // МЕТОДЫ ДЛЯ РЕЗЕРВНОГО КОПИРОВАНИЯ
    // ============================================

    // Создание резервной копии
    createBackup() {
        const backup = {
            id: Date.now(),
            date: new Date().toISOString(),
            name: `Backup ${new Date().toLocaleString()}`,
            data: {
                users: this.currentData.users,
                products: this.currentData.products,
                orders: this.currentData.orders,
                messages: this.currentData.messages,
                settings: this.currentData.settings
            },
            stats: this.getStats()
        };

        // Сохраняем в историю бэкапов
        let backups = JSON.parse(localStorage.getItem('backups')) || [];
        backups.push(backup);

        // Оставляем только последние 10 бэкапов
        if (backups.length > 10) {
            backups = backups.slice(-10);
        }

        localStorage.setItem('backups', JSON.stringify(backups));
        return backup;
    },

    // Восстановление из бэкапа
    async restoreFromBackup(backupData) {
        try {
            if (backupData.data) {
                this.currentData = backupData.data;
            } else {
                this.currentData = backupData;
            }

            await this.saveToServer();
            this.saveToLocalStorage();
            return true;

        } catch (error) {
            console.error('Ошибка восстановления:', error);
            return false;
        }
    },

    // Сброс до начальных данных
    async resetToDefault() {
        this.currentData = {
            users: [
                {
                    id: "admin@vetclinic.ru",
                    email: "admin@vetclinic.ru",
                    name: "Admin",
                    password: "admin123",
                    role: "admin",
                    registered: new Date().toISOString()
                }
            ],
            products: [],
            orders: [],
            messages: [],
            settings: {}
        };

        await this.saveToServer();
        this.createBackup();
        return this.currentData;
    }
};

// Делаем глобальным
window.DB_MANAGER = DB_MANAGER;
console.log('✅ DB_MANAGER готов (полная версия)');

// Автоматическая загрузка данных
DB_MANAGER.loadDatabase();
