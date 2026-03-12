// ============================================
// МЕНЕДЖЕР БАЗЫ ДАННЫХ (без автоскачивания)
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
    
    // Загрузка всех данных
    async loadDatabase() {
        return await this.loadAllData();
    },
    
    async loadAllData() {
        if (this.isLoading) return this.currentData;
        
        this.isLoading = true;
        console.log('Загрузка данных...');
        
        try {
            // Загружаем из localStorage
            this.loadFromLocalStorage();
            
            // Пытаемся загрузить с сервера, если доступен
            await this.tryLoadFromServer();
            
            this.isLoading = false;
            return this.currentData;
            
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            this.loadFromLocalStorage();
            this.isLoading = false;
            return this.currentData;
        }
    },
    
    // Загрузка из localStorage
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
    
    // Попытка загрузки с сервера
    async tryLoadFromServer() {
        try {
            const response = await fetch('http://localhost:3000');
            if (!response.ok) return;
            
            console.log('Сервер доступен, синхронизация...');
            
            // Здесь можно добавить синхронизацию с сервером
            // Но пока оставляем только localStorage
            
        } catch (error) {
            console.log('Сервер недоступен, работаем в офлайн режиме');
        }
    },
    
    // Сохранение в localStorage
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
            
            // Сохраняем в localStorage
            localStorage.setItem('users', JSON.stringify(usersObj));
            localStorage.setItem('products', JSON.stringify(productsObj));
            localStorage.setItem('orders', JSON.stringify(this.currentData.orders));
            localStorage.setItem('messages', JSON.stringify(this.currentData.messages));
            localStorage.setItem('settings', JSON.stringify(this.currentData.settings));
            
            console.log('Данные сохранены в localStorage');
        } catch (error) {
            console.error('Ошибка сохранения в localStorage:', error);
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
    addUser(userData) {
        console.log('Добавление пользователя:', userData.email);
        
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
        
        // Сохраняем в localStorage
        this.saveToLocalStorage();
        
        return newUser;
    },
    
    // Обновление пользователя
    updateUser(email, userData) {
        console.log('Обновление пользователя:', email);
        
        const index = this.currentData.users.findIndex(u => u.email === email);
        if (index === -1) return false;
        
        this.currentData.users[index] = {
            ...this.currentData.users[index],
            ...userData
        };
        
        this.saveToLocalStorage();
        return true;
    },
    
    // Удаление пользователя
    deleteUser(email) {
        if (email === 'admin@vetclinic.ru') {
            console.warn('Нельзя удалить главного администратора');
            return false;
        }
        
        console.log('Удаление пользователя:', email);
        
        this.currentData.users = this.currentData.users.filter(u => u.email !== email);
        this.saveToLocalStorage();
        
        return true;
    },
    
    // ============================================
    // РАБОТА С ТОВАРАМИ
    // ============================================
    
    // Добавление товара
    addProduct(productData) {
        console.log('Добавление товара:', productData.id);
        
        this.currentData.products.push(productData);
        this.saveToLocalStorage();
        
        return productData;
    },
    
    // Обновление товара
    updateProduct(id, productData) {
        console.log('Обновление товара:', id);
        
        const index = this.currentData.products.findIndex(p => p.id === id);
        if (index === -1) return false;
        
        this.currentData.products[index] = {
            ...this.currentData.products[index],
            ...productData
        };
        
        this.saveToLocalStorage();
        return true;
    },
    
    // Удаление товара
    deleteProduct(id) {
        console.log('Удаление товара:', id);
        
        this.currentData.products = this.currentData.products.filter(p => p.id !== id);
        this.saveToLocalStorage();
        
        return true;
    },
    
    // ============================================
    // РАБОТА С ЗАКАЗАМИ
    // ============================================
    
    // Добавление заказа
    addOrder(orderData) {
        console.log('Добавление заказа');
        
        const newOrder = {
            ...orderData,
            id: Date.now().toString()
        };
        
        this.currentData.orders.push(newOrder);
        this.saveToLocalStorage();
        
        return newOrder;
    },
    
    // Удаление заказа
    deleteOrder(orderId) {
        console.log('Удаление заказа:', orderId);
        
        this.currentData.orders = this.currentData.orders.filter(o => o.id !== orderId);
        this.saveToLocalStorage();
        
        return true;
    },
    
    // ============================================
    // РАБОТА С СООБЩЕНИЯМИ
    // ============================================
    
    // Добавление сообщения
    addMessage(messageData) {
        console.log('Добавление сообщения');
        
        const newMessage = {
            ...messageData,
            id: Date.now().toString(),
            date: new Date().toISOString(),
            status: 'new'
        };
        
        this.currentData.messages.push(newMessage);
        this.saveToLocalStorage();
        
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
            productsByCategory
        };
    },
    
    // Логирование статистики
    logStats() {
        const stats = this.getStats();
        console.log('=== СТАТИСТИКА БД ===');
        console.log('Пользователей:', stats.totalUsers);
        console.log('Товаров:', stats.totalProducts);
        console.log('Заказов:', stats.totalOrders);
        console.log('Выручка:', stats.totalRevenue, '₽');
        console.log('====================');
    },
    
    // ============================================
    // РЕЗЕРВНОЕ КОПИРОВАНИЕ (только по запросу)
    // ============================================
    
    // Создание резервной копии (только в localStorage)
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
        console.log('Резервная копия создана в localStorage');
        
        return backup;
    },
    
    // Скачивание бэкапа (только по кнопке)
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
                this.currentData = backupData;
            }
            
            this.saveToLocalStorage();
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
    resetToDefault() {
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
                id: 'food3',
                name: 'Hill\'s (лечебный)',
                price: 1500,
                category: 'food',
                description: 'Для животных с проблемами ЖКТ'
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
        
        // Сохраняем в localStorage
        this.saveToLocalStorage();
        
        // Создаем бэкап
        this.createBackup();
        
        console.log('База данных сброшена до начального состояния');
        
        return this.currentData;
    }
};

// ============================================
// АВТОМАТИЧЕСКОЕ СОХРАНЕНИЕ
// ============================================

// Автосохранение каждую минуту
setInterval(() => {
    if (DB_MANAGER.currentData) {
        DB_MANAGER.saveToLocalStorage();
        console.log('Автосохранение выполнено в', new Date().toLocaleTimeString());
    }
}, 60000);

// Сохранение перед закрытием страницы
window.addEventListener('beforeunload', () => {
    DB_MANAGER.saveToLocalStorage();
});

// ============================================
// ЭКСПОРТ
// ============================================

// Делаем DB_MANAGER глобальным
window.DB_MANAGER = DB_MANAGER;

console.log('DB_MANAGER загружен и готов к работе');
