/**
 * ModalView - Управление всеми модальными окнами
 * Отвечает за создание, отображение и управление модальными окнами
 */
class ModalView {
    // Базовое модальное окно
    static show(options) {
        return new Promise((resolve) => {
            const {
                title = 'Информация',
                content = '',
                size = 'medium',
                showClose = true,
                closeOnOverlay = true,
                onClose = null
            } = options;

            // Удаляем существующее окно
            this.hide();

            // Создаем overlay
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(5px);
                z-index: 10000;
                display: flex;
                justify-content: center;
                align-items: center;
                animation: modalFadeIn 0.3s ease;
            `;

            // Определяем размер
            let sizeClass = '';
            switch (size) {
                case 'small':
                    sizeClass = 'modal-small';
                    break;
                case 'large':
                    sizeClass = 'modal-large';
                    break;
                case 'full':
                    sizeClass = 'modal-full';
                    break;
                default:
                    sizeClass = 'modal-medium';
            }

            // Создаем контент модального окна
            const modal = document.createElement('div');
            modal.className = `modal-content ${sizeClass}`;
            modal.style.cssText = `
                background: linear-gradient(135deg, #ffffff, #f8f9fa);
                border-radius: 20px;
                padding: 0;
                max-width: ${size === 'small' ? '400px' : size === 'large' ? '800px' : '600px'};
                width: 90%;
                max-height: 85vh;
                overflow: hidden;
                position: relative;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                border: 3px solid #2c6e49;
                animation: modalSlideUp 0.4s ease;
                display: flex;
                flex-direction: column;
            `;

            // Заголовок
            const header = document.createElement('div');
            header.className = 'modal-header';
            header.style.cssText = `
                padding: 20px 25px;
                background: linear-gradient(135deg, #2c6e49, #1e4d2f);
                color: white;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 2px solid #ffd700;
            `;
            header.innerHTML = `
                <h2 style="margin: 0; font-size: 1.5rem;">${this.escapeHtml(title)}</h2>
                ${showClose ? '<span class="modal-close" style="font-size: 32px; cursor: pointer; line-height: 1;">&times;</span>' : ''}
            `;

            // Тело
            const body = document.createElement('div');
            body.className = 'modal-body';
            body.style.cssText = `
                padding: 25px;
                overflow-y: auto;
                flex: 1;
                color: #333;
                line-height: 1.6;
            `;

            if (typeof content === 'string') {
                body.innerHTML = content;
            } else if (content instanceof HTMLElement) {
                body.appendChild(content);
            }

            // Футер (опционально)
            let footer = null;
            if (options.buttons || options.onConfirm) {
                footer = document.createElement('div');
                footer.className = 'modal-footer';
                footer.style.cssText = `
                    padding: 15px 25px;
                    background-color: #f8f9fa;
                    border-top: 1px solid #e0e0e0;
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                `;

                if (options.buttons) {
                    options.buttons.forEach(btn => {
                        const button = this.createButton(btn);
                        footer.appendChild(button);
                    });
                } else if (options.onConfirm) {
                    const confirmBtn = this.createButton({
                        text: options.confirmText || 'Подтвердить',
                        type: 'confirm',
                        onClick: () => {
                            options.onConfirm();
                            this.hide();
                            resolve(true);
                        }
                    });
                    footer.appendChild(confirmBtn);

                    const cancelBtn = this.createButton({
                        text: options.cancelText || 'Отмена',
                        type: 'cancel',
                        onClick: () => {
                            this.hide();
                            resolve(false);
                        }
                    });
                    footer.appendChild(cancelBtn);
                }
            }

            modal.appendChild(header);
            modal.appendChild(body);
            if (footer) modal.appendChild(footer);
            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            // Закрытие по клику на крестик
            if (showClose) {
                const closeBtn = header.querySelector('.modal-close');
                if (closeBtn) {
                    closeBtn.onclick = () => {
                        this.hide();
                        if (onClose) onClose();
                        resolve(false);
                    };
                }
            }

            // Закрытие по клику на фон
            if (closeOnOverlay) {
                overlay.onclick = (e) => {
                    if (e.target === overlay) {
                        this.hide();
                        if (onClose) onClose();
                        resolve(false);
                    }
                };
            }

            // Закрытие по Escape
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    this.hide();
                    document.removeEventListener('keydown', handleEscape);
                    if (onClose) onClose();
                    resolve(false);
                }
            };
            document.addEventListener('keydown', handleEscape);

            // Сохраняем для последующего закрытия
            this.currentOverlay = overlay;
            this.currentEscapeHandler = handleEscape;
        });
    }

    // Показать уведомление (не блокирующее)
    static showToast(message, type = 'success', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: ${type === 'success' ? '#2c6e49' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#17a2b8'};
            color: ${type === 'warning' ? '#1e4d2f' : 'white'};
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 10001;
            animation: slideInRight 0.3s ease;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 10px;
            max-width: 350px;
        `;

        const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
        toast.innerHTML = `${icon} ${message}`;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // Показать диалог подтверждения
    static async confirm(options) {
        const {
            title = 'Подтверждение',
            message = 'Вы уверены?',
            confirmText = 'Да',
            cancelText = 'Нет',
            type = 'warning' // warning, danger, info, success
        } = options;

        // Определяем иконку
        let icon = '❓';
        let color = '#2c6e49';
        switch (type) {
            case 'danger':
                icon = '⚠️';
                color = '#dc3545';
                break;
            case 'warning':
                icon = '⚠️';
                color = '#ffc107';
                break;
            case 'info':
                icon = 'ℹ️';
                color = '#17a2b8';
                break;
            case 'success':
                icon = '✅';
                color = '#2c6e49';
                break;
        }

        const content = `
            <div style="text-align: center;">
                <div style="font-size: 48px; margin-bottom: 20px;">${icon}</div>
                <div style="font-size: 18px; margin-bottom: 20px; color: #333;">${this.escapeHtml(message)}</div>
            </div>
        `;

        const result = await this.show({
            title: title,
            content: content,
            size: 'small',
            confirmText: confirmText,
            cancelText: cancelText,
            onConfirm: true
        });

        return result;
    }

    // Показать детали заказа
    static showOrderDetails(order) {
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
                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px dashed #2c6e49;">
                    <span>${this.escapeHtml(item.name)} ${item.quantity > 1 ? `×${item.quantity}` : ''}</span>
                    <span style="font-weight: bold; color: #2c6e49;">${item.price * item.quantity} ₽</span>
                </div>
            `;
        }

        let deliveryInfo = '';
        if (order.delivery === 'pickup') {
            deliveryInfo = `
                <div style="background: linear-gradient(135deg, #e8f4e8, #d4e8d4); padding: 15px; border-radius: 10px; margin-top: 15px;">
                    <p><strong>📍 Самовывоз:</strong> ${APP_CONFIG.CLINIC_ADDRESS}</p>
                    <p><strong>🕒 Режим работы:</strong> ${APP_CONFIG.WORKING_HOURS}</p>
                </div>
            `;
        } else {
            deliveryInfo = `
                <div style="background: linear-gradient(135deg, #fff3cd, #ffe69c); padding: 15px; border-radius: 10px; margin-top: 15px;">
                    <p><strong>🚚 Доставка:</strong> ${this.escapeHtml(order.delivery_address || 'Не указан')}</p>
                    <p><strong>📞 Телефон:</strong> ${this.escapeHtml(order.delivery_phone || 'Не указан')}</p>
                    <p><strong>💰 Стоимость:</strong> ${order.delivery_cost > 0 ? order.delivery_cost + ' ₽' : 'Бесплатно'}</p>
                </div>
            `;
        }

        const content = `
            <div style="text-align: left;">
                <div style="background: linear-gradient(135deg, #2c6e49, #1e4d2f); color: white; padding: 15px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
                    <div style="font-size: 24px; font-weight: bold;">Заказ #${order.order_number || 'Н/Д'}</div>
                    <div style="font-size: 12px; margin-top: 5px;">${new Date(order.date).toLocaleString()}</div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3 style="color: #2c6e49; margin-bottom: 10px;">👤 Информация о клиенте</h3>
                    <div style="background: #f5f5f5; padding: 15px; border-radius: 10px;">
                        <p><strong>Имя:</strong> ${this.escapeHtml(order.user_name || 'Н/Д')}</p>
                        <p><strong>Email:</strong> ${this.escapeHtml(order.user_email || order.user || 'Н/Д')}</p>
                    </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3 style="color: #2c6e49; margin-bottom: 10px;">📦 Состав заказа</h3>
                    <div style="background: #f5f5f5; padding: 15px; border-radius: 10px;">
                        ${itemsHtml || '<p style="text-align: center;">Нет товаров</p>'}
                        <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #2c6e49; font-weight: bold; display: flex; justify-content: space-between;">
                            <span>ИТОГО:</span>
                            <span style="color: #2c6e49; font-size: 20px;">${order.total || 0} ₽</span>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h3 style="color: #2c6e49; margin-bottom: 10px;">🚚 Доставка</h3>
                    ${deliveryInfo}
                </div>
            </div>
        `;

        this.show({
            title: 'Детали заказа',
            content: content,
            size: 'medium',
            buttons: [
                {
                    text: 'Закрыть',
                    type: 'cancel',
                    onClick: () => this.hide()
                }
            ]
        });
    }

    // Показать загрузчик
    static showLoading(message = 'Загрузка...') {
        this.show({
            title: 'Загрузка',
            content: `
                <div style="text-align: center; padding: 20px;">
                    <div class="loading-spinner" style="width: 50px; height: 50px; border: 4px solid #f3f3f3; border-top: 4px solid #2c6e49; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                    <p>${this.escapeHtml(message)}</p>
                </div>
            `,
            size: 'small',
            showClose: false,
            closeOnOverlay: false
        });
    }

    // Скрыть текущее модальное окно
    static hide() {
        if (this.currentOverlay) {
            this.currentOverlay.remove();
            this.currentOverlay = null;
        }
        if (this.currentEscapeHandler) {
            document.removeEventListener('keydown', this.currentEscapeHandler);
            this.currentEscapeHandler = null;
        }
    }

    // Создать кнопку для модального окна
    static createButton(options) {
        const {
            text,
            type = 'default', // confirm, cancel, danger, default
            onClick
        } = options;

        let buttonClass = '';
        let buttonStyle = '';

        switch (type) {
            case 'confirm':
                buttonClass = 'modal-btn-confirm';
                buttonStyle = 'background: linear-gradient(135deg, #2c6e49, #1e4d2f); color: white; border: none;';
                break;
            case 'cancel':
                buttonClass = 'modal-btn-cancel';
                buttonStyle = 'background: linear-gradient(135deg, #6c757d, #5a6268); color: white; border: none;';
                break;
            case 'danger':
                buttonClass = 'modal-btn-danger';
                buttonStyle = 'background: linear-gradient(135deg, #dc3545, #c82333); color: white; border: none;';
                break;
            default:
                buttonClass = 'modal-btn-default';
                buttonStyle = 'background: linear-gradient(135deg, #2c6e49, #1e4d2f); color: white; border: none;';
        }

        const button = document.createElement('button');
        button.textContent = text;
        button.className = `modal-btn ${buttonClass}`;
        button.style.cssText = `
            padding: 8px 20px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
            ${buttonStyle}
        `;

        button.onclick = () => {
            if (onClick) onClick();
        };

        button.onmouseenter = () => {
            button.style.transform = 'translateY(-2px)';
            button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
        };

        button.onmouseleave = () => {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = 'none';
        };

        return button;
    }

    // Экранирование HTML
    static escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Добавляем CSS анимации
const modalStyles = document.createElement('style');
modalStyles.textContent = `
    @keyframes modalFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes modalSlideUp {
        from { transform: translateY(50px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .modal-medium { max-width: 600px; }
    .modal-small { max-width: 400px; }
    .modal-large { max-width: 800px; }
    .modal-full { max-width: 95%; height: 95%; }
    
    .modal-body::-webkit-scrollbar {
        width: 8px;
    }
    
    .modal-body::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 10px;
    }
    
    .modal-body::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, #2c6e49, #1e4d2f);
        border-radius: 10px;
    }
    
    .modal-body::-webkit-scrollbar-thumb:hover {
        background: #ffd700;
    }
`;
document.head.appendChild(modalStyles);

// Делаем класс глобальным
window.ModalView = ModalView;