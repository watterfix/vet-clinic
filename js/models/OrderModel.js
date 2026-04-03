class OrderModel {
    constructor(dbManager) {
        this.db = dbManager;
        this.orders = [];
    }

    async loadOrders() {
        await this.db.waitForInit();

        const { data, error } = await this.db.getSupabase()
            .from('orders')
            .select('*')
            .order('date', { ascending: false });

        if (error) throw error;
        this.orders = data || [];
        return this.orders;
    }

    getOrders() {
        return this.orders;
    }

    async createOrder(orderData) {
        const userModel = new UserModel(this.db);
        if (!userModel.isAuthenticated()) {
            throw new Error('Необходимо войти в систему');
        }

        if (userModel.isAdmin()) {
            throw new Error('Администратор не может оформлять заказы');
        }

        const orderNumber = this.generateOrderNumber();

        const newOrder = {
            order_number: orderNumber,
            user_email: orderData.userEmail,
            user_name: orderData.userName,
            items: orderData.items,
            delivery: orderData.delivery,
            delivery_address: orderData.deliveryAddress || null,
            delivery_phone: orderData.deliveryPhone || null,
            delivery_cost: orderData.deliveryCost || 0,
            total: orderData.total,
            date: new Date().toISOString()
        };

        const result = await this.db.insert('orders', newOrder);
        await this.loadOrders();
        this.db.broadcastUpdate('orders');

        return { ...result, order_number: orderNumber };
    }

    generateOrderNumber() {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        let result = '';
        for (let i = 0; i < 2; i++) result += letters[Math.floor(Math.random() * letters.length)];
        for (let i = 0; i < 4; i++) result += numbers[Math.floor(Math.random() * numbers.length)];
        return result;
    }

    async deleteOrder(orderId) {
        const userModel = new UserModel(this.db);
        if (!userModel.isAdmin()) {
            throw new Error('Только администратор может удалять заказы');
        }

        await this.db.delete('orders', orderId);
        await this.loadOrders();
        this.db.broadcastUpdate('orders');
        return true;
    }

    getStats() {
        const totalOrders = this.orders.length;
        const totalRevenue = this.orders.reduce((sum, o) => sum + (o.total || 0), 0);
        const today = new Date().toDateString();
        const todayOrders = this.orders.filter(o =>
            o.date && new Date(o.date).toDateString() === today
        ).length;

        return {
            totalOrders,
            totalRevenue,
            todayOrders,
            averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
        };
    }
}

window.OrderModel = OrderModel;