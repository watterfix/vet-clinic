class CartController {
    constructor(userModel, orderModel) {
        this.userModel = userModel;
        this.orderModel = orderModel;
        this.cart = [];
        this.loadCart();
        this.init();
    }

    init() {
        window.cartController = this;
        CartView.createCartButton();
        this.updateCartCount();

        // Если на странице корзины, отображаем
        if (window.location.pathname.includes('cart.html')) {
            this.displayCart();
        }
    }

    loadCart() {
        const saved = localStorage.getItem('cart');
        this.cart = saved ? JSON.parse(saved) : [];
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
    }

    addToCart(name, price) {
        const user = this.userModel.getCurrentUser();

        if (!user) {
            NotificationView.show('Необходимо войти в систему', 'error');
            AuthView.showModal('login');
            return;
        }

        if (user.role === 'admin') {
            NotificationView.show('Администратор не может покупать', 'error');
            return;
        }

        this.cart.push({
            id: Date.now() + Math.random(),
            name: name,
            price: price
        });

        this.saveCart();
        this.updateCartCount();
        NotificationView.show('Товар добавлен в корзину', 'success');
    }

    removeFromCart(id) {
        this.cart = this.cart.filter(item => item.id !== id);
        this.saveCart();
        this.updateCartCount();

        if (window.location.pathname.includes('cart.html')) {
            this.displayCart();
        }
    }

    clearCart() {
        this.cart = [];
        this.saveCart();
        this.updateCartCount();
    }

    updateCartCount() {
        CartView.updateCartCount(this.cart.length);
    }

    displayCart() {
        const user = this.userModel.getCurrentUser();
        const total = this.cart.reduce((sum, item) => sum + item.price, 0);
        CartView.render(this.cart, total, user,
            (id) => this.removeFromCart(id),
            () => this.processOrder()
        );
    }

    toggleDeliveryForm() {
        const deliveryForm = document.getElementById('deliveryForm');
        if (deliveryForm) {
            deliveryForm.style.display = document.getElementById('deliveryMethod')?.checked ? 'block' : 'none';
        }
    }

    async processOrder() {
        const user = this.userModel.getCurrentUser();

        if (!user) {
            NotificationView.show('Необходимо войти в систему', 'error');
            AuthView.showModal('login');
            return;
        }

        if (this.cart.length === 0) {
            NotificationView.show('Корзина пуста', 'error');
            return;
        }

        const total = this.cart.reduce((sum, item) => sum + item.price, 0);
        const isDelivery = document.getElementById('deliveryMethod')?.checked;

        if (isDelivery) {
            const address = document.getElementById('deliveryAddress')?.value;
            const phone = document.getElementById('deliveryPhone')?.value;

            if (!address || address.length < 10) {
                document.getElementById('deliveryAddressError').textContent = 'Введите корректный адрес';
                return;
            }
            if (!phone || !Helpers.validatePhone(phone)) {
                document.getElementById('deliveryPhoneError').textContent = 'Введите корректный телефон';
                return;
            }
        }

        const freeDelivery = total >= APP_CONFIG.FREE_DELIVERY_THRESHOLD;
        const deliveryCost = isDelivery ? (freeDelivery ? 0 : APP_CONFIG.DELIVERY_COST) : 0;
        const finalTotal = total + deliveryCost;

        const orderData = {
            userEmail: user.email,
            userName: user.name,
            items: this.cart.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: 1
            })),
            delivery: isDelivery ? 'delivery' : 'pickup',
            deliveryCost: deliveryCost,
            total: finalTotal
        };

        if (isDelivery) {
            orderData.deliveryAddress = document.getElementById('deliveryAddress').value;
            orderData.deliveryPhone = document.getElementById('deliveryPhone').value;
        }

        try {
            const order = await this.orderModel.createOrder(orderData);

            // Очищаем корзину
            this.clearCart();

            // Показываем подтверждение
            let deliveryInfo = '';
            if (isDelivery) {
                deliveryInfo = `
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>🚚 Адрес доставки:</strong> ${orderData.deliveryAddress}</p>
                        <p><strong>📞 Телефон:</strong> ${orderData.deliveryPhone}</p>
                        <p><strong>💰 Стоимость доставки:</strong> ${deliveryCost > 0 ? deliveryCost + ' руб.' : 'Бесплатно'}</p>
                    </div>
                `;
            } else {
                deliveryInfo = `
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>📍 Адрес самовывоза:</strong> ${APP_CONFIG.CLINIC_ADDRESS}</p>
                        <p><strong>🕒 Режим работы:</strong> ${APP_CONFIG.WORKING_HOURS}</p>
                    </div>
                `;
            }

            NotificationView.showModal(`
                <div style="text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 15px;">🎉</div>
                    <h2 style="color: #2c6e49;">ЗАКАЗ ОФОРМЛЕН!</h2>
                    <div style="background: linear-gradient(135deg, #2c6e49, #1e4d2f); color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <strong style="font-size: 24px;">#${order.order_number}</strong>
                    </div>
                    ${deliveryInfo}
                    <div style="background-color: #e8f4e8; padding: 15px; border-radius: 8px;">
                        <h3>Ваш заказ:</h3>
                        ${orderData.items.map(item => `
                            <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                                <span>${item.name}</span>
                                <span style="font-weight: bold;">${item.price} ₽</span>
                            </div>
                        `).join('')}
                        <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #2c6e49; font-weight: bold;">
                            ИТОГО: ${finalTotal} ₽
                        </div>
                    </div>
                    <button onclick="location.href='characteristics.html'" class="button" style="margin-top: 20px;">🛒 Продолжить покупки</button>
                </div>
            `, '');

            if (window.location.pathname.includes('cart.html')) {
                this.displayCart();
            }

        } catch (error) {
            NotificationView.show(error.message, 'error');
        }
    }
}

window.CartController = CartController;