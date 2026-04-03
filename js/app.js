/**
 * app.js - Главный файл приложения
 * MVC архитектура: инициализация моделей, представлений и контроллеров
 * Версия: 2.0.0
 */

console.log('🚀 Запуск приложения в MVC архитектуре...');

// Создаем глобальный объект для хранения экземпляров
window.App = {
    // Модели
    dbManager: null,
    userModel: null,
    productModel: null,
    orderModel: null,
    messageModel: null,

    // Контроллеры
    authController: null,
    cartController: null,
    productController: null,
    orderController: null,
    messageController: null,
    adminController: null,

    // Состояние
    isInitialized: false,
    initError: null
};

// Функция инициализации приложения
async function initApp() {
    try {
        console.log('📦 Шаг 1: Инициализация DBManager...');

        // 1. Инициализация DBManager
        App.dbManager = new DBManager();
        await App.dbManager.init();
        console.log('✅ DBManager инициализирован');

        // 2. Инициализация моделей
        console.log('📦 Шаг 2: Инициализация моделей...');
        App.userModel = new UserModel(App.dbManager);
        App.productModel = new ProductModel(App.dbManager);
        App.orderModel = new OrderModel(App.dbManager);
        App.messageModel = new MessageModel(App.dbManager);
        console.log('✅ Модели инициализированы');

        // 3. Загрузка данных
        console.log('📦 Шаг 3: Загрузка данных из БД...');
        await Promise.all([
            App.productModel.loadProducts(),
            App.orderModel.loadOrders(),
            App.messageModel.loadMessages()
        ]);
        console.log(`✅ Данные загружены: товаров=${App.productModel.getProducts().length}, заказов=${App.orderModel.getOrders().length}, сообщений=${App.messageModel.getMessages().length}`);

        // 4. Инициализация контроллеров
        console.log('📦 Шаг 4: Инициализация контроллеров...');
        App.authController = new AuthController(App.userModel);
        App.cartController = new CartController(App.userModel, App.orderModel);
        App.productController = new ProductController(App.productModel, App.userModel);
        App.orderController = new OrderController(App.orderModel, App.userModel);
        App.messageController = new MessageController(App.messageModel, App.userModel);
        console.log('✅ Контроллеры инициализированы');

        // 5. Инициализация админ-контроллера (только если на странице админки)
        if (window.location.pathname.includes('db-viewer.html')) {
            console.log('📦 Шаг 5: Инициализация AdminController...');
            App.adminController = new AdminController(
                App.userModel,
                App.productModel,
                App.orderModel,
                App.messageModel
            );
            console.log('✅ AdminController инициализирован');
        }

        // 6. Настройка обработчиков для страницы контактов
        if (window.location.pathname.includes('contacts.html')) {
            console.log('📦 Шаг 6: Настройка формы контактов...');
            setupContactForm();
        }

        // 7. Настройка обработчиков для страницы товаров
        if (window.location.pathname.includes('characteristics.html')) {
            console.log('📦 Шаг 7: Настройка страницы товаров...');
            setupProductsPage();
        }

        // 8. Настройка обработчиков для страницы корзины
        if (window.location.pathname.includes('cart.html')) {
            console.log('📦 Шаг 8: Отображение корзины...');
            setTimeout(() => {
                if (App.cartController) {
                    App.cartController.displayCart();
                }
            }, 100);
        }

        // 9. Настройка автообновления
        console.log('📦 Шаг 9: Настройка автообновления...');
        setupAutoRefresh();

        // 10. Добавление глобальных стилей для модальных окон
        addGlobalStyles();

        App.isInitialized = true;
        console.log('🎉 Приложение полностью инициализировано!');

        // Показываем приветственное уведомление (если пользователь авторизован)
        const currentUser = App.userModel.getCurrentUser();
        if (currentUser && !window.location.pathname.includes('db-viewer.html')) {
            setTimeout(() => {
                ModalView.showToast(`Добро пожаловать, ${currentUser.name}! 🐾`, 'success');
            }, 500);
        }

    } catch (error) {
        console.error('❌ Ошибка инициализации приложения:', error);
        App.initError = error.message;
        App.isInitialized = false;

        // Показываем ошибку пользователю
        ModalView.showToast('Ошибка загрузки приложения: ' + error.message, 'error', 5000);

        // Отображаем ошибку на странице
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 3px solid #dc3545;
            border-radius: 12px;
            padding: 20px;
            max-width: 400px;
            text-align: center;
            z-index: 99999;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        `;
        errorDiv.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 15px;">❌</div>
            <h3 style="color: #dc3545; margin-bottom: 10px;">Ошибка загрузки</h3>
            <p style="color: #666; margin-bottom: 15px;">${error.message}</p>
            <button onclick="location.reload()" class="button">Перезагрузить</button>
        `;
        document.body.appendChild(errorDiv);
    }
}

// Настройка формы контактов
function setupContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    // Убираем старый обработчик, если есть
    form.onsubmit = null;

    // Добавляем новый обработчик
    form.onsubmit = async (event) => {
        event.preventDefault();

        const nameInput = document.getElementById('contactName');
        const emailInput = document.getElementById('contactEmail');
        const phoneInput = document.getElementById('contactPhone');
        const messageInput = document.getElementById('contactMessage');
        const submitBtn = form.querySelector('button[type="submit"]');

        const name = nameInput?.value.trim() || '';
        const email = emailInput?.value.trim() || '';
        const phone = phoneInput?.value.trim() || '';
        const message = messageInput?.value.trim() || '';

        // Валидация
        if (!name) {
            ModalView.showToast('Укажите ваше имя', 'error');
            nameInput?.focus();
            return false;
        }

        if (!email) {
            ModalView.showToast('Укажите email', 'error');
            emailInput?.focus();
            return false;
        }

        if (!Helpers.validateEmail(email)) {
            ModalView.showToast('Введите корректный email', 'error');
            emailInput?.focus();
            return false;
        }

        if (!message) {
            ModalView.showToast('Введите сообщение', 'error');
            messageInput?.focus();
            return false;
        }

        if (message.length < 10) {
            ModalView.showToast('Сообщение должно содержать минимум 10 символов', 'error');
            messageInput?.focus();
            return false;
        }

        if (phone && !Helpers.validatePhone(phone)) {
            ModalView.showToast('Введите корректный номер телефона', 'error');
            phoneInput?.focus();
            return false;
        }

        // Блокируем кнопку
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Отправка...';
        }

        try {
            // Отправляем сообщение
            await App.messageModel.sendMessage({ name, email, phone, message });

            // Показываем успех
            ModalView.showToast('Сообщение отправлено! Мы свяжемся с вами.', 'success');

            // Очищаем форму
            if (nameInput) nameInput.value = '';
            if (emailInput) emailInput.value = '';
            if (phoneInput) phoneInput.value = '';
            if (messageInput) messageInput.value = '';

            // Показываем сообщение об успехе на странице
            const successDiv = document.getElementById('formSuccess');
            if (successDiv) {
                successDiv.style.display = 'block';
                successDiv.innerHTML = '✅ Спасибо за обращение! Мы свяжемся с вами в ближайшее время.';
                setTimeout(() => {
                    successDiv.style.display = 'none';
                }, 5000);
            }

        } catch (error) {
            console.error('Ошибка отправки:', error);
            ModalView.showToast('Ошибка: ' + error.message, 'error');

            const errorDiv = document.getElementById('formError');
            if (errorDiv) {
                errorDiv.style.display = 'block';
                errorDiv.innerHTML = '❌ ' + error.message;
                setTimeout(() => {
                    errorDiv.style.display = 'none';
                }, 5000);
            }
        } finally {
            // Разблокируем кнопку
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Отправить';
            }
        }

        return false;
    };
}

// Настройка страницы товаров
function setupProductsPage() {
    // Ждем загрузки DOM
    setTimeout(() => {
        // Обновляем отображение товаров
        if (App.productController) {
            App.productController.renderProducts();
        }

        // Добавляем кнопку обновления, если её нет
        const refreshBtn = document.querySelector('.refresh-prices-btn');
        if (!refreshBtn) {
            const h2 = document.querySelector('section h2');
            if (h2) {
                const btn = document.createElement('button');
                btn.className = 'button refresh-prices-btn';
                btn.style.cssText = 'padding: 8px 15px; font-size: 14px; margin-left: 15px;';
                btn.innerHTML = '🔄 Обновить цены';
                btn.onclick = () => App.productController?.refreshPrices();
                h2.appendChild(btn);
            }
        }
    }, 200);
}

// Автообновление данных
function setupAutoRefresh() {
    // Слушаем обновления из других вкладок
    window.addEventListener('storage', (e) => {
        if (e.key === 'db_update_products') {
            console.log('🔄 Получено обновление товаров');
            App.productModel.loadProducts().then(() => {
                if (window.location.pathname.includes('characteristics.html') && App.productController) {
                    App.productController.renderProducts();
                }
                if (window.location.pathname.includes('db-viewer.html') && App.adminController) {
                    App.adminController.loadProducts();
                    App.adminController.updateStats();
                }
            });
        } else if (e.key === 'db_update_orders') {
            console.log('🔄 Получено обновление заказов');
            App.orderModel.loadOrders().then(() => {
                if (window.location.pathname.includes('db-viewer.html') && App.adminController) {
                    App.adminController.loadOrders();
                    App.adminController.updateStats();
                }
            });
        } else if (e.key === 'db_update_messages') {
            console.log('🔄 Получено обновление сообщений');
            App.messageModel.loadMessages().then(() => {
                if (window.location.pathname.includes('db-viewer.html') && App.adminController) {
                    App.adminController.loadMessages();
                    App.adminController.updateStats();
                }
            });
        }
    });

    // Периодическое обновление (только для страницы товаров)
    if (window.location.pathname.includes('characteristics.html')) {
        setInterval(async () => {
            await App.productModel.loadProducts();
            if (App.productController) {
                App.productController.renderProducts();
            }
        }, 30000); // Каждые 30 секунд
    }

    // Периодическое обновление для админ-панели
    if (window.location.pathname.includes('db-viewer.html')) {
        setInterval(async () => {
            if (App.adminController) {
                await Promise.all([
                    App.productModel.loadProducts(),
                    App.orderModel.loadOrders(),
                    App.messageModel.loadMessages()
                ]);
                App.adminController.loadProducts();
                App.adminController.loadOrders();
                App.adminController.loadMessages();
                App.adminController.updateStats();
            }
        }, 60000); // Каждую минуту
    }
}

// Добавление глобальных стилей
function addGlobalStyles() {
    const styleId = 'app-global-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        /* Анимации для уведомлений */
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        /* Стили для скроллбара */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        
        ::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #2c6e49, #1e4d2f);
            border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
            background: #ffd700;
        }
        
        /* Улучшенные кнопки */
        .button:active {
            transform: scale(0.98);
        }
        
        /* Плавные переходы */
        * {
            transition: all 0.2s ease;
        }
        
        /* Фокус на полях ввода */
        input:focus, textarea:focus, select:focus {
            outline: none;
            border-color: #2c6e49;
            box-shadow: 0 0 0 3px rgba(44, 110, 73, 0.1);
        }
    `;
    document.head.appendChild(style);
}

// Делаем глобальные функции для обратной совместимости со старым кодом
window.addToCart = (name, price) => {
    if (App.cartController) {
        App.cartController.addToCart(name, price);
    } else {
        ModalView.showToast('Корзина не инициализирована', 'error');
    }
};

window.refreshProductPrices = () => {
    if (App.productController) {
        App.productController.refreshPrices();
    }
};

window.goToCart = () => {
    window.location.href = 'cart.html';
};

window.showNotification = (message, type = 'success') => {
    ModalView.showToast(message, type);
};

// Экспорт функций для использования в консоли (для отладки)
if (typeof window !== 'undefined') {
    window.debugApp = () => {
        console.log('=== DEBUG INFO ===');
        console.log('App initialized:', App.isInitialized);
        console.log('Current user:', App.userModel?.getCurrentUser());
        console.log('Products count:', App.productModel?.getProducts().length);
        console.log('Orders count:', App.orderModel?.getOrders().length);
        console.log('Messages count:', App.messageModel?.getMessages().length);
        console.log('==================');
    };
}

// Запуск приложения после загрузки DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Обработка ошибок
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    ModalView.showToast('Произошла ошибка: ' + (event.reason?.message || 'Неизвестная ошибка'), 'error');
});

window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    if (event.error) {
        ModalView.showToast('Ошибка: ' + event.error.message, 'error');
    }
});