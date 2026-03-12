// ============================================
// МЕНЕДЖЕР БАЗЫ ДАННЫХ (с JSONBin.io)
// ============================================

const DB_MANAGER = {
    // Ваши данные из JSONBin
    BIN_ID: '69b32b80b7ec241ddc6348dd',
    API_KEY: '$2a$10$tBa4S2lF6C0Qua271by8BuxrbzFEdlyz0lYj/oK52ynRQPDFexbC2',
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
        
        try {
            const response = await fetch(`${this.BASE_URL}/b/${this.BIN_ID}/latest`, {
                headers: {
                    'X-Master-Key': this.API_KEY
                },
                cache: 'no-cache' // Важно! Отключаем кэш
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            this.currentData = result.record || result;
            
            // Убеждаемся, что users это массив
            if (!Array.isArray(this.currentData.users)) {
                this.currentData.users = [];
            }
            
            console.log(`✅ Загружено пользователей: ${this.currentData.users.length}`);
            
            // Сохраняем в localStorage для офлайн доступа
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
        if (email === 'admin@vetclinic.ru') return false;
        
        this.currentData.users = this.currentData.users.filter(u => u.email !== email);
        await this.saveToServer();
        return true;
    },

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

    // Добавление заказа
    async addOrder(orderData) {
        const newOrder = {
            ...orderData,
            id: Date.now().toString()
        };
        
        this.currentData.orders.push(newOrder);
        await this.saveToServer();
        return newOrder;
    },

    // Получение статистики
    getStats() {
        return {
            totalUsers: this.currentData.users.length,
            totalProducts: this.currentData.products.length,
            totalOrders: this.currentData.orders.length,
            totalRevenue: this.currentData.orders.reduce((sum, order) => sum + (order.total || 0), 0)
        };
    }
};

window.DB_MANAGER = DB_MANAGER;
console.log('✅ DB_MANAGER готов');

// Автоматическая загрузка данных
DB_MANAGER.loadDatabase();
