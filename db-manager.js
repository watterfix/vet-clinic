// ============================================
// МЕНЕДЖЕР БАЗЫ ДАННЫХ (с JSONBin.io)
// ============================================

const DB_MANAGER = {
    // Ваши данные от JSONBin
    BIN_ID: 'ВАШ_BIN_ID', // Например: 63abc123def456789
    API_KEY: 'ВАШ_API_KEY', // Например: $2b$10$abc123def456...
    BASE_URL: 'https://api.jsonbin.io/v3',
    
    currentData: {
        users: [],
        products: [],
        orders: [],
        messages: [],
        settings: {}
    },

    // Загрузка данных с JSONBin
    async loadDatabase() {
        console.log('Загрузка данных с JSONBin...');
        
        try {
            const response = await fetch(`${this.BASE_URL}/b/${this.BIN_ID}/latest`, {
                headers: {
                    'X-Master-Key': this.API_KEY
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.currentData = data.record;
                console.log('✅ Данные загружены с JSONBin');
                
                // Сохраняем локально для офлайн доступа
                this.saveToLocalStorage();
            } else {
                throw new Error('Ошибка загрузки');
            }
        } catch (error) {
            console.warn('⚠️ Не удалось загрузить с JSONBin, используем localStorage');
            this.loadFromLocalStorage();
        }
        
        return this.currentData;
    },

    // Сохранение данных на JSONBin
    async saveToJSONBin() {
        try {
            const response = await fetch(`${this.BASE_URL}/b/${this.BIN_ID}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': this.API_KEY
                },
                body: JSON.stringify(this.currentData)
            });
            
            if (response.ok) {
                console.log('✅ Данные сохранены на JSONBin');
                return true;
            }
        } catch (error) {
            console.error('❌ Ошибка сохранения на JSONBin:', error);
            return false;
        }
    },

    // Сохранение в localStorage (резервная копия)
    saveToLocalStorage() {
        try {
            // Конвертируем пользователей в объект
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
            
            console.log('💾 Данные сохранены в localStorage');
        } catch (error) {
            console.error('❌ Ошибка сохранения в localStorage:', error);
        }
    },

    // Загрузка из localStorage
    loadFromLocalStorage() {
        try {
            const usersObj = JSON.parse(localStorage.getItem('users')) || {};
            this.currentData.users = Object.keys(usersObj).map(email => ({
                id: email,
                email: email,
                ...usersObj[email]
            }));
            
            const productsObj = JSON.parse(localStorage.getItem('products')) || {};
            this.currentData.products = Object.keys(productsObj).map(id => ({
                id: id,
                ...productsObj[id]
            }));
            
            this.currentData.orders = JSON.parse(localStorage.getItem('orders')) || [];
            this.currentData.messages = JSON.parse(localStorage.getItem('messages')) || [];
            this.currentData.settings = JSON.parse(localStorage.getItem('settings')) || {};
            
            console.log('📁 Данные загружены из localStorage');
        } catch (error) {
            console.error('❌ Ошибка загрузки из localStorage:', error);
        }
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
        this.saveToLocalStorage();
        await this.saveToJSONBin(); // Сохраняем на сервер
        
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
        
        this.saveToLocalStorage();
        await this.saveToJSONBin();
        
        return true;
    },

    // Удаление пользователя
    async deleteUser(email) {
        if (email === 'admin@vetclinic.ru') return false;
        
        this.currentData.users = this.currentData.users.filter(u => u.email !== email);
        this.saveToLocalStorage();
        await this.saveToJSONBin();
        
        return true;
    },

    // Добавление товара
    async addProduct(productData) {
        this.currentData.products.push(productData);
        this.saveToLocalStorage();
        await this.saveToJSONBin();
        
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
        
        this.saveToLocalStorage();
        await this.saveToJSONBin();
        
        return true;
    },

    // Удаление товара
    async deleteProduct(id) {
        this.currentData.products = this.currentData.products.filter(p => p.id !== id);
        this.saveToLocalStorage();
        await this.saveToJSONBin();
        
        return true;
    },

    // Добавление заказа
    async addOrder(orderData) {
        const newOrder = {
            ...orderData,
            id: Date.now().toString()
        };
        
        this.currentData.orders.push(newOrder);
        this.saveToLocalStorage();
        await this.saveToJSONBin();
        
        return newOrder;
    },

    // Добавление сообщения
    async addMessage(messageData) {
        const newMessage = {
            ...messageData,
            id: Date.now().toString(),
            date: new Date().toISOString(),
            status: 'new'
        };
        
        this.currentData.messages.push(newMessage);
        this.saveToLocalStorage();
        await this.saveToJSONBin();
        
        return newMessage;
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
    },

    // Сброс данных
    async resetToDefault() {
        this.currentData = {
            users: [
                {
                    id: 'admin@vetclinic.ru',
                    email: 'admin@vetclinic.ru',
                    name: 'Admin',
                    password: 'admin123',
                    role: 'admin',
                    registered: new Date().toISOString()
                }
            ],
            products: [],
            orders: [],
            messages: [],
            settings: {}
        };
        
        this.saveToLocalStorage();
        await this.saveToJSONBin();
        
        return this.currentData;
    }
};

// Автосохранение каждые 5 минут
setInterval(() => {
    DB_MANAGER.saveToJSONBin();
}, 300000);

window.DB_MANAGER = DB_MANAGER;
console.log('✅ DB_MANAGER с JSONBin готов');
