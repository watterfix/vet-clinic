// ============================================
// МЕНЕДЖЕР БАЗЫ ДАННЫХ (с перманентным сохранением)
// ============================================

const DB_MANAGER = {
    // Текущие данные в памяти
    currentData: {
        users: [],
        products: [],
        orders: [],
        messages: [],
        settings: {}
    },

    // Флаг для отслеживания загрузки
    isLoading: false,
    
    // ============================================
    // ЗАГРУЗКА ДАННЫХ
    // ============================================
    
    // Загрузка всех данных с сервера
    async loadAllData() {
        if (this.isLoading) return this.currentData;
        
        this.isLoading = true;
        console.log('Загрузка данных с сервера...');
        
        try {
            // Проверяем доступность API
            const isApiAvailable = await this.checkApiAvailability();
            
            if (isApiAvailable) {
                // Загружаем все данные параллельно
                const [users, products, orders, messages, settings] = await Promise.all([
                    this.loadUsers(),
                    this.loadProducts(),
                    this.loadOrders(),
                    this.loadMessages(),
                    this.loadSettings()
                ]);
                
                this.currentData = {
                    users: users || [],
                    products: products || [],
                    orders: orders || [],
                    messages: messages || [],
                    settings: settings || {}
                };
                
                console.log('Данные успешно загружены с сервера');
            } else {
                console.log('API недоступен, загружаем из localStorage');
                this.loadFromLocalStorage();
            }
            
            // Синхронизируем с localStorage
            this.syncToLocalStorage();
            
            // Показываем статистику
            this.logStats();
            
            this.isLoading = false;
            return this.currentData;
            
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            this.loadFromLocalStorage();
            this.isLoading = false;
            return this.currentData;
        }
    },
    
    // Проверка доступности API
    async checkApiAvailability() {
        try {
            const response = await fetch('http://localhost:3000', {
                method: 'HEAD',
                mode: 'no-cors'
            });
            return true;
        } catch (error) {
            console.warn('API сервер недоступен');
            return false;
        }
    },
    
    // Загрузка пользователей
    async loadUsers() {
        try {
            const response = await fetch('http://localhost:3000/users');
            if (response.ok) {
                return await response.json();
            }
            throw new Error('Failed to load users');
        } catch (error) {
            console.error('Ошибка загрузки пользователей:', error);
            return null;
        }
    },
    
    // Загрузка товаров
    async loadProducts() {
        try {
            const response = await fetch('http://localhost:3000/products');
            if (response.ok) {
                return await response.json();
            }
            throw new Error('Failed to load products');
        } catch (error) {
            console.error('Ошибка загрузки товаров:', error);
            return null;
        }
    },
    
    // Загрузка заказов
    async loadOrders() {
        try {
            const response = await fetch('http://localhost:3000/orders');
            if (response.ok) {
                return await response.json();
            }
            throw new Error('Failed to load orders');
        } catch (error) {
            console.error('Ошибка загрузки заказов:', error);
            return null;
        }
    },
    
    // Загрузка сообщений
    async loadMessages() {
        try {
            const response = await fetch('http://localhost:3000/messages');
            if (response.ok) {
                return await response.json();
            }
            throw new Error('Failed to load messages');
        } catch (error) {
            console.error('Ошибка загрузки сообщений:', error);
            return null;
        }
    },
    
    // Загрузка настроек
    async loadSettings() {
        try {
            const response = await fetch('http://localhost:3000/settings');
            if (response.ok) {
                const settings = await response.json();
                return settings[0] || {};
            }
            throw new Error('Failed to load settings');
        } catch (error) {
            console.error('Ошибка загрузки настроек:', error);
            return {};
        }
    },
    
    // Загрузка из localStorage (резервный вариант)
    loadFromLocalStorage() {
        console.log('Загрузка данных из localStorage...');
        
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
            
            // Загружаем сообщения
            this.currentData.messages = JSON.parse(localStorage.getItem('messages')) || [];
            
            // Загружаем настройки
            this.currentData.settings = JSON.parse(localStorage.getItem('settings')) || {};
            
            console.log('Данные загружены из localStorage');
        } catch (error) {
            console.error('Ошибка загрузки из localStorage:', error);
        }
    },
    
    // Синхронизация с localStorage
    syncToLocalStorage() {
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
            
            // Сохраняем в localStorage
            localStorage.setItem('users', JSON.stringify(usersObj));
            localStorage.setItem('products', JSON.stringify(productsObj));
            localStorage.setItem('orders', JSON.stringify(this.currentData.orders));
            localStorage.setItem('messages', JSON.stringify(this.currentData.messages));
            localStorage.setItem('settings', JSON.stringify(this.currentData.settings));
            
            // Создаем резервную копию
            this.createBackup();
            
            console.log('Данные синхронизированы с localStorage');
        } catch (error) {
            console.error('Ошибка синхронизации с localStorage:', error);
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
        console.log('Добавление пользователя:', userData.email);
        
        const newUser = {
            ...userData,
            registered: new Date().toISOString()
        };
        
        try {
            // Пытаемся сохранить на сервер
            const response = await fetch('http://localhost:3000/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newUser)
            });
            
            if (response.ok) {
                const savedUser = await response.json();
                this.currentData.users.push(savedUser);
                console.log('Пользователь сохранен на сервере');
            } else {
                throw new Error('Server error');
            }
        } catch (error) {
            console.warn('Сервер недоступен, сохраняем в localStorage');
            
            // Сохраняем в localStorage
            let users = JSON.parse(localStorage.getItem('users')) || {};
            users[userData.email] = {
                name: userData.name,
                password: userData.password,
                role: userData.role || 'user',
                registered: newUser.registered
            };
            localStorage.setItem('users', JSON.stringify(users));
            
            // Обновляем текущие данные
            this.currentData.users.push({
                id: userData.email,
                email: userData.email,
                ...newUser
            });
        }
        
        // Синхронизируем и создаем бэкап
        this.syncToLocalStorage();
        
        return newUser;
    },
    
    // Обновление пользователя
    async updateUser(email, userData) {
        console.log('Обновление пользователя:', email);
        
        const user = this.getUserByEmail(email);
        if (!user) return false;
        
        const updatedUser = { ...user, ...userData };
        
        try {
            // Пытаемся обновить на сервере
            const response = await fetch(`http://localhost:3000/users/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedUser)
            });
            
            if (response.ok) {
                const index = this.currentData.users.findIndex(u => u.email === email);
                this.currentData.users[index] = updatedUser;
                console.log('Пользователь обновлен на сервере');
            } else {
                throw new Error('Server error');
            }
        } catch (error) {
            console.warn('Сервер недоступен, обновляем в localStorage');
            
            // Обновляем в localStorage
            let users = JSON.parse(localStorage.getItem('users')) || {};
            if (users[email]) {
                users[email] = { ...users[email], ...userData };
                localStorage.setItem('users', JSON.stringify(users));
                
                const index = this.currentData.users.findIndex(u => u.email === email);
                this.currentData.users[index] = updatedUser;
            }
        }
        
        this.syncToLocalStorage();
        return true;
    },
    
    // Удаление пользователя
    async deleteUser(email) {
        if (email === 'admin@vetclinic.ru') {
            console.warn('Попытка удалить главного администратора');
            return false;
        }
        
        console.log('Удаление пользователя:', email);
        
        const user = this.getUserByEmail(email);
        if (!user) return false;
        
        try {
            // Пытаемся удалить с сервера
            const response = await fetch(`http://localhost:3000/users/${user.id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                this.currentData.users = this.currentData.users.filter(u => u.email !== email);
                console.log('Пользователь удален с сервера');
            } else {
                throw new Error('Server error');
            }
        } catch (error) {
            console.warn('Сервер недоступен, удаляем из localStorage');
            
            // Удаляем из localStorage
            let users = JSON.parse(localStorage.getItem('users')) || {};
            if (users[email]) {
                delete users[email];
                localStorage.setItem('users', JSON.stringify(users));
                
                this.currentData.users = this.currentData.users.filter(u => u.email !== email);
            }
        }
        
        this.syncToLocalStorage();
        return true;
    },
    
    // ============================================
    // РАБОТА С ТОВАРАМИ
    // ============================================
    
    // Добавление товара
    async addProduct(productData) {
        console.log('Добавление товара:', productData.id);
        
        try {
            // Пытаемся сохранить на сервер
            const response = await fetch('http://localhost:3000/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(productData)
            });
            
            if (response.ok) {
                const savedProduct = await response.json();
                this.currentData.products.push(savedProduct);
                console.log('Товар сохранен на сервере');
            } else {
                throw new Error('Server error');
            }
        } catch (error) {
            console.warn('Сервер недоступен, сохраняем в localStorage');
            
            // Сохраняем в localStorage
            let products = JSON.parse(localStorage.getItem('products')) || {};
            products[productData.id] = productData;
            localStorage.setItem('products', JSON.stringify(products));
            
            // Обновляем текущие данные
            this.currentData.products.push(productData);
        }
        
        this.syncToLocalStorage();
        return productData;
    },
    
    // Обновление товара
    async updateProduct(id, productData) {
        console.log('Обновление товара:', id);
        
        const product = this.currentData.products.find(p => p.id === id);
        if (!product) return false;
        
        try {
            // Пытаемся обновить на сервере
            const response = await fetch(`http://localhost:3000/products/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ...product, ...productData })
            });
            
            if (response.ok) {
                const index = this.currentData.products.findIndex(p => p.id === id);
                this.currentData.products[index] = { ...product, ...productData };
                console.log('Товар обновлен на сервере');
            } else {
                throw new Error('Server error');
            }
        } catch (error) {
            console.warn('Сервер недоступен, обновляем в localStorage');
            
            // Обновляем в localStorage
            let products = JSON.parse(localStorage.getItem('products')) || {};
            if (products[id]) {
                products[id] = { ...products[id], ...productData };
                localStorage.setItem('products', JSON.stringify(products));
                
                const index = this.currentData.products.findIndex(p => p.id === id);
                this.currentData.products[index] = { ...product, ...productData };
            }
        }
        
        this.syncToLocalStorage();
        return true;
    },
    
    // Удаление товара
    async deleteProduct(id) {
        console.log('Удаление товара:', id);
        
        try {
            // Пытаемся удалить с сервера
            const response = await fetch(`http://localhost:3000/products/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                this.currentData.products = this.currentData.products.filter(p => p.id !== id);
                console.log('Товар удален с сервера');
            } else {
                throw new Error('Server error');
            }
        } catch (error) {
            console.warn('Сервер недоступен, удаляем из localStorage');
            
            // Удаляем из localStorage
            let products = JSON.parse(localStorage.getItem('products')) || {};
            if (products[id]) {
                delete products[id];
                localStorage.setItem('products', JSON.stringify(products));
                
                this.currentData.products = this.currentData.products.filter(p => p.id !== id);
            }
        }
        
        this.syncToLocalStorage();
        return true;
    },
    
    // ============================================
    // РАБОТА С ЗАКАЗАМИ
    // ============================================
    
    // Добавление заказа
    async addOrder(orderData) {
        console.log('Добавление заказа');
        
        const newOrder = {
            ...orderData,
            id: Date.now().toString()
        };
        
        try {
            // Пытаемся сохранить на сервер
            const response = await fetch('http://localhost:3000/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newOrder)
            });
            
            if (response.ok) {
                const savedOrder = await response.json();
                this.currentData.orders.push(savedOrder);
                console.log('Заказ сохранен на сервере');
            } else {
                throw new Error('Server error');
            }
        } catch (error) {
            console.warn('Сервер недоступен, сохраняем в localStorage');
            
            // Сохраняем в localStorage
            let orders = JSON.parse(localStorage.getItem('orders')) || [];
            orders.push(newOrder);
            localStorage.setItem('orders', JSON.stringify(orders));
            
            this.currentData.orders.push(newOrder);
        }
        
        this.syncToLocalStorage();
        return newOrder;
    },
    
    // Удаление заказа
    async deleteOrder(orderId) {
        console.log('Удаление заказа:', orderId);
        
        try {
            // Пытаемся удалить с сервера
            const response = await fetch(`http://localhost:3000/orders/${orderId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                this.currentData.orders = this.currentData.orders.filter(o => o.id !== orderId);
                console.log('Заказ удален с сервера');
            } else {
                throw new Error('Server error');
            }
        } catch (error) {
            console.warn('Сервер недоступен, удаляем из localStorage');
            
            // Удаляем из localStorage
            let orders = JSON.parse(localStorage.getItem('orders')) || [];
            orders = orders.filter(o => o.id !== orderId);
            localStorage.setItem('orders', JSON.stringify(orders));
            
            this.currentData.orders = this.currentData.orders.filter(o => o.id !== orderId);
        }
        
        this.syncToLocalStorage();
        return true;
    },
    
    // ============================================
    // РАБОТА С СООБЩЕНИЯМИ
    // ============================================
    
    // Добавление сообщения
    async addMessage(messageData) {
        console.log('Добавление сообщения');
        
        const newMessage = {
            ...messageData,
            id: Date.now().toString(),
            date: new Date().toISOString(),
            status: 'new'
        };
        
        try {
            // Пытаемся сохранить на сервер
            const response = await fetch('http://localhost:3000/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newMessage)
            });
            
            if (response.ok) {
                const savedMessage = await response.json();
                this.currentData.messages.push(savedMessage);
                console.log('Сообщение сохранено на сервере');
            } else {
                throw new Error('Server error');
            }
        } catch (error) {
            console.warn('Сервер недоступен, сохраняем в localStorage');
            
            // Сохраняем в localStorage
            let messages = JSON.parse(localStorage.getItem('messages')) || [];
            messages.push(newMessage);
            localStorage.setItem('messages', JSON.stringify(messages));
            
            this.currentData.messages.push(newMessage);
        }
        
        this.syncToLocalStorage();
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
        
        const today = new Date().toDateString();
        const todayOrders = this.currentData.orders.filter(o => new Date(o.date).toDateString() === today).length;
        const todayMessages = this.currentData.messages.filter(m => new Date(m.date).toDateString() === today).length;
        
        // Статистика по категориям товаров
        const productsByCategory = {};
        this.currentData.products.forEach(p => {
            productsByCategory[p.category] = (productsByCategory[p.category] || 0) + 1;
        });
        
        // Последние заказы
        const recentOrders = [...this.currentData.orders]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);
        
        return {
            totalUsers,
            totalOrders,
            totalProducts,
            totalMessages,
            totalRevenue,
            adminCount,
            userCount: totalUsers - adminCount,
            todayOrders,
            todayMessages,
            averageOrderValue: totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0,
            productsByCategory,
            recentOrders
        };
    },
    
    // Логирование статистики
    logStats() {
        const stats = this.getStats();
        console.log('=== СТАТИСТИКА БД ===');
        console.log(`👥 Пользователей: ${stats.totalUsers} (👑 ${stats.adminCount} админов)`);
        console.log(`📦 Товаров: ${stats.totalProducts}`);
        console.log(`📋 Заказов: ${stats.totalOrders} (сегодня: ${stats.todayOrders})`);
        console.log(`💬 Сообщений: ${stats.totalMessages} (сегодня: ${stats.todayMessages})`);
        console.log(`💰 Выручка: ${stats.totalRevenue} ₽`);
        console.log('=====================');
    },
    
    // ============================================
    // РЕЗЕРВНОЕ КОПИРОВАНИЕ
    // ============================================
    
    // Создание резервной копии
    createBackup() {
        const backup = {
            id: Date.now(),
            date: new Date().toISOString(),
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
        
        // Создаем файл для скачивания (опционально)
        this.downloadBackup(backup);
        
        return backup;
    },
    
    // Скачивание бэкапа
    downloadBackup(backup) {
        const dataStr = JSON.stringify(backup, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `backup-${new Date().toISOString().slice(0,10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    },
    
    // Восстановление из бэкапа
    restoreFromBackup(backupData) {
        try {
            if (backupData.data) {
                this.currentData = backupData.data;
            } else {
                // Старый формат бэкапа
                this.currentData = backupData;
            }
            
            this.syncToLocalStorage();
            console.log('Данные восстановлены из бэкапа');
            return true;
        } catch (error) {
            console.error('Ошибка восстановления из бэкапа:', error);
            return false;
        }
    },
    
    // ============================================
    // СБРОС ДАННЫХ
    // ============================================
    
    // Сброс до начальных данных
    async resetToDefault() {
        console.log('Сброс базы данных до начального состояния');
        
        const defaultUsers = [
            {
                id: 'admin@vetclinic.ru',
                email: 'admin@vetclinic.ru',
                name: 'Admin',
                password: 'admin123',
                role: 'admin',
                registered: new Date().toISOString()
            },
            {
                id: 'user@example.com',
                email: 'user@example.com',
                name: 'Иван Петров',
                password: 'user123',
                role: 'user',
                registered: new Date().toISOString()
            }
        ];
        
        const defaultProducts = [
            {
                id: 'food1',
                name: 'Royal Canin (для кошек)',
                price: 1200,
                category: 'food',
                description: 'Премиум корм для кошек'
            },
            {
                id: 'food2',
                name: 'Royal Canin (для собак)',
                price: 1300,
                category: 'food',
                description: 'Премиум корм для собак'
            },
            {
                id: 'med1',
                name: 'Антибиотики',
                price: 500,
                category: 'medicine',
                description: 'По назначению врача'
            },
            {
                id: 'acc1',
                name: 'Ошейники',
                price: 350,
                category: 'accessories',
                description: 'Регулируемые'
            },
            {
                id: 'hyg1',
                name: 'Шампуни',
                price: 450,
                category: 'hygiene',
                description: 'Для разных типов шерсти'
            }
        ];
        
        this.currentData = {
            users: defaultUsers,
            products: defaultProducts,
            orders: [],
            messages: [],
            settings: {}
        };
        
        // Синхронизируем с localStorage
        this.syncToLocalStorage();
        
        // Пытаемся синхронизировать с сервером
        try {
            // Очищаем сервер
            await fetch('http://localhost:3000/users', { method: 'DELETE' });
            await fetch('http://localhost:3000/products', { method: 'DELETE' });
            await fetch('http://localhost:3000/orders', { method: 'DELETE' });
            await fetch('http://localhost:3000/messages', { method: 'DELETE' });
            
            // Загружаем начальные данные
            for (const user of defaultUsers) {
                await fetch('http://localhost:3000/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(user)
                });
            }
            
            for (const product of defaultProducts) {
                await fetch('http://localhost:3000/products', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(product)
                });
            }
            
            console.log('Сервер синхронизирован');
        } catch (error) {
            console.warn('Не удалось синхронизировать с сервером');
        }
        
        // Создаем бэкап
        this.createBackup();
        
        console.log('База данных сброшена до начального состояния');
        this.logStats();
    }
};

// ============================================
// АВТОМАТИЧЕСКОЕ СОХРАНЕНИЕ
// ============================================

// Автосохранение каждую минуту
setInterval(() => {
    if (DB_MANAGER.currentData) {
        DB_MANAGER.syncToLocalStorage();
        console.log('Автосохранение выполнено в', new Date().toLocaleTimeString());
    }
}, 60000);

// Сохранение перед закрытием страницы
window.addEventListener('beforeunload', () => {
    DB_MANAGER.syncToLocalStorage();
    DB_MANAGER.createBackup();
});

// ============================================
// ЭКСПОРТ
// ============================================

// Делаем DB_MANAGER глобальным
window.DB_MANAGER = DB_MANAGER;

console.log('✅ DB_MANAGER загружен и готов к работе');
