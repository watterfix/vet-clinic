// ============================================
// МЕНЕДЖЕР БАЗЫ ДАННЫХ (с поддержкой объектного формата)
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
            const data = result.record || result;
            
            console.log('📦 Получены данные:', data);

            // Преобразуем users из объекта в массив (если нужно)
            if (data.users && typeof data.users === 'object' && !Array.isArray(data.users)) {
                this.currentData.users = Object.keys(data.users).map(email => ({
                    id: email,
                    email: email,
                    name: data.users[email].name,
                    password: data.users[email].password,
                    role: data.users[email].role,
                    registered: data.users[email].registered || new Date().toISOString()
                }));
                console.log('✅ Преобразовано пользователей из объекта в массив');
            } else if (Array.isArray(data.users)) {
                this.currentData.users = data.users;
            } else {
                this.currentData.users = [];
            }

            // Преобразуем products из объекта в массив (если нужно)
            if (data.products && typeof data.products === 'object' && !Array.isArray(data.products)) {
                this.currentData.products = Object.keys(data.products).map(id => ({
                    id: id,
                    name: data.products[id].name,
                    price: data.products[id].price,
                    category: data.products[id].category,
                    description: data.products[id].description || ''
                }));
                console.log('✅ Преобразовано товаров из объекта в массив');
            } else if (Array.isArray(data.products)) {
                this.currentData.products = data.products;
            } else {
                this.currentData.products = [];
            }

            // Заказы (обычно уже массив)
            this.currentData.orders = Array.isArray(data.orders) ? data.orders : [];
            
            // Сообщения
            this.currentData.messages = Array.isArray(data.messages) ? data.messages : [];
            
            // Настройки
            this.currentData.settings = data.settings || {};

            console.log(`✅ Загружено пользователей: ${this.currentData.users.length}`);
            console.log(`✅ Загружено товаров: ${this.currentData.products.length}`);
            console.log(`✅ Загружено заказов: ${this.currentData.orders.length}`);

            return this.currentData;

        } catch (error) {
            console.error('❌ Ошибка загрузки с JSONBin:', error);
            // Если сервер недоступен, создаем пустые массивы
            this.currentData = {
                users: [],
                products: [],
                orders: [],
                messages: [],
                settings: {}
            };
            return this.currentData;
        }
    },

    // Сохранение данных на сервер
    async saveToServer() {
        console.log('💾 Сохранение данных на JSONBin...');

        // Подготавливаем данные для сохранения (конвертируем массивы обратно в объекты)
        const saveData = {
            users: {},
            products: {},
            orders: this.currentData.orders,
            messages: this.currentData.messages,
            settings: this.currentData.settings
        };

        // Конвертируем пользователей в объект
        this.currentData.users.forEach(user => {
            saveData.users[user.email] = {
                name: user.name,
                password: user.password,
                role: user.role,
                registered: user.registered
            };
        });

        // Конвертируем товары в объект
        this.currentData.products.forEach(product => {
            saveData.products[product.id] = {
                name: product.name,
                price: product.price,
                category: product.category,
                description: product.description
            };
        });

        try {
            const response = await fetch(`${this.BASE_URL}/b/${this.BIN_ID}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': this.API_KEY,
                    'X-Bin-Versioning': 'false'
                },
                body: JSON.stringify(saveData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            console.log('✅ Данные сохранены на JSONBin');
            return true;

        } catch (error) {
            console.error('❌ Ошибка сохранения на JSONBin:', error);
            
            if (window.showNotification) {
                window.showNotification('Ошибка соединения с сервером. Данные не сохранены.', 'error');
            }
            
            return false;
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
        const saved = await this.saveToServer();
        
        if (saved) {
            console.log('✅ Пользователь добавлен:', userData.email);
        }
        
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

    // Добавление заказа
    async addOrder(orderData) {
        const newOrder = {
            ...orderData,
            id: Date.now().toString(),
            date: orderData.date || new Date().toISOString(),
            status: 'new'
        };
        
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
        console.log('✅ Заказ добавлен:', newOrder.orderNumber);
        return newOrder;
    },

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
    }
};

// Делаем глобальным
window.DB_MANAGER = DB_MANAGER;
console.log('✅ DB_MANAGER готов (с поддержкой объектного формата)');

// Автоматическая загрузка данных
DB_MANAGER.loadDatabase();
