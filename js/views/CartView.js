class CartView {
    static render(cart, total, user, onRemove, onOrder) {
        const container = document.getElementById('cartContainer');
        if (!container) return;

        if (!user) {
            container.innerHTML = '<p class="cart-message">Необходимо войти в систему</p>';
            return;
        }

        if (user.role === 'admin') {
            container.innerHTML = '<p class="cart-message">Администратор не может совершать покупки</p>';
            return;
        }

        if (cart.length === 0) {
            container.innerHTML = '<p class="cart-message">Корзина пуста</p>';
            return;
        }

        const freeDelivery = total >= APP_CONFIG.FREE_DELIVERY_THRESHOLD;
        const deliveryCost = freeDelivery ? 0 : APP_CONFIG.DELIVERY_COST;

        let html = '<div class="cart-items-list">';

        cart.forEach(item => {
            html += `
                <div class="cart-item-detailed">
                    <div class="cart-item-info">
                        <h4>${this.escapeHtml(item.name)}</h4>
                        <p class="cart-item-price">${item.price} руб.</p>
                    </div>
                    <button onclick="window.cartController?.removeFromCart(${item.id})" class="button remove-btn">Удалить</button>
                </div>
            `;
        });

        html += '</div>';
        html += `<div class="cart-total-detailed">Итого: ${total} руб.</div>`;
        html += `
            <div class="delivery-methods">
                <h3>Способ получения</h3>
                <div class="delivery-method">
                    <div class="delivery-option">
                        <input type="radio" name="deliveryMethod" id="pickupMethod" value="pickup" checked onchange="window.cartController?.toggleDeliveryForm()">
                        <label for="pickupMethod"><strong>Самовывоз</strong> (бесплатно)</label>
                    </div>
                    <div id="pickupInfo" class="delivery-info">
                        <p>📍 Адрес самовывоза: <strong>${APP_CONFIG.CLINIC_ADDRESS}</strong></p>
                        <p>🕒 Режим работы: ${APP_CONFIG.WORKING_HOURS}</p>
                    </div>
                </div>
                <div class="delivery-method">
                    <div class="delivery-option">
                        <input type="radio" name="deliveryMethod" id="deliveryMethod" value="delivery" onchange="window.cartController?.toggleDeliveryForm()">
                        <label for="deliveryMethod"><strong>Доставка</strong> ${freeDelivery ? '<span class="free-delivery">(бесплатно)</span>' : `(${APP_CONFIG.DELIVERY_COST} руб.)`}</label>
                    </div>
                    <div id="deliveryForm" class="delivery-info" style="display: none;">
                        <div class="form-group">
                            <label for="deliveryAddress">Адрес доставки:</label>
                            <input type="text" id="deliveryAddress" placeholder="Улица, дом, квартира" class="delivery-input">
                            <span class="error-message" id="deliveryAddressError"></span>
                        </div>
                        <div class="form-group">
                            <label for="deliveryPhone">Контактный телефон:</label>
                            <input type="tel" id="deliveryPhone" placeholder="+7 (999) 123-45-67" class="delivery-input">
                            <span class="error-message" id="deliveryPhoneError"></span>
                        </div>
                    </div>
                </div>
                <button onclick="window.cartController?.processOrder()" class="button checkout-btn">Оформить заказ</button>
            </div>
        `;

        container.innerHTML = html;
    }

    static updateCartCount(count) {
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            cartCount.textContent = count;
            cartCount.style.display = count > 0 ? 'inline-block' : 'none';
        }
    }

    static createCartButton() {
        if (document.getElementById('cartButton')) return;

        const cartButton = document.createElement('div');
        cartButton.id = 'cartButton';
        cartButton.className = 'cart-button';
        cartButton.innerHTML = `
            <button onclick="window.location.href='cart.html'" class="cart-btn">
                🛒 Корзина <span id="cartCount" class="cart-count">0</span>
            </button>
        `;
        document.body.appendChild(cartButton);
    }

    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

window.CartView = CartView;