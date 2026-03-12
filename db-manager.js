// ============================================
// МЕНЕДЖЕР БАЗЫ ДАННЫХ (с JSONBin.io)
// ============================================

const DB_MANAGER = {
    // ВАШИ ДАННЫЕ (проверьте, что они правильные)
    BIN_ID: '69b32dabc3097a1dd51df4a5',
    API_KEY: '$2a$10$tBa4S2lF6C0Qua271by8BuxrbzFEdlyz0lYj/oK52ynRQPDFexbC2',
    BASE_URL: 'https://api.jsonbin.io/v3',
    
    // Текущие данные в памяти
    currentData: {
        users: [],
        products: [],
        orders: [],
        messages: [],
        settings: {}
    },

    // Флаг загрузки
    isLoading: false,

    // ============================================
    // ОСНОВНЫЕ МЕТОДЫ
    // ============================================

    // Загрузка данных с сервера
    async loadDatabase() {
        console.log('🔄 Загрузка данных с JSONBin...');
        console.log('Bin ID:', this.BIN_ID);
        
        try {
            const response = await fetch(`${this.BASE_URL}/b/${this.BIN_ID}/latest`, {
                headers: {
                    'X-Master-Key': this.API_KEY
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('✅ Данные получены с сервера:', result);
            
            // Сохраняем в память
            this.currentData = result.record;
            
            // Обновляем localStorage для офлайн доступа
            this.saveToLocalStorage();
            
            console.log('📊 Статистика:');
            console.log(`   Пользователей: ${this.currentData.users.length}`);
            console.log(`   Товаров: ${this.currentData.products.length}`);
            console.log(`   Заказов: ${this.currentData.orders.length}`);
            
            return this.currentData;
            
        } catch (error) {
            console.error('❌ Ошибка загрузки с сервера:', error);
            
            // Пробуем загрузить из localStorage
            this.loadFromLocalStorage();
            
            return this.currentData;
        }
    },

    // Сохранение данных на сервер
    async saveToServer() {
        console.log('💾 Сохранение данных на JSONBin...');
        
        try {
            const response = await fetch(`${this.BASE_URL}/b/${this.BIN_ID}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': this.API_KEY
                },
                body: JSON.stringify(this.currentData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('✅ Данные сохранены на сервере');
            
            // Обновляем localStorage
            this.saveToLocalStorage();
            
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка сохранения на сервер:', error);
            return false;
        }
    },

    // ============================================
    // РАБОТА С LOCALSTORAGE
    // ============================================

    // Сохранение в localStorage
    saveToLocalStorage() {
        try {
            // Конвертируем пользователей в объект для совместимости
            const usersObj = {};
            this.currentData.users.forEach(user => {
                usersObj[user.email] = {
                    name: user.name,
                    password: user.password,
                    role: user.role,
                    registered: user.registered
                };
            });
            
            // Конвертируем товары в объект
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
            localStorage.setItem('settings', JSON.stringify(this.currentData.settings));
            
            console.log('📁 Данные сохранены в localStorage');
        } catch (error) {
            console.error('❌ Ошибка сохранения в localStorage:', error);
        }
    },

    // Загрузка из localStorage
    loadFromLocalStorage() {
        console.log('📁 Загрузка данных из localStorage...');
        
        try {
            // Загружаем пользователей
            const usersObj = JSON.parse(localStorage.getItem('users')) || {};
            this.currentData.users = Object.keys(usersObj).map(email => ({
                id: email,
                email: email,
                ...usersObj[email]
            }));
            
            // Загружаем товары
            const productsObj = JSON.parse(localStorage.getItem('products')) || {};
            this.currentData.products = Object.keys(productsObj).map(id => ({
                id: id,
                ...productsObj[id]
            }));
            
            // Загружаем заказы
            this.currentData.orders = JSON.parse(localStorage.getItem('orders')) || [];
            this.currentData.messages = JSON.parse(localStorage.getItem('messages')) || [];
            this.currentData.settings = JSON.parse(localStorage.getItem('settings')) || {};
            
            console.log('✅ Данные загружены из localStorage');
            
        } catch (error) {
            console.error('❌ Ошибка загрузки из localStorage:', error);
        }
    },

    // ============================================
    // РАБОТА С ПОЛЬЗОВАТЕЛЯМИ
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
        console.log('➕ Добавление пользователя:', userData.email);
        
        const newUser = {
            id: userData.email,
            email: userData.email,
            name: userData.name,
            password: userData.password,
            role: userData.role || 'user',
            registered: new Date().toISOString()
        };
        
        // Добавляем в массив
        this.currentData.users.push(newUser);
        
        // Сохраняем на сервер (все увидят)
        await this.saveToServer();
        
        console.log('✅ Пользователь добавлен и сохранен на сервере');
        
        return newUser;
    },

    // Обновление пользователя
    async updateUser(email, userData) {
        console.log('✏️ Обновление пользователя:', email);
        
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
            console.warn('⚠️ Нельзя удалить главного администратора');
            return false;
        }
        
        console.log('🗑️ Удаление пользователя:', email);
        
        this.currentData.users = this.currentData.users.filter(u => u.email !== email);
        await this.saveToServer();
        
        return true;
    },

    // ============================================
    // РАБОТА С ТОВАРАМИ
    // ============================================

    // Добавление товара
    async addProduct(productData) {
        console.log('➕ Добавление товара:', productData.id);
        
        this.currentData.products.push(productData);
        await this.saveToServer();
        
        return productData;
    },

    // Обновление товара
    async updateProduct(id, productData) {
        console.log('✏️ Обновление товара:', id);
        
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
        console.log('🗑️ Удаление товара:', id);
        
        this.currentData.products = this.currentData.products.filter(p => p.id !== id);
        await this.saveToServer();
        
        return true;
    },

    // ============================================
    // РАБОТА С ЗАКАЗАМИ
    // ============================================

    // Добавление заказа
    async addOrder(orderData) {
        console.log('➕ Добавление заказа');
        
        const newOrder = {
            ...orderData,
            id: Date.now().toString()
        };
        
        this.currentData.orders.push(newOrder);
        await this.saveToServer();
        
        return newOrder;
    },

    // Удаление заказа
    async deleteOrder(orderId) {
        console.log('🗑️ Удаление заказа:', orderId);
        
        this.currentData.orders = this.currentData.orders.filter(o => o.id !== orderId);
        await this.saveToServer();
        
        return true;
    },

    // ============================================
    // РАБОТА С СООБЩЕНИЯМИ
    // ============================================

    // Добавление сообщения
    async addMessage(messageData) {
        console.log('➕ Добавление сообщения');
        
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

    // ============================================
    // СТАТИСТИКА
    // ============================================

    // Получение статистики
    getStats() {
        const totalUsers = this.currentData.users.length;
        const totalOrders = this.currentData.orders.length;
        const totalProducts = this.currentData.products.length;
        const totalMessages = this.currentData.messages.length;
        
        const totalRevenue = this.currentData.orders.reduce((sum, order) => sum + (order.total || 0), 0);
        const adminCount = this.currentData.users.filter(u => u.role === 'admin').length;
        
        return {
            totalUsers,
            totalOrders,
            totalProducts,
            totalMessages,
            totalRevenue,
            adminCount,
            userCount: totalUsers - adminCount
        };
    },

    // ============================================
    // ИНИЦИАЛИЗАЦИЯ
    // ============================================

    // Автоматическая загрузка при создании
    async init() {
        await this.loadDatabase();
        
        // Запускаем периодическую синхронизацию (каждые 30 секунд)
        setInterval(async () => {
            console.log('🔄 Периодическая синхронизация...');
            await this.loadDatabase();
        }, 30000);
        
        return this;
    }
};

// Делаем глобальным
window.DB_MANAGER = DB_MANAGER;

// Автоматически запускаем
DB_MANAGER.init();

console.log('✅ DB_MANAGER с JSONBin готов');
