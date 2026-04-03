class OrderView {
    static renderOrders(orders, onViewDetails, onDelete) {
        if (!orders || orders.length === 0) {
            return '<tr><td colspan="8" style="text-align: center; padding: 30px;">Нет заказов</td></tr>';
        }

        let html = '';
        orders.forEach(order => {
            const date = new Date(order.date).toLocaleString();
            const deliveryText = order.delivery === 'pickup' ? '🚶 Самовывоз' : '🚚 Доставка';

            html += `
                <tr id="order-${order.id}">
                    <td><strong>#${order.order_number || 'Н/Д'}</strong></td>
                    <td>${date}</td>
                    <td>
                        ${this.escapeHtml(order.user_name)}<br>
                        <small>${this.escapeHtml(order.user_email)}</small>
                    </td>
                    <td><strong>${order.total} ₽</strong></td>
                    <td>${deliveryText}</td>
                    <td>${this.getDeliveryAddress(order)}</td>
                    <td>${order.items ? order.items.length : 0} шт.</td>
                    <td class="action-buttons">
                        <button onclick="(${onViewDetails.toString()})('${order.id}')" class="btn-view">👁️ Детали</button>
                        <button onclick="(${onDelete.toString()})('${order.id}')" class="btn-delete">🗑️ Удалить</button>
                    </td>
                </tr>
            `;
        });

        return html;
    }

    static renderOrderDetailsModal(order) {
        if (!order) return;

        // Группируем товары
        const itemsMap = new Map();
        if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
                const key = `${item.name}_${item.price}`;
                if (itemsMap.has(key)) {
                    itemsMap.get(key).quantity++;
                } else {
                    itemsMap.set(key, {
                        name: item.name,
                        price: item.price,
                        quantity: 1
                    });
                }
            });
        }

        let itemsHtml = '';
        for (const item of itemsMap.values()) {
            itemsHtml += `
                <div class="order-item-row">
                    <span class="order-item-name">
                        ${this.escapeHtml(item.name)}
                        ${item.quantity > 1 ? `<span style="color: #666; font-size: 12px;">(x${item.quantity})</span>` : ''}
                    </span>
                    <span class="order-item-price">${item.price * item.quantity} ₽</span>
                </div>
            `;
        }

        let deliveryInfo = '';
        if (order.delivery === 'pickup') {
            deliveryInfo = `
                <div class="order-delivery-info">
                    <p><strong>📍 Адрес самовывоза:</strong> ${APP_CONFIG.CLINIC_ADDRESS}</p>
                    <p><strong>🕒 Режим работы:</strong> ${APP_CONFIG.WORKING_HOURS}</p>
                    <p><strong>📞 Телефон:</strong> ${APP_CONFIG.CLINIC_PHONE}</p>
                </div>
            `;
        } else {
            deliveryInfo = `
                <div class="order-delivery-info">
                    <p><strong>🚚 Адрес доставки:</strong> ${order.delivery_address || 'Не указан'}</p>
                    <p><strong>📞 Телефон:</strong> ${order.delivery_phone || 'Не указан'}</p>
                    <p><strong>💰 Стоимость доставки:</strong> ${order.delivery_cost > 0 ? order.delivery_cost + ' ₽' : 'Бесплатно'}</p>
                </div>
            `;
        }

        const modalContent = `
            <div class="order-details-content">
                <div class="order-details-close" onclick="this.closest('.order-details-modal').remove()">×</div>
                
                <div class="order-details-header">
                    <div class="order-details-number">#${order.order_number || 'Н/Д'}</div>
                    <div class="order-details-date">${new Date(order.date).toLocaleString()}</div>
                </div>
                
                <div class="order-details-section">
                    <h3>Информация о клиенте</h3>
                    <div class="order-info-grid">
                        <div class="order-info-item">
                            <div class="order-info-label">Имя</div>
                            <div class="order-info-value">${this.escapeHtml(order.user_name || 'Н/Д')}</div>
                        </div>
                        <div class="order-info-item">
                            <div class="order-info-label">Email</div>
                            <div class="order-info-value">${this.escapeHtml(order.user_email || order.user || 'Н/Д')}</div>
                        </div>
                    </div>
                </div>
                
                <div class="order-details-section">
                    <h3>Состав заказа</h3>
                    <div class="order-items-list">
                        ${itemsHtml || '<p style="text-align: center; color: #999;">Нет товаров</p>'}
                    </div>
                    <div class="order-total-row">
                        <span class="order-total-label">ИТОГО:</span>
                        <span class="order-total-value">${order.total || 0} ₽</span>
                    </div>
                </div>
                
                <div class="order-details-section">
                    <h3>Информация о доставке</h3>
                    ${deliveryInfo}
                </div>
                
                <button class="order-details-button" onclick="this.closest('.order-details-modal').remove()">
                    Закрыть
                </button>
            </div>
        `;

        return modalContent;
    }

    static getDeliveryAddress(order) {
        if (order.delivery === 'pickup') {
            return '🚶 Самовывоз';
        }
        return order.delivery_address || 'Адрес не указан';
    }

    static escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

window.OrderView = OrderView;