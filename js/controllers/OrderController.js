class OrderController {
    constructor(orderModel, userModel) {
        this.orderModel = orderModel;
        this.userModel = userModel;
        this.init();
    }

    init() {
        window.orderController = this;
    }

    async getAllOrders() {
        if (!this.userModel.isAdmin()) {
            throw new Error('Доступ запрещен');
        }
        return this.orderModel.getOrders();
    }

    async getOrderStats() {
        return this.orderModel.getStats();
    }

    async refreshOrders() {
        await this.orderModel.loadOrders();
    }
}

window.OrderController = OrderController;