// ============================================
// МЕНЕДЖЕР БАЗЫ ДАННЫХ (Supabase)
// ============================================

// ВСТАВЬТЕ СВОИ ДАННЫЕ ИЗ SUPABASE
const SUPABASE_URL = 'https://ehksdceuihjnzbqdztog.supabase.co';
const SUPABASE_KEY = 'sb_publishable_K1dDdxBKQ_04yOqwkfCxsw_JyiHlkxW';

const DB_MANAGER = {
    supabase: null,
    isInitialized: false,
    initPromise: null,
    initError: null,
    
    currentData: {
        users: [],
        products: [],
        orders: [],
        messages: []
    },

    // Инициализация
    async init() {
        if (this.initPromise) return this.initPromise;
        
        this.initPromise = new Promise(async (resolve) => {
            console.log('🔄 Инициализация Supabase...');
            
            try {
                // Проверяем наличие Supabase SDK
                if (typeof supabase === 'undefined') {
                    console.error('❌ Supabase SDK не загружен!');
                    this.initError = 'Supabase SDK не загружен';
                    resolve(false);
                    return;
                }
                
                // Создаем клиент Supabase
                this.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
                console.log('✅ Supabase клиент создан');
                
                // Проверяем подключение
                const { error } = await this.supabase.from('users').select('count', { count: 'exact', head: true });
                
                if (error) {
                    console.error('❌ Ошибка подключения к Supabase:', error);
                    this.initError = error.message;
                    resolve(false);
                    return;
                }
                
                // Загружаем данные
                await this.loadDatabase();
                
                this.isInitialized = true;
                console.log('✅ DB_MANAGER инициализирован');
                resolve(true);
                
            } catch (error) {
                console.error('❌ Ошибка инициализации Supabase:', error);
                this.initError = error.message;
                this.isInitialized = false;
                resolve(false);
            }
        });
        
        return this.initPromise;
    },

    // Загрузка всех данных
    async loadDatabase() {
        console.log('📦 Загрузка данных из Supabase...');
        
        if (!this.supabase) {
            console.error('❌ Supabase не инициализирован');
            return null;
        }

        try {
            // Загружаем все таблицы параллельно
            const [users, products, orders, messages] = await Promise.all([
                this.supabase.from('users').select('*'),
                this.supabase.from('products').select('*'),
                this.supabase.from('orders').select('*').order('date', { ascending: false }),
                this.supabase.from('messages').select('*').order('date', { ascending: false })
            ]);

            // Проверяем ошибки
            if (users.error) throw users.error;
            if (products.error) throw products.error;
            if (orders.error) throw orders.error;
            if (messages.error) throw messages.error;

            this.currentData = {
                users: users.data || [],
                products: products.data || [],
                orders: orders.data || [],
                messages: messages.data || []
            };

            console.log(`✅ Загружено пользователей: ${this.currentData.users.length}`);
            console.log(`✅ Загружено товаров: ${this.currentData.products.length}`);
            console.log(`✅ Загружено заказов: ${this.currentData.orders.length}`);
            
            return this.currentData;
            
        } catch (error) {
            console.error('❌ Ошибка загрузки:', error);
            return null;
        }
    },

    // Дождаться инициализации
    async waitForInit() {
        if (this.isInitialized) return true;
        if (this.initError) throw new Error(this.initError);
        
        await this.init();
        return this.isInitialized;
    },

    // Проверка статуса
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            error: this.initError,
            hasSupabase: !!this.supabase
        };
    },

    // ============================================
    // ПОЛЬЗОВАТЕЛИ
    // ============================================

    async getUserByEmail(email) {
        await this.waitForInit();
        
        const { data, error } = await this.supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .maybeSingle();

        if (error) console.error('Ошибка getUserByEmail:', error);
        return data;
    },

    async userExists(email) {
        await this.waitForInit();
        
        const { data, error } = await this.supabase
            .from('users')
            .select('email')
            .eq('email', email);

        if (error) console.error('Ошибка userExists:', error);
        return data && data.length > 0;
    },

    async addUser(userData) {
        await this.waitForInit();
        
        const { data, error } = await this.supabase
            .from('users')
            .insert([{
                email: userData.email,
                name: userData.name,
                password: userData.password,
                role: userData.role || 'user',
                registered: new Date().toISOString()
            }])
            .select();

        if (error) throw error;
        
        if (data && data[0]) {
            this.currentData.users.push(data[0]);
            return data[0];
        }
        return null;
    },

    async updateUser(email, userData) {
        await this.waitForInit();
        
        const { data, error } = await this.supabase
            .from('users')
            .update(userData)
            .eq('email', email)
            .select();

        if (error) throw error;
        
        const index = this.currentData.users.findIndex(u => u.email === email);
        if (index !== -1 && data && data[0]) {
            this.currentData.users[index] = data[0];
        }
        
        return data ? data[0] : null;
    },

    async deleteUser(email) {
        if (email === 'admin@vetclinic.ru') {
            console.warn('Нельзя удалить администратора');
            return false;
        }

        await this.waitForInit();

        const { error } = await this.supabase
            .from('users')
            .delete()
            .eq('email', email);

        if (error) throw error;
        
        this.currentData.users = this.currentData.users.filter(u => u.email !== email);
        return true;
    },

    // ============================================
    // ТОВАРЫ
    // ============================================

async getProduct(id) {
    await this.waitForInit();
    
    const { data, error } = await this.supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (error) console.error('Ошибка getProduct:', error);
    return data;
},

async addProduct(productData) {
    await this.waitForInit();
    
    const { data, error } = await this.supabase
        .from('products')
        .insert([productData])
        .select();

    if (error) throw error;
    
    if (data && data[0]) {
        this.currentData.products.push(data[0]);
        return data[0];
    }
    return null;
},

async updateProduct(id, productData) {
    await this.waitForInit();
    
    const { data, error } = await this.supabase
        .from('products')
        .update(productData)
        .eq('id', id)
        .select();

    if (error) throw error;
    
    const index = this.currentData.products.findIndex(p => p.id === id);
    if (index !== -1 && data && data[0]) {
        this.currentData.products[index] = data[0];
    }
    
    // Отправляем сигнал об обновлении цен
    this.broadcastPriceUpdate();
    
    return data ? data[0] : null;
},

async deleteProduct(id) {
    await this.waitForInit();
    
    const { error } = await this.supabase
        .from('products')
        .delete()
        .eq('id', id);

    if (error) throw error;
    
    this.currentData.products = this.currentData.products.filter(p => p.id !== id);
    
    // Отправляем сигнал об обновлении цен (при удалении тоже)
    this.broadcastPriceUpdate();
    
    return true;
},

// Добавьте этот метод после всех методов для товаров
broadcastPriceUpdate() {
    // Сохраняем временную метку для обновления цен
    localStorage.setItem('price_update_timestamp', Date.now().toString());
    console.log('💰 Сигнал обновления цен отправлен');
},

    // ============================================
// МЕТОДЫ ДЛЯ ТОВАРОВ
// ============================================

async updateProduct(id, productData) {
    await this.waitForInit();
    
    const { data, error } = await this.supabase
        .from('products')
        .update(productData)
        .eq('id', id)
        .select();

    if (error) throw error;
    
    const index = this.currentData.products.findIndex(p => p.id === id);
    if (index !== -1 && data && data[0]) {
        this.currentData.products[index] = data[0];
    }
    
    // Отправляем сигнал об обновлении цен
    this.broadcastPriceUpdate();
    
    return data ? data[0] : null;
}

    async deleteProduct(id) {
        await this.waitForInit();
        
        const { error } = await this.supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;
        
        this.currentData.products = this.currentData.products.filter(p => p.id !== id);
        return true;
    },

    // Добавьте эту функцию в DB_MANAGER (после других методов)
broadcastPriceUpdate() {
    // Сохраняем временную метку для обновления цен
    localStorage.setItem('price_update_timestamp', Date.now().toString());
    console.log('💰 Отправлен сигнал обновления цен');
}

    // ============================================
    // ЗАКАЗЫ
    // ============================================

    async addOrder(orderData) {
        await this.waitForInit();

        const { data, error } = await this.supabase
            .from('orders')
            .insert([{
                order_number: orderData.orderNumber,
                user_email: orderData.user,
                user_name: orderData.userName,
                items: orderData.items,
                delivery: orderData.delivery,
                delivery_address: orderData.deliveryAddress || null,
                delivery_phone: orderData.deliveryPhone || null,
                delivery_cost: orderData.deliveryCost || 0,
                total: orderData.total,
                date: orderData.date || new Date().toISOString()
            }])
            .select();

        if (error) throw error;
        
        if (data && data[0]) {
            this.currentData.orders.unshift(data[0]);
            return data[0];
        }
        return null;
    },

    async deleteOrder(orderId) {
        await this.waitForInit();
        
        const { error } = await this.supabase
            .from('orders')
            .delete()
            .eq('id', orderId);

        if (error) throw error;
        
        this.currentData.orders = this.currentData.orders.filter(o => o.id !== orderId);
        return true;
    },

// ============================================
// МЕТОДЫ ДЛЯ СООБЩЕНИЙ
// ============================================

async addMessage(messageData) {
    await this.waitForInit();
    
    console.log('💾 Сохранение сообщения:', messageData);
    
    const { data, error } = await this.supabase
        .from('messages')
        .insert([{
            name: messageData.name,
            email: messageData.email,
            phone: messageData.phone || '',
            message: messageData.message,
            status: 'new',
            date: new Date().toISOString()
        }])
        .select();

    if (error) {
        console.error('❌ Ошибка сохранения сообщения:', error);
        throw error;
    }
    
    if (data && data[0]) {
        this.currentData.messages.unshift(data[0]);
        console.log('✅ Сообщение сохранено:', data[0]);
        return data[0];
    }
    
    return null;
},

    // ============================================
    // СООБЩЕНИЯ
    // ============================================

    async addMessage(messageData) {
        await this.waitForInit();
        
        const { data, error } = await this.supabase
            .from('messages')
            .insert([{
                name: messageData.name,
                email: messageData.email,
                phone: messageData.phone || '',
                message: messageData.message,
                status: 'new',
                date: new Date().toISOString()
            }])
            .select();

        if (error) throw error;
        
        if (data && data[0]) {
            this.currentData.messages.unshift(data[0]);
            return data[0];
        }
        return null;
    },

    async markMessageAsRead(messageId) {
        await this.waitForInit();
        
        const { error } = await this.supabase
            .from('messages')
            .update({ status: 'read' })
            .eq('id', messageId);

        if (error) throw error;
        
        const message = this.currentData.messages.find(m => m.id === messageId);
        if (message) message.status = 'read';
        
        return true;
    },

    async deleteMessage(messageId) {
        await this.waitForInit();
        
        const { error } = await this.supabase
            .from('messages')
            .delete()
            .eq('id', messageId);

        if (error) throw error;
        
        this.currentData.messages = this.currentData.messages.filter(m => m.id !== messageId);
        return true;
    },

    // ============================================
    // СТАТИСТИКА
    // ============================================

    getStats() {
        const totalUsers = this.currentData.users.length;
        const totalOrders = this.currentData.orders.length;
        const totalProducts = this.currentData.products.length;
        const totalMessages = this.currentData.messages.length;

        const totalRevenue = this.currentData.orders.reduce((sum, order) => sum + (order.total || 0), 0);
        const adminCount = this.currentData.users.filter(u => u.role === 'admin').length;

        const today = new Date().toDateString();
        const todayOrders = this.currentData.orders.filter(o => 
            o.date && new Date(o.date).toDateString() === today
        ).length;

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

// Автоматически запускаем инициализацию
console.log('📦 DB_MANAGER загружен');
