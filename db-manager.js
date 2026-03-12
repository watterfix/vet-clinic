// ============================================
// МЕНЕДЖЕР БАЗЫ ДАННЫХ (исправленная версия)
// ============================================

const DB_MANAGER = {
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

    async loadDatabase() {
        console.log('🔄 Загрузка данных с JSONBin...');
        
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
            console.log('✅ Данные получены:', result);
            
            // Важно! Проверяем структуру данных
            if (result.record) {
                this.currentData = result.record;
            } else {
                this.currentData = result;
            }
            
            // Убеждаемся, что users это массив
            if (!Array.isArray(this.currentData.users)) {
                console.log('⚠️ users не массив, создаем пустой массив');
                this.currentData.users = [];
            }
            
            console.log(`👥 Загружено пользователей: ${this.currentData.users.length}`);
            if (this.currentData.users.length > 0) {
                console.log('   Список:', this.currentData.users.map(u => u.email));
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

    saveToLocalStorage() {
        try {
            // Сохраняем в формате для совместимости
            const usersObj = {};
            this.currentData.users.forEach(user => {
                usersObj[user.email] = {
                    name: user.name,
                    password: user.password,
                    role: user.role,
                    registered: user.registered
                };
            });
            
            localStorage.setItem('users', JSON.stringify(usersObj));
            localStorage.setItem('products', JSON.stringify(this.currentData.products));
            localStorage.setItem('orders', JSON.stringify(this.currentData.orders));
            
        } catch (error) {
            console.error('Ошибка сохранения в localStorage:', error);
        }
    },

    loadFromLocalStorage() {
        try {
            const usersObj = JSON.parse(localStorage.getItem('users')) || {};
            this.currentData.users = Object.keys(usersObj).map(email => ({
                id: email,
                email: email,
                ...usersObj[email]
            }));
            
            this.currentData.products = JSON.parse(localStorage.getItem('products')) || [];
            this.currentData.orders = JSON.parse(localStorage.getItem('orders')) || [];
            
        } catch (error) {
            console.error('Ошибка загрузки из localStorage:', error);
        }
    },

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

    getUserByEmail(email) {
        return this.currentData.users.find(u => u.email === email);
    },

    userExists(email) {
        return this.currentData.users.some(u => u.email === email);
    },

    getStats() {
        return {
            totalUsers: this.currentData.users.length,
            totalProducts: this.currentData.products.length,
            totalOrders: this.currentData.orders.length
        };
    }
};

window.DB_MANAGER = DB_MANAGER;

// Загружаем данные сразу
DB_MANAGER.loadDatabase();

console.log('✅ DB_MANAGER загружен');
