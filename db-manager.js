// ============================================
// МЕНЕДЖЕР БАЗЫ ДАННЫХ (Supabase)
// ============================================

// ВСТАВЬТЕ СВОИ ДАННЫЕ ИЗ SUPABASE
const SUPABASE_URL = 'https://ehksdceuihjnzbqdztog.supabase.co';
const SUPABASE_KEY = 'sb_publishable_K1dDdxBKQ_04yOqwkfCxsw_JyiHlkxW';

const DB_MANAGER = {
    supabase: null,
    currentData: {
        users: [],
        products: [],
        orders: [],
        messages: []
    },

    async init() {
        console.log('🔄 Подключение к Supabase...');
        this.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        await this.loadDatabase();
        return this;
    },

    async loadDatabase() {
        try {
            console.log('📦 Загрузка данных из Supabase...');
            
            const [users, products, orders, messages] = await Promise.all([
                this.supabase.from('users').select('*'),
                this.supabase.from('products').select('*'),
                this.supabase.from('orders').select('*').order('date', { ascending: false }),
                this.supabase.from('messages').select('*').order('date', { ascending: false })
            ]);

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

    // ============================================
    // ПОЛЬЗОВАТЕЛИ
    // ============================================

    async getUserByEmail(email) {
        const { data } = await this.supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .maybeSingle();
        return data;
    },

    async userExists(email) {
        const { data } = await this.supabase
            .from('users')
            .select('email')
            .eq('email', email);
        return data && data.length > 0;
    },

    async addUser(userData) {
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
        }
        return data ? data[0] : null;
    },

    async updateUser(email, userData) {
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
        const { data } = await this.supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        return data;
    },

    async addProduct(productData) {
        const { data, error } = await this.supabase
            .from('products')
            .insert([productData])
            .select();

        if (error) throw error;
        
        if (data && data[0]) {
            this.currentData.products.push(data[0]);
        }
        return data ? data[0] : null;
    },

    async updateProduct(id, productData) {
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
        
        return data ? data[0] : null;
    },

    async deleteProduct(id) {
        const { error } = await this.supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;
        
        this.currentData.products = this.currentData.products.filter(p => p.id !== id);
        return true;
    },

    // ============================================
    // ЗАКАЗЫ
    // ============================================

    async addOrder(orderData) {
        // Генерируем номер заказа, если его нет
        if (!orderData.order_number) {
            const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const numbers = '0123456789';
            let orderNumber = '';
            for (let i = 0; i < 2; i++) orderNumber += letters[Math.floor(Math.random() * letters.length)];
            for (let i = 0; i < 4; i++) orderNumber += numbers[Math.floor(Math.random() * numbers.length)];
            orderData.order_number = orderNumber;
        }

        const { data, error } = await this.supabase
            .from('orders')
            .insert([{
                order_number: orderData.order_number,
                user_email: orderData.user,
                user_name: orderData.userName,
                items: orderData.items,
                delivery: orderData.delivery,
                delivery_address: orderData.deliveryAddress,
                delivery_phone: orderData.deliveryPhone,
                delivery_cost: orderData.deliveryCost || 0,
                total: orderData.total,
                date: new Date().toISOString()
            }])
            .select();

        if (error) throw error;
        
        if (data && data[0]) {
            this.currentData.orders.unshift(data[0]);
        }
        return data ? data[0] : null;
    },

    async deleteOrder(orderId) {
        const { error } = await this.supabase
            .from('orders')
            .delete()
            .eq('id', orderId);

        if (error) throw error;
        
        this.currentData.orders = this.currentData.orders.filter(o => o.id !== orderId);
        return true;
    },

    async getOrder(orderId) {
        const { data } = await this.supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .maybeSingle();
        return data;
    },

    async getUserOrders(email) {
        const { data } = await this.supabase
            .from('orders')
            .select('*')
            .eq('user_email', email)
            .order('date', { ascending: false });
        return data || [];
    },

    // ============================================
    // СООБЩЕНИЯ
    // ============================================

    async addMessage(messageData) {
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
        }
        return data ? data[0] : null;
    },

    async getMessages() {
        const { data } = await this.supabase
            .from('messages')
            .select('*')
            .order('date', { ascending: false });
        return data || [];
    },

    async markMessageAsRead(messageId) {
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
    },

    // Сброс данных (только для разработки)
    async resetToDefault() {
        // Очищаем таблицы
        await this.supabase.from('orders').delete().neq('id', 0);
        await this.supabase.from('messages').delete().neq('id', 0);
        
        // Перезагружаем данные
        await this.loadDatabase();
        return this.currentData;
    }
};

// Делаем глобальным
window.DB_MANAGER = DB_MANAGER;

// Автоматическая инициализация
DB_MANAGER.init().then(() => {
    console.log('✅ DB_MANAGER готов (Supabase)');
});
