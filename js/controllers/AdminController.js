class AdminController {
    constructor(userModel, productModel, orderModel, messageModel) {
        this.userModel = userModel;
        this.productModel = productModel;
        this.orderModel = orderModel;
        this.messageModel = messageModel;
        this.init();
    }

    init() {
        window.adminController = this;

        if (window.location.pathname.includes('db-viewer.html')) {
            this.checkAdminAccess();
        }
    }

    async checkAdminAccess() {
        const currentUser = this.userModel.getCurrentUser();

        if (!currentUser) {
            document.getElementById('adminCheck').innerHTML = '⚠️ Необходимо войти в систему!';
            document.getElementById('adminCheck').style.display = 'block';
            return;
        }

        if (!this.userModel.isAdmin()) {
            document.getElementById('adminCheck').innerHTML = '⚠️ Доступ запрещен! Только администратор';
            document.getElementById('adminCheck').style.display = 'block';
            return;
        }

        await this.loadAllData();
        this.showAdminInterface();
    }

    async loadAllData() {
        await Promise.all([
            this.userModel.getAllUsers(),
            this.productModel.loadProducts(),
            this.orderModel.loadOrders(),
            this.messageModel.loadMessages()
        ]);
    }

    showAdminInterface() {
        document.getElementById('adminCheck').style.display = 'none';
        document.querySelectorAll('.db-panel, .export-buttons, .import-area, .db-tabs').forEach(el => {
            if (el) el.style.display = '';
        });

        this.updateStats();
        this.loadUsers();
        this.loadProducts();
        this.loadOrders();
        this.loadMessages();
    }

    updateStats() {
        const users = this.userModel.getAllUsers();
        const products = this.productModel.getProducts();
        const orders = this.orderModel.getOrders();
        const messages = this.messageModel.getMessages();

        const adminCount = users.filter(u => u.role === 'admin').length;
        const productsByCategory = {};
        products.forEach(p => {
            productsByCategory[p.category] = (productsByCategory[p.category] || 0) + 1;
        });

        const stats = {
            totalUsers: users.length,
            adminCount: adminCount,
            userCount: users.length - adminCount,
            totalProducts: products.length,
            productsByCategory: productsByCategory,
            totalOrders: orders.length,
            totalRevenue: orders.reduce((sum, o) => sum + (o.total || 0), 0),
            todayOrders: orders.filter(o => o.date && new Date(o.date).toDateString() === new Date().toDateString()).length,
            averageOrderValue: orders.length > 0 ? orders.reduce((sum, o) => sum + (o.total || 0), 0) / orders.length : 0,
            totalMessages: messages.length,
            unreadMessages: messages.filter(m => m.status === 'new').length
        };

        const statsContainer = document.getElementById('statsGrid');
        if (statsContainer) {
            statsContainer.innerHTML = AdminView.renderStats(stats);
        }
    }

    async loadUsers() {
        const container = document.getElementById('usersTableBody');
        if (!container) return;

        const users = await this.userModel.getAllUsers();
        container.innerHTML = AdminView.renderUsersTable(users, (email) => this.deleteUser(email));
    }

    async loadProducts() {
        const container = document.getElementById('productsTableBody');
        if (!container) return;

        const products = this.productModel.getProducts();
        container.innerHTML = AdminView.renderProductsTable(
            products,
            (id) => this.editProduct(id),
            (id) => this.deleteProduct(id)
        );
    }

    async loadOrders() {
        const container = document.getElementById('ordersTableBody');
        if (!container) return;

        const orders = this.orderModel.getOrders();
        container.innerHTML = OrderView.renderOrders(
            orders,
            (id) => this.viewOrderDetails(id),
            (id) => this.deleteOrder(id)
        );
    }

    async loadMessages() {
        const container = document.getElementById('messagesTableBody');
        if (!container) return;

        const messages = this.messageModel.getMessages();
        container.innerHTML = MessageView.renderMessages(
            messages,
            (id) => this.markMessageAsRead(id),
            (id) => this.deleteMessage(id)
        );
    }

    async deleteUser(email) {
        if (email === 'admin@vetclinic.ru') {
            NotificationView.show('Нельзя удалить главного администратора!', 'error');
            return;
        }

        const confirmed = await NotificationView.showConfirm({
            title: 'Удаление пользователя',
            message: `Вы уверены, что хотите удалить пользователя ${email}?`,
            confirmText: '🗑️ Удалить',
            cancelText: '↩️ Отмена',
            type: 'danger'
        });

        if (!confirmed) return;

        try {
            await this.userModel.deleteUser(email);
            NotificationView.show('Пользователь удален', 'success');
            await this.loadUsers();
            this.updateStats();
        } catch (error) {
            NotificationView.show(error.message, 'error');
        }
    }

    async addUser() {
        const name = document.getElementById('newUserName')?.value;
        const email = document.getElementById('newUserEmail')?.value;
        const password = document.getElementById('newUserPassword')?.value;
        const role = document.getElementById('newUserRole')?.value;

        if (!name || !email || !password) {
            NotificationView.show('Заполните все поля', 'error');
            return;
        }

        try {
            await this.userModel.register({ name, email, password, role });
            NotificationView.show('Пользователь добавлен', 'success');
            this.hideAddUserForm();
            await this.loadUsers();
            this.updateStats();
        } catch (error) {
            NotificationView.show(error.message, 'error');
        }
    }

    async addProduct() {
        const id = document.getElementById('newProductId')?.value;
        const name = document.getElementById('newProductName')?.value;
        const price = document.getElementById('newProductPrice')?.value;
        const category = document.getElementById('newProductCategory')?.value;
        const description = document.getElementById('newProductDescription')?.value;

        if (!id || !name || !price) {
            NotificationView.show('Заполните обязательные поля', 'error');
            return;
        }

        try {
            await this.productModel.addProduct({
                id: id,
                name: name,
                price: parseInt(price),
                category: category,
                description: description || '',
                inStock: true
            });
            NotificationView.show('Товар добавлен', 'success');
            this.hideAddProductForm();
            await this.loadProducts();
            this.updateStats();
        } catch (error) {
            NotificationView.show(error.message, 'error');
        }
    }

    async deleteProduct(productId) {
        const product = this.productModel.getProductById(productId);
        if (!product) return;

        const confirmed = await NotificationView.showConfirm({
            title: 'Удаление товара',
            message: `Вы уверены, что хотите удалить товар "${product.name}"?`,
            confirmText: '🗑️ Удалить',
            cancelText: '↩️ Отмена',
            type: 'danger'
        });

        if (!confirmed) return;

        try {
            await this.productModel.deleteProduct(productId);
            NotificationView.show('Товар удален', 'success');
            await this.loadProducts();
            this.updateStats();
        } catch (error) {
            NotificationView.show(error.message, 'error');
        }
    }

    async deleteOrder(orderId) {
        const confirmed = await NotificationView.showConfirm({
            title: 'Удаление заказа',
            message: 'Вы уверены, что хотите удалить этот заказ?',
            confirmText: '🗑️ Удалить',
            cancelText: '↩️ Отмена',
            type: 'danger'
        });

        if (!confirmed) return;

        try {
            await this.orderModel.deleteOrder(orderId);
            NotificationView.show('Заказ удален', 'success');
            await this.loadOrders();
            this.updateStats();
        } catch (error) {
            NotificationView.show(error.message, 'error');
        }
    }

    async deleteMessage(messageId) {
        const confirmed = await NotificationView.showConfirm({
            title: 'Удаление сообщения',
            message: 'Вы уверены, что хотите удалить это сообщение?',
            confirmText: '🗑️ Удалить',
            cancelText: '↩️ Отмена',
            type: 'danger'
        });

        if (!confirmed) return;

        try {
            await this.messageModel.deleteMessage(messageId);
            NotificationView.show('Сообщение удалено', 'success');
            await this.loadMessages();
            this.updateStats();
        } catch (error) {
            NotificationView.show(error.message, 'error');
        }
    }

    async markMessageAsRead(messageId) {
        try {
            await this.messageModel.markAsRead(messageId);
            NotificationView.show('Сообщение отмечено как прочитанное', 'success');
            await this.loadMessages();
            this.updateStats();
        } catch (error) {
            NotificationView.show(error.message, 'error');
        }
    }

    viewOrderDetails(orderId) {
        const order = this.orderModel.getOrders().find(o => o.id == orderId);
        if (!order) return;

        const modalContent = OrderView.renderOrderDetailsModal(order);
        const overlay = document.createElement('div');
        overlay.className = 'order-details-modal';
        overlay.innerHTML = modalContent;
        document.body.appendChild(overlay);
    }

    editProduct(productId) {
        // Реализация редактирования товара в таблице
        const product = this.productModel.getProductById(productId);
        if (!product) return;

        const row = document.getElementById(`product-${productId}`);
        if (!row) return;

        row.innerHTML = `
            <td><code>${product.id}</code></td>
            <td><input type="text" id="edit-name-${productId}" value="${product.name}" class="edit-input"></td>
            <td><input type="number" id="edit-price-${productId}" value="${product.price}" class="edit-input" min="0"></td>
            <td>
                <select id="edit-category-${productId}" class="edit-input">
                    <option value="food" ${product.category === 'food' ? 'selected' : ''}>🍖 Корма</option>
                    <option value="medicine" ${product.category === 'medicine' ? 'selected' : ''}>💊 Лекарства</option>
                    <option value="accessories" ${product.category === 'accessories' ? 'selected' : ''}>🪀 Аксессуары</option>
                    <option value="hygiene" ${product.category === 'hygiene' ? 'selected' : ''}>🧼 Гигиена</option>
                </select>
            </td>
            <td><input type="text" id="edit-desc-${productId}" value="${product.description || ''}" class="edit-input"></td>
            <td class="action-buttons">
                <button onclick="window.adminController.saveProductEdit('${productId}')" class="btn-save">💾 Сохранить</button>
                <button onclick="window.adminController.loadProducts()" class="btn-delete">Отмена</button>
            </td>
        `;
    }

    async saveProductEdit(productId) {
        const name = document.getElementById(`edit-name-${productId}`)?.value;
        const price = document.getElementById(`edit-price-${productId}`)?.value;
        const category = document.getElementById(`edit-category-${productId}`)?.value;
        const description = document.getElementById(`edit-desc-${productId}`)?.value;

        if (!name || !price) {
            NotificationView.show('Заполните название и цену', 'error');
            return;
        }

        try {
            await this.productModel.updateProduct(productId, {
                name: name,
                price: parseInt(price),
                category: category,
                description: description
            });
            NotificationView.show('Товар обновлен', 'success');
            await this.loadProducts();
            this.updateStats();
        } catch (error) {
            NotificationView.show(error.message, 'error');
        }
    }

    showAddUserForm() {
        const form = document.getElementById('addUserForm');
        if (form) form.style.display = 'block';
    }

    hideAddUserForm() {
        const form = document.getElementById('addUserForm');
        if (form) {
            form.style.display = 'none';
            document.getElementById('newUserName').value = '';
            document.getElementById('newUserEmail').value = '';
            document.getElementById('newUserPassword').value = '';
            document.getElementById('newUserRole').value = 'user';
        }
    }

    showAddProductForm() {
        const form = document.getElementById('addProductForm');
        if (form) form.style.display = 'block';
    }

    hideAddProductForm() {
        const form = document.getElementById('addProductForm');
        if (form) {
            form.style.display = 'none';
            document.getElementById('newProductId').value = '';
            document.getElementById('newProductName').value = '';
            document.getElementById('newProductPrice').value = '';
            document.getElementById('newProductDescription').value = '';
        }
    }
}

window.AdminController = AdminController;