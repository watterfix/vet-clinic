// ============================================
// МЕНЕДЖЕР БАЗЫ ДАННЫХ (с JSONBin.io)
// ============================================

// Убираем let, используем const
const DB_MANAGER = {
    BIN_ID: '69b34770c3097a1dd51e35f3',  
    API_KEY: '$2a$10$nh6Q.DQPxUy3JGi6.fEL3e6DOeE02iVHQ1FBZ7N5FeF8sW0atefpK',
    BASE_URL: 'https://api.jsonbin.io/v3',
    
    currentData: {
        users: [],
        products: [],
        orders: [],
        messages: [],
        settings: {}
    },

    // Загрузка данных с сервера
    async loadDatabase() {
        console.log('🔄 Загрузка данных с JSONBin...');
        console.log('Bin ID:', this.BIN_ID);
        
        try {
            const url = `${this.BASE_URL}/b/${this.BIN_ID}/latest`;
            console.log('URL:', url);
            
            const response = await fetch(url, {
                headers: {
                    'X-Master-Key': this.API_KEY
                },
                cache: 'no-cache'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            const rawData = result.record || result;
            
            console.log('📦 Получены данные:', rawData);
            
            // Преобразуем users из объекта в массив
            if (rawData.users && typeof rawData.users === 'object' && !Array.isArray(rawData.users)) {
                this.currentData.users = Object.keys(rawData.users).map(email => ({
                    id: email,
                    email: email,
                    name: rawData.users[email].name,
                    password: rawData.users[email].password,
                    role: rawData.users[email].role,
                    registered: rawData.users[email].registered || new Date().toISOString()
                }));
                console.log('✅ Преобразовано пользователей:', this.currentData.users.length);
            } else if (Array.isArray(rawData.users)) {
                this.currentData.users = rawData.users;
            } else {
                this.currentData.users = [];
            }
            
            // Преобразуем products из объекта в массив
            if (rawData.products && typeof rawData.products === 'object' && !Array.isArray(rawData.products)) {
                this.currentData.products = Object.keys(rawData.products).map(id => ({
                    id: id,
                    name: rawData.products[id].name,
                    price: rawData.products[id].price,
                    category: rawData.products[id].category,
                    description: rawData.products[id].description || ''
                }));
                console.log('✅ Преобразовано товаров:', this.currentData.products.length);
            } else if (Array.isArray(rawData.products)) {
                this.currentData.products = rawData.products;
            } else {
                this.currentData.products = [];
            }
            
            // Заказы
            this.currentData.orders = Array.isArray(rawData.orders) ? rawData.orders : [];
            this.currentData.messages = Array.isArray(rawData.messages) ? rawData.messages : [];
            this.currentData.settings = rawData.settings || {};
            
            console.log(`✅ Загружено пользователей: ${this.currentData.users.length}`);
            if (this.currentData.users.length > 0) {
                console.log('👥 Пользователи:', this.currentData.users.map(u => u.email));
            }
            
            // Сохраняем в localStorage
            this.saveToLocalStorage();
            
            return this.currentData;
            
        } catch (error) {
            console.error('❌ Ошибка загрузки:', error);
            this.loadFromLocalStorage();
            return this.currentData;
        }
    },

    // Сохранение данных на сервер
    async saveToServer() {
        console.log('💾 Сохранение данных...');
        
        try {
            // Преобразуем данные обратно в объектный формат
            const saveData = {
                users: {},
                products: {},
                orders: this.currentData.orders,
                messages: this.currentData.messages,
                settings: this.currentData.settings
            };
            
            this.currentData.users.forEach(user => {
                saveData.users[user.email] = {
                    name: user.name,
                    password: user.password,
                    role: user.role,
                    registered: user.registered
                };
            });
            
            this.currentData.products.forEach(product => {
                saveData.products[product.id] = {
                    name: product.name,
                    price: product.price,
                    category: product.category,
                    description: product.description
                };
            });
            
            const response = await fetch(`${this.BASE_URL}/b/${this.BIN_ID}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': this.API_KEY
                },
                body: JSON.stringify(saveData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            console.log('✅ Данные сохранены');
            this.saveToLocalStorage();
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка сохранения:', error);
            return false;
        }
    },

    // Сохранение в localStorage
    saveToLocalStorage() {
        try {
            localStorage.setItem('db_backup', JSON.stringify(this.currentData));
            
            // Для совместимости со старым кодом
            const usersObj = {};
            const productsObj = {};
            
            this.currentData.users.forEach(user => {
                usersObj[user.email] = {
                    name: user.name,
                    password: user.password,
                    role: user.role,
                    registered: user.registered
                };
            });
            
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
            
            console.log('📁 Данные сохранены в localStorage');
            
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

    // Получение пользователя по email
    getUserByEmail(email) {
        return this.currentData.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    },

    // Проверка существования пользователя
    userExists(email) {
        return this.currentData.users.some(u => u.email.toLowerCase() === email.toLowerCase());
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
        const index = this.currentData.users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
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

    // Добавление заказа
    async addOrder(orderData) {
        const newOrder = {
            ...orderData,
            id: Date.now().toString(),
            date: new Date().toISOString()
        };
        
        this.currentData.orders.push(newOrder);
        await this.saveToServer();
        return newOrder;
    },

    // Удаление заказа
    async deleteOrder(orderId) {
        this.currentData.orders = this.currentData.orders.filter(o => o.id != orderId);
        await this.saveToServer();
        return true;
    },

    // Получение статистики
    getStats() {
        const totalUsers = this.currentData.users.length;
        const totalOrders = this.currentData.orders.length;
        const totalProducts = this.currentData.products.length;
        const totalRevenue = this.currentData.orders.reduce((sum, order) => sum + (order.total || 0), 0);
        const adminCount = this.currentData.users.filter(u => u.role === 'admin').length;
        
        return {
            totalUsers,
            totalOrders,
            totalProducts,
            totalRevenue,
            adminCount,
            userCount: totalUsers - adminCount
        };
    }
};

// Делаем глобальным
window.DB_MANAGER = DB_MANAGER;
console.log('✅ DB_MANAGER готов (с поддержкой объектного формата)');

// Автоматическая загрузка данных
DB_MANAGER.loadDatabase();
