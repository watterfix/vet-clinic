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
                    throw new Error('Supabase SDK не загружен');
                }
                
                // Создаем клиент Supabase
                this.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
                console.log('✅ Supabase клиент создан');
                
                // Проверяем подключение
                const { error } = await this.supabase.from('users').select('count', { count: 'exact', head: true });
                
                if (error) {
                    console.warn('⚠️ Ошибка подключения к Supabase, работаем в офлайн режиме');
                    this.initError = error.message;
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
            console.warn('⚠️ Supabase не инициализирован, используем кэш');
            return this.currentData;
        }

        try {
            // Загружаем все таблицы параллельно
            const [users, products, orders, messages] = await Promise.all([
                this.supabase.from('users').select('*'),
                this.supabase.from('products').select('*'),
                this.supabase.from('orders').select('*').order('date', { ascending: false }),
                this.supabase.from('messages').select('*').order('date', { ascending: false })
            ]);

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
            
            return this.currentData;
            
        } catch (error) {
            console.error('❌ Ошибка загрузки:', error);
            return this.currentData;
        }
    },

    // Дождаться инициализации
    async waitForInit() {
        if (this.isInitialized) return true;
        if (this.initError) console.warn('⚠️ Ошибка инициализации:', this.initError);
        
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
        return this.currentData.users.find(u => u.email === email);
    },

    async userExists(email) {
        await this.waitForInit();
        return this.currentData.users.some(u => u.email === email);
    },

    async addUser(userData) {
        await this.waitForInit();
        
        const newUser = {
            id: userData.email,
            email: userData.email,
            name: userData.name,
            password: userData.password,
            role: userData.role || 'user',
            registered: new Date().toISOString()
        };

        this.currentData.users.push(newUser);
        
        if (this.supabase) {
            try {
                await this.supabase.from('users').insert([newUser]);
            } catch (error) {
                console.error('Ошибка сохранения в Supabase:', error);
            }
        }
        
        return newUser;
    },

    async updateUser(email, userData) {
        const index = this.currentData.users.findIndex(u => u.email === email);
        if (index === -1) return null;

        this.currentData.users[index] = {
            ...this.currentData.users[index],
            ...userData
        };

        if (this.supabase) {
            try {
                await this.supabase.from('users').update(userData).eq('email', email);
            } catch (error) {
                console.error('Ошибка обновления в Supabase:', error);
            }
        }

        return this.currentData.users[index];
    },

    async deleteUser(email) {
        if (email === 'admin@vetclinic.ru') return false;

        this.currentData.users = this.currentData.users.filter(u => u.email !== email);

        if (this.supabase) {
            try {
                await this.supabase.from('users').delete().eq('email', email);
            } catch (error) {
                console.error('Ошибка удаления из Supabase:', error);
            }
        }

        return true;
    },

    // ============================================
    // ТОВАРЫ
    // ============================================

    async getProduct(id) {
        await this.waitForInit();
        return this.currentData.products.find(p => p.id === id);
    },

    async addProduct(productData) {
        this.currentData.products.push(productData);
        
        if (this.supabase) {
            try {
                await this.supabase.from('products').insert([productData]);
            } catch (error) {
                console.error('Ошибка сохранения в Supabase:', error);
            }
        }
        
        this.broadcastPriceUpdate();
        return productData;
    },

    async updateProduct(id, productData) {
        const index = this.currentData.products.findIndex(p => p.id === id);
        if (index === -1) return null;

        this.currentData.products[index] = {
            ...this.currentData.products[index],
            ...productData
        };

        if (this.supabase) {
            try {
                await this.supabase.from('products').update(productData).eq('id', id);
            } catch (error) {
                console.error('Ошибка обновления в Supabase:', error);
            }
        }

        this.broadcastPriceUpdate();
        return this.currentData.products[index];
    },

    async deleteProduct(id) {
        this.currentData.products = this.currentData.products.filter(p => p.id !== id);

        if (this.supabase) {
            try {
                await this.supabase.from('products').delete().eq('id', id);
            } catch (error) {
                console.error('Ошибка удаления из Supabase:', error);
            }
        }

        this.broadcastPriceUpdate();
        return true;
    },

    // ============================================
    // ЗАКАЗЫ
    // ============================================

    async addOrder(orderData) {
        await this.waitForInit();

        const newOrder = {
            ...orderData,
            id: Date.now(),
            date: new Date().toISOString()
        };

        this.currentData.orders.unshift(newOrder);

        if (this.supabase) {
            try {
                await this.supabase.from('orders').insert([newOrder]);
            } catch (error) {
                console.error('Ошибка сохранения в Supabase:', error);
            }
        }

        return newOrder;
    },

    async deleteOrder(orderId) {
        this.currentData.orders = this.currentData.orders.filter(o => o.id !== orderId);

        if (this.supabase) {
            try {
                await this.supabase.from('orders').delete().eq('id', orderId);
            } catch (error) {
                console.error('Ошибка удаления из Supabase:', error);
            }
        }

        return true;
    },

    // ============================================
    // СООБЩЕНИЯ
    // ============================================

    async addMessage(messageData) {
        await this.waitForInit();

        const newMessage = {
            ...messageData,
            id: Date.now(),
            date: new Date().toISOString(),
            status: 'new'
        };

        this.currentData.messages.unshift(newMessage);

        if (this.supabase) {
            try {
                await this.supabase.from('messages').insert([newMessage]);
            } catch (error) {
                console.error('Ошибка сохранения в Supabase:', error);
            }
        }

        return newMessage;
    },

    async markMessageAsRead(messageId) {
        const message = this.currentData.messages.find(m => m.id === messageId);
        if (message) {
            message.status = 'read';
            
            if (this.supabase) {
                try {
                    await this.supabase.from('messages').update({ status: 'read' }).eq('id', messageId);
                } catch (error) {
                    console.error('Ошибка обновления в Supabase:', error);
                }
            }
        }
        return true;
    },

    async deleteMessage(messageId) {
        this.currentData.messages = this.currentData.messages.filter(m => m.id !== messageId);

        if (this.supabase) {
            try {
                await this.supabase.from('messages').delete().eq('id', messageId);
            } catch (error) {
                console.error('Ошибка удаления из Supabase:', error);
            }
        }

        return true;
    },

    // ============================================
    // СТАТИСТИКА И УВЕДОМЛЕНИЯ
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
    },

    broadcastPriceUpdate() {
        localStorage.setItem('price_update_timestamp', Date.now().toString());
        console.log('💰 Сигнал обновления цен отправлен');
    }
};

// Делаем глобальным
window.DB_MANAGER = DB_MANAGER;

// Автоматически запускаем инициализацию
console.log('📦 DB_MANAGER загружен');
DB_MANAGER.init();
