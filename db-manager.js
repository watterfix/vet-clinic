// ============================================
// МЕНЕДЖЕР БАЗЫ ДАННЫХ (Supabase)
// ============================================

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
        console.log(`✅ Загружено заказов: ${this.currentData.orders.length}`);
        console.log(`✅ Загружено сообщений: ${this.currentData.messages.length}`);
        
        return this.currentData;
        
    } catch (error) {
        console.error('❌ Ошибка загрузки:', error);
        
        // Пробуем загрузить из localStorage
        try {
            const ordersBackup = localStorage.getItem('db_orders_backup');
            const messagesBackup = localStorage.getItem('db_messages_backup');
            
            if (ordersBackup) {
                this.currentData.orders = JSON.parse(ordersBackup);
            }
            if (messagesBackup) {
                this.currentData.messages = JSON.parse(messagesBackup);
            }
            console.log('📁 Загружены резервные копии из localStorage');
        } catch (backupError) {
            console.error('❌ Ошибка загрузки из localStorage:', backupError);
        }
        
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
// ЗАКАЗЫ (исправленная версия)
// ============================================

async addOrder(orderData) {
    await this.waitForInit();
    console.log('📦 Добавление заказа:', orderData);

    // Генерируем номер заказа, если его нет
    if (!orderData.orderNumber) {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        let orderNumber = '';
        for (let i = 0; i < 2; i++) orderNumber += letters[Math.floor(Math.random() * letters.length)];
        for (let i = 0; i < 4; i++) orderNumber += numbers[Math.floor(Math.random() * numbers.length)];
        orderData.orderNumber = orderNumber;
    }

    const newOrder = {
        order_number: orderData.orderNumber,
        user_email: orderData.user,
        user_name: orderData.userName,
        items: orderData.items || [],
        delivery: orderData.delivery || 'pickup',
        delivery_address: orderData.deliveryAddress || null,
        delivery_phone: orderData.deliveryPhone || null,
        delivery_cost: orderData.deliveryCost || 0,
        total: orderData.total || 0,
        date: new Date().toISOString()
    };

    // Добавляем в локальные данные
    this.currentData.orders.unshift(newOrder);

    // Сохраняем в Supabase
    if (this.supabase) {
        try {
            const { data, error } = await this.supabase
                .from('orders')
                .insert([newOrder])
                .select();

            if (error) {
                console.error('❌ Ошибка сохранения заказа в Supabase:', error);
                // Сохраняем в localStorage как резервную копию
                this.saveToLocalStorage();
            } else {
                console.log('✅ Заказ сохранен в Supabase:', data);
                if (data && data[0]) {
                    // Обновляем локальные данные с данными из Supabase
                    const index = this.currentData.orders.findIndex(o => o.id === data[0].id);
                    if (index !== -1) {
                        this.currentData.orders[index] = data[0];
                    }
                }
            }
        } catch (error) {
            console.error('❌ Ошибка при сохранении заказа:', error);
            this.saveToLocalStorage();
        }
    } else {
        this.saveToLocalStorage();
    }

    return newOrder;
},

// ============================================
// СООБЩЕНИЯ - ИСПРАВЛЕННАЯ ВЕРСИЯ
// ============================================

async addMessage(messageData) {
    await this.waitForInit();
    console.log('📝 Добавление сообщения:', messageData);

    // Проверяем, что все обязательные поля есть
    if (!messageData.name || !messageData.email || !messageData.message) {
        throw new Error('Не все обязательные поля заполнены');
    }

    const newMessage = {
        name: messageData.name.trim(),
        email: messageData.email.trim().toLowerCase(),
        phone: messageData.phone ? messageData.phone.trim() : '',
        message: messageData.message.trim(),
        status: 'new',
        date: new Date().toISOString()
    };

    try {
        // Сохраняем в Supabase
        console.log('📤 Отправка в Supabase:', newMessage);
        
        const { data, error } = await this.supabase
            .from('messages')
            .insert([newMessage])
            .select();

        if (error) {
            console.error('❌ Ошибка Supabase:', error);
            throw error;
        }

        console.log('✅ Ответ Supabase:', data);

        if (data && data[0]) {
            // Добавляем в локальные данные
            this.currentData.messages.unshift(data[0]);
            
            // Отправляем сигнал об обновлении
            this.broadcastMessageUpdate();
            
            console.log('✅ Сообщение сохранено, ID:', data[0].id);
            return data[0];
        } else {
            throw new Error('Нет данных в ответе Supabase');
        }
        
    } catch (error) {
        console.error('❌ Ошибка при сохранении сообщения:', error);
        
        // Пробуем сохранить в localStorage как резервную копию
        try {
            const backupMessages = JSON.parse(localStorage.getItem('messages_backup') || '[]');
            backupMessages.push({
                ...newMessage,
                id: Date.now(),
                backup: true
            });
            localStorage.setItem('messages_backup', JSON.stringify(backupMessages));
            console.log('💾 Сообщение сохранено в localStorage как резервная копия');
        } catch (backupError) {
            console.error('❌ Ошибка сохранения резервной копии:', backupError);
        }
        
        throw error;
    }
},

// Добавить новый метод для обновления сообщений
broadcastMessageUpdate() {
    localStorage.setItem('message_update_timestamp', Date.now().toString());
    console.log('💬 Сигнал обновления сообщений отправлен');
},

// ============================================
// МЕТОДЫ ДЛЯ ЗАГРУЗКИ ЗАКАЗОВ И СООБЩЕНИЙ (добавьте, если нет)
// ============================================

async loadOrders() {
    if (!this.supabase) return [];
    
    try {
        const { data, error } = await this.supabase
            .from('orders')
            .select('*')
            .order('date', { ascending: false });
            
        if (error) throw error;
        
        this.currentData.orders = data || [];
        console.log(`✅ Загружено заказов: ${this.currentData.orders.length}`);
        return this.currentData.orders;
    } catch (error) {
        console.error('❌ Ошибка загрузки заказов:', error);
        return [];
    }
},

async loadMessages() {
    await this.waitForInit();
    console.log('📥 Загрузка сообщений...');
    
    try {
        const { data, error } = await this.supabase
            .from('messages')
            .select('*')
            .order('date', { ascending: false });

        if (error) throw error;

        this.currentData.messages = data || [];
        console.log(`✅ Загружено сообщений: ${this.currentData.messages.length}`);
        
        return this.currentData.messages;
        
    } catch (error) {
        console.error('❌ Ошибка загрузки сообщений:', error);
        
        // Пробуем загрузить из localStorage
        try {
            const backupMessages = JSON.parse(localStorage.getItem('messages_backup') || '[]');
            this.currentData.messages = backupMessages;
            console.log(`📁 Загружено ${backupMessages.length} сообщений из резервной копии`);
        } catch (backupError) {
            console.error('❌ Ошибка загрузки резервной копии:', backupError);
        }
        
        return [];
    }
},
    
// ============================================
// МЕТОД ДЛЯ СОХРАНЕНИЯ В LOCALSTORAGE (добавьте)
// ============================================

saveToLocalStorage() {
    try {
        localStorage.setItem('db_orders_backup', JSON.stringify(this.currentData.orders));
        localStorage.setItem('db_messages_backup', JSON.stringify(this.currentData.messages));
        console.log('💾 Данные сохранены в localStorage');
    } catch (error) {
        console.error('❌ Ошибка сохранения в localStorage:', error);
    }
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
