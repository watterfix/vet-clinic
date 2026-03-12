// Делаем функции глобальными для доступа из других скриптов
window.showNotification = showNotification;
window.showStyledAlert = showStyledAlert;
// Хранилище данных
let users = JSON.parse(localStorage.getItem('users')) || {};
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let products = JSON.parse(localStorage.getItem('products')) || {};

// Флаг для отслеживания инициализации
let isInitialized = false;

// Функции валидации
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

function validatePhone(phone) {
    // Поддерживаемые форматы: +7 (999) 123-45-67, 89991234567, 222-22-22 и т.д.
    const re = /^(\+7|8)?[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$|^\d{2,3}[\s\-]?\d{2}[\s\-]?\d{2}$/;
    return phone === '' || re.test(phone.trim());
}

function validateName(name) {
    const re = /^[а-яА-Яa-zA-Z\s\-]{2,30}$/;
    return re.test(name.trim());
}

function validateAddress(address) {
    // Проверка адреса: минимум 10 символов, не только пробелы
    return address.trim().length >= 10;
}

function validateMessage(message) {
    return message.trim().length >= 10 && message.trim().length <= 1000;
}

function validateContactForm(event) {
    event.preventDefault();

    // Очищаем предыдущие ошибки
    clearContactErrors();

    let isValid = true;

    // Получаем значения полей
    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const phone = document.getElementById('contactPhone').value;
    const message = document.getElementById('contactMessage').value;

    // Валидация имени
    if (!validateName(name)) {
        showContactError('nameError', 'Имя должно содержать от 2 до 30 символов (буквы, пробелы и дефисы)');
        isValid = false;
    }

    // Валидация email
    if (!validateEmail(email)) {
        showContactError('emailError', 'Введите корректный email (например: name@domain.ru)');
        isValid = false;
    }

    // Валидация телефона (если заполнен)
    if (phone && !validatePhone(phone)) {
        showContactError('phoneError', 'Введите корректный номер телефона');
        isValid = false;
    }

    // Валидация сообщения
    if (!validateMessage(message)) {
        showContactError('messageError', 'Сообщение должно содержать от 10 до 1000 символов');
        isValid = false;
    }

    // Если все поля валидны, отправляем форму
    if (isValid) {
        // Сохраняем сообщение в локальное хранилище для истории
        saveContactMessage(name, email, phone, message);

        document.getElementById('contactForm').reset();
        showContactSuccess('Спасибо за обращение! Мы свяжемся с вами в ближайшее время.');
        showNotification('Сообщение отправлено!', 'success');
    }

    return false;
}

// Сохранение сообщения из формы контактов
function saveContactMessage(name, email, phone, message) {
    const messages = JSON.parse(localStorage.getItem('contactMessages')) || [];
    messages.push({
        id: Date.now(),
        name: name,
        email: email,
        phone: phone || 'не указан',
        message: message,
        date: new Date().toISOString(),
        status: 'new'
    });
    localStorage.setItem('contactMessages', JSON.stringify(messages));

    // Сохраняем в файл базы данных
    if (window.DB_MANAGER) {
        DB_MANAGER.exportDatabase();
    }
}

function clearContactErrors() {
    const nameError = document.getElementById('nameError');
    const emailError = document.getElementById('emailError');
    const phoneError = document.getElementById('phoneError');
    const messageError = document.getElementById('messageError');
    const formSuccess = document.getElementById('formSuccess');

    if (nameError) nameError.textContent = '';
    if (emailError) emailError.textContent = '';
    if (phoneError) phoneError.textContent = '';
    if (messageError) messageError.textContent = '';
    if (formSuccess) formSuccess.style.display = 'none';
}

function showContactError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
    }
}

function showContactSuccess(message) {
    const successDiv = document.getElementById('formSuccess');
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.style.display = 'block';

        // Скрываем через 5 секунд
        setTimeout(() => {
            successDiv.style.display = 'none';
        }, 5000);
    }
}

// Инициализация товаров при первом запуске
function initProducts() {
    if (Object.keys(products).length === 0) {
        products = {
            // Существующие товары
            food1: { name: 'Royal Canin (для кошек)', price: 1200, category: 'food' },
            food2: { name: 'Royal Canin (для собак)', price: 1300, category: 'food' },
            food3: { name: 'Hill\'s (лечебный)', price: 1500, category: 'food' },
            food4: { name: 'Purina Pro Plan', price: 1100, category: 'food' },
            food5: { name: 'Acana (для собак)', price: 1400, category: 'food' },
            food6: { name: 'Orijen (для собак)', price: 1600, category: 'food' },
            food7: { name: 'Pedigree (для собак)', price: 900, category: 'food' },
            med1: { name: 'Антибиотики', price: 500, category: 'medicine' },
            med2: { name: 'Противоглистные', price: 300, category: 'medicine' },
            med3: { name: 'Витамины', price: 450, category: 'medicine' },
            med4: { name: 'Обезболивающие', price: 400, category: 'medicine' },
            med5: { name: 'Капли от блох и клещей', price: 600, category: 'medicine' },
            med6: { name: 'Ошейник от паразитов', price: 800, category: 'medicine' },
            med7: { name: 'Спрей от клещей', price: 550, category: 'medicine' },
            med8: { name: 'Хондропротекторы', price: 700, category: 'medicine' },
            acc1: { name: 'Ошейники', price: 350, category: 'accessories' },
            acc2: { name: 'Миски', price: 250, category: 'accessories' },
            acc3: { name: 'Лежаки', price: 1200, category: 'accessories' },
            acc4: { name: 'Переноски', price: 2000, category: 'accessories' },
            acc5: { name: 'Поводок-рулетка', price: 450, category: 'accessories' },
            acc6: { name: 'Шлейка для собак', price: 850, category: 'accessories' },
            acc7: { name: 'Игрушка-канат', price: 300, category: 'accessories' },
            acc8: { name: 'Мяч для собак', price: 500, category: 'accessories' },
            acc9: { name: 'Домик-будка', price: 1500, category: 'accessories' },
            hyg1: { name: 'Шампуни', price: 450, category: 'hygiene' },
            hyg2: { name: 'Зубные пасты', price: 300, category: 'hygiene' },
            hyg3: { name: 'Когтерезки', price: 400, category: 'hygiene' },
            hyg4: { name: 'Когтерезка для крупных пород', price: 600, category: 'hygiene' },
            hyg5: { name: 'Расческа-пуходерка', price: 350, category: 'hygiene' },
            hyg6: { name: 'Фурминатор', price: 500, category: 'hygiene' },
            hyg7: { name: 'Салфетки для лап', price: 280, category: 'hygiene' },
            hyg8: { name: 'Сухой шампунь', price: 750, category: 'hygiene' }
        };
        localStorage.setItem('products', JSON.stringify(products));
    }
}

// Создание admin аккаунта при первом запуске
function initAdmin() {
    if (!users['admin@vetclinic.ru']) {
        users['admin@vetclinic.ru'] = {
            name: 'Admin',
            password: 'admin123',
            role: 'admin',
            registered: new Date().toISOString()
        };
        localStorage.setItem('users', JSON.stringify(users));
    }

    // Добавляем тестового пользователя если нет
    if (!users['user@example.com']) {
        users['user@example.com'] = {
            name: 'Иван Петров',
            password: 'user123',
            role: 'user',
            registered: new Date().toISOString()
        };
        localStorage.setItem('users', JSON.stringify(users));
    }
}

// Показать уведомление
function showNotification(message, type = 'success') {
    // Удаляем предыдущее уведомление если есть
    const oldNotification = document.querySelector('.notification');
    if (oldNotification) {
        oldNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.backgroundColor = type === 'success' ? '#2c6e49' : '#dc3545';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Создать блок авторизации
function createAuthCorner() {
    if (!document.getElementById('authCorner')) {
        const authCorner = document.createElement('div');
        authCorner.id = 'authCorner';
        authCorner.className = 'auth-corner';
        document.body.prepend(authCorner);
    }
}

// Создать кнопку корзины (только для страницы товаров)
function createCartButton() {
    const isCharacteristicsPage = window.location.pathname.includes('characteristics.html');
    if (isCharacteristicsPage && !document.getElementById('cartButton')) {
        const cartButton = document.createElement('div');
        cartButton.id = 'cartButton';
        cartButton.className = 'cart-button';
        cartButton.innerHTML = `
            <button onclick="goToCart()" class="cart-btn">
                🛒 Корзина <span id="cartCount" class="cart-count">0</span>
            </button>
        `;
        document.body.appendChild(cartButton);
    }
}

// Обновить интерфейс в зависимости от статуса пользователя
function updateUI() {
    console.log('Обновление интерфейса, пользователь:', currentUser);

    createAuthCorner();
    createCartButton();

    const authCorner = document.getElementById('authCorner');
    const isCharacteristicsPage = window.location.pathname.includes('characteristics.html');
    const isCartPage = window.location.pathname.includes('cart.html');
    const isAdminPage = window.location.pathname.includes('db-viewer.html');

    if (currentUser) {
        // Пользователь авторизован
        let adminLink = '';
        if (currentUser.role === 'admin' && !isAdminPage) {
            adminLink = `<a href="db-viewer.html" class="admin-link" style="margin-left: 10px; color: #ffd700;">📁 Управление БД</a>`;
        }

        authCorner.innerHTML = `
            <div class="user-info-corner">
                <span>👤 ${currentUser.name} ${currentUser.role === 'admin' ? '👑' : ''}</span>
                ${adminLink}
                <button onclick="logout()" class="button-small">Выйти</button>
            </div>
        `;

        // Для страницы товаров
        if (isCharacteristicsPage) {
            if (currentUser.role === 'admin') {
                addPriceEditButtons();
            } else {
                restoreBuyButtons();
            }
        }

        // Обновляем счетчик корзины
        updateCartCount();
    } else {
        // Пользователь не авторизован
        authCorner.innerHTML = `
            <div class="auth-buttons-corner">
                <button onclick="openAuthModal('login')" class="button-small">Вход</button>
                <button onclick="openAuthModal('register')" class="button-small">Регистрация</button>
            </div>
        `;

        // Для страницы товаров
        if (isCharacteristicsPage) {
            restoreBuyButtons();
        }

        // Обновляем счетчик корзины
        updateCartCount();
    }

    // Для страницы корзины
    if (isCartPage) {
        displayCart();
    }
}

// Обновить счетчик корзины
function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        cartCount.textContent = cart.length;
        cartCount.style.display = cart.length > 0 ? 'inline-block' : 'none';
    }
}

// Перейти в корзину
function goToCart() {
    window.location.href = 'cart.html';
}

// Генерация случайного номера заказа
function generateOrderNumber() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let orderNumber = '';

    // 2 буквы
    for (let i = 0; i < 2; i++) {
        orderNumber += letters.charAt(Math.floor(Math.random() * letters.length));
    }

    // 4 цифры
    for (let i = 0; i < 4; i++) {
        orderNumber += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }

    return orderNumber;
}

// Функция для показа стилизованного диалогового окна
function showStyledAlert(content) {
    // Создаем затемненный фон
    const overlay = document.createElement('div');
    overlay.className = 'custom-alert-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 3000;
        display: flex;
        justify-content: center;
        align-items: center;
        animation: fadeIn 0.3s ease;
    `;

    // Создаем само диалоговое окно
    const alertBox = document.createElement('div');
    alertBox.className = 'custom-alert';
    alertBox.style.cssText = `
        background-color: white;
        border-radius: 12px;
        padding: 30px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        position: relative;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        border: 3px solid #2c6e49;
        animation: slideUp 0.3s ease;
    `;

    // Добавляем кнопку закрытия
    const closeButton = document.createElement('span');
    closeButton.innerHTML = '&times;';
    closeButton.style.cssText = `
        position: absolute;
        top: 10px;
        right: 15px;
        font-size: 28px;
        cursor: pointer;
        color: #999;
        transition: color 0.3s;
        z-index: 10;
    `;
    closeButton.onmouseover = () => closeButton.style.color = '#333';
    closeButton.onmouseout = () => closeButton.style.color = '#999';
    closeButton.onclick = () => document.body.removeChild(overlay);

    // Добавляем содержимое
    alertBox.innerHTML = content;
    alertBox.appendChild(closeButton);
    overlay.appendChild(alertBox);
    document.body.appendChild(overlay);

    // Добавляем анимации
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideUp {
            from {
                transform: translateY(50px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);

    // Закрытие по клику на фон
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
        }
    });
}

// Отображение корзины на странице cart.html
function displayCart() {
    const cartContainer = document.getElementById('cartContainer');
    if (!cartContainer) return;

    if (!currentUser) {
        cartContainer.innerHTML = '<p class="cart-message">Необходимо войти в систему</p>';
        return;
    }

    if (currentUser.role === 'admin') {
        cartContainer.innerHTML = '<p class="cart-message">Администратор не может совершать покупки</p>';
        return;
    }

    if (cart.length === 0) {
        cartContainer.innerHTML = '<p class="cart-message">Корзина пуста</p>';
        return;
    }

    let html = '<div class="cart-items-list">';
    let total = 0;

    cart.forEach(item => {
        total += item.price;
        html += `
            <div class="cart-item-detailed">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p class="cart-item-price">${item.price} руб.</p>
                </div>
                <button onclick="removeFromCart(${item.id})" class="button remove-btn">Удалить</button>
            </div>
        `;
    });

    html += '</div>';
    html += `<div class="cart-total-detailed">Итого: ${total} руб.</div>`;

    // Определяем, будет ли бесплатная доставка
    const freeDelivery = total >= 3000;

    // Способы получения заказа
    html += `
        <div class="delivery-methods">
            <h3>Способ получения</h3>
            
            <div class="delivery-method">
                <div class="delivery-option">
                    <input type="radio" name="deliveryMethod" id="pickupMethod" value="pickup" checked onchange="toggleDeliveryForm()">
                    <label for="pickupMethod"><strong>Самовывоз</strong> (бесплатно)</label>
                </div>
                <div id="pickupInfo" class="delivery-info">
                    <p>📍 Адрес самовывоза: <strong>г. Воронеж, ул. Ветеринарная, д. 15</strong></p>
                    <p>🕒 Режим работы: круглосуточно</p>
                    <p>📞 Телефон для справок: 222-22-22</p>
                </div>
            </div>
            
            <div class="delivery-method">
                <div class="delivery-option">
                    <input type="radio" name="deliveryMethod" id="deliveryMethod" value="delivery" onchange="toggleDeliveryForm()">
                    <label for="deliveryMethod"><strong>Доставка</strong> ${freeDelivery ? '<span class="free-delivery">(бесплатно при заказе от 3000 руб.)</span>' : '(300 руб.)'}</label>
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
                    <div class="form-group">
                        <label for="deliveryComment">Комментарий курьеру:</label>
                        <textarea id="deliveryComment" placeholder="Домофон, этаж, особенности проезда" class="delivery-input" rows="2"></textarea>
                    </div>
                </div>
            </div>
            
            <div class="payment-info">
                <h3>Оплата</h3>
                <p class="payment-method">💳 Оплата после получения товара</p>
                <p class="payment-note">Вы сможете оплатить заказ наличными или картой при получении</p>
            </div>
            
            <button onclick="processOrder()" class="button checkout-btn">Оформить заказ</button>
        </div>
    `;

    cartContainer.innerHTML = html;
}

// Переключение между способами доставки
function toggleDeliveryForm() {
    const pickupMethod = document.getElementById('pickupMethod');
    const deliveryForm = document.getElementById('deliveryForm');

    if (pickupMethod && pickupMethod.checked) {
        deliveryForm.style.display = 'none';
    } else {
        deliveryForm.style.display = 'block';
    }
}

// Обработка заказа с сохранением в файл
function processOrder() {
    if (cart.length === 0) {
        showNotification('Корзина пуста!', 'error');
        return;
    }

    const pickupMethod = document.getElementById('pickupMethod');
    const deliveryMethod = document.getElementById('deliveryMethod');

    let deliveryValue = 'pickup';
    let deliveryCost = 0;

    const total = cart.reduce((sum, item) => sum + item.price, 0);
    const freeDelivery = total >= 3000;

    if (deliveryMethod && deliveryMethod.checked) {
        deliveryValue = 'delivery';
        deliveryCost = freeDelivery ? 0 : 300;

        const addressError = document.getElementById('deliveryAddressError');
        const phoneError = document.getElementById('deliveryPhoneError');

        if (addressError) addressError.textContent = '';
        if (phoneError) phoneError.textContent = '';

        const address = document.getElementById('deliveryAddress')?.value;
        const phone = document.getElementById('deliveryPhone')?.value;

        let isValid = true;

        if (!address || !validateAddress(address)) {
            if (addressError) addressError.textContent = 'Введите корректный адрес (минимум 10 символов)';
            isValid = false;
        }

        if (!phone) {
            if (phoneError) phoneError.textContent = 'Введите номер телефона';
            isValid = false;
        } else if (!validatePhone(phone)) {
            if (phoneError) phoneError.textContent = 'Введите корректный номер телефона';
            isValid = false;
        }

        if (!isValid) {
            return;
        }
    }

    const finalTotal = total + deliveryCost;
    const orderNumber = generateOrderNumber();

    // Создаем заказ
    const order = {
        id: Date.now(),
        orderNumber: orderNumber,
        user: currentUser.email,
        userName: currentUser.name,
        items: [...cart],
        delivery: deliveryValue,
        deliveryCost: deliveryCost,
        freeDelivery: freeDelivery,
        total: finalTotal,
        paymentMethod: 'postpaid',
        paymentNote: 'Оплата после получения',
        date: new Date().toISOString()
    };

    if (deliveryValue === 'pickup') {
        order.pickupAddress = 'г. Воронеж, ул. Ветеринарная, д. 15';
        order.pickupPhone = '222-22-22';
    } else {
        order.deliveryAddress = document.getElementById('deliveryAddress').value;
        order.deliveryPhone = document.getElementById('deliveryPhone').value;
        order.deliveryComment = document.getElementById('deliveryComment').value || '';
    }

    // Сохраняем заказ
    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));

    // Сохраняем в файл базы данных
    if (window.DB_MANAGER) {
        DB_MANAGER.exportDatabase();
    }

    // Очищаем корзину
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));

    // Показываем подтверждение
    let deliveryInfo = '';
    if (deliveryValue === 'pickup') {
        deliveryInfo = `
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: left;">
                <p><strong>📍 Адрес самовывоза:</strong> г. Воронеж, ул. Ветеринарная, д. 15</p>
                <p><strong>🕒 Режим работы:</strong> круглосуточно</p>
                <p><strong>📞 Телефон:</strong> 222-22-22</p>
            </div>
        `;
    } else {
        deliveryInfo = `
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: left;">
                <p><strong>🚚 Адрес доставки:</strong> ${order.deliveryAddress}</p>
                <p><strong>📞 Телефон:</strong> ${order.deliveryPhone}</p>
                ${order.deliveryComment ? `<p><strong>💬 Комментарий:</strong> ${order.deliveryComment}</p>` : ''}
            </div>
        `;
    }

    showStyledAlert(`
        <div style="text-align: center;">
            <div style="font-size: 48px; margin-bottom: 15px;">🎉</div>
            <h2 style="color: #2c6e49; margin-bottom: 15px;">ЗАКАЗ ОФОРМЛЕН!</h2>
            <div style="background: linear-gradient(135deg, #2c6e49, #1e4d2f); color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <strong style="font-size: 24px;">#${orderNumber}</strong>
            </div>
            
            ${deliveryInfo}
            
            <div style="background-color: #e8f4e8; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: #2c6e49; margin-bottom: 10px;">Ваш заказ:</h3>
                ${order.items.map(item => `
                    <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dashed #2c6e49;">
                        <span>${item.name}</span>
                        <span style="font-weight: bold;">${item.price} руб.</span>
                    </div>
                `).join('')}
                <div style="display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 2px solid #2c6e49; font-weight: bold;">
                    <span>ИТОГО:</span>
                    <span>${finalTotal} руб.</span>
                </div>
            </div>
            
            <p>✅ Заказ сохранен в базе данных</p>
        </div>
    `);

    displayCart();
    updateCartCount();
    broadcastUpdate();
}

// Восстановить кнопки покупки
function restoreBuyButtons() {
    const tables = document.querySelectorAll('.price-list');
    tables.forEach(table => {
        const rows = table.querySelectorAll('tr[data-id]');
        rows.forEach(row => {
            const productId = row.getAttribute('data-id');
            const productNameCell = row.querySelector('td:first-child');
            const productName = productNameCell ? productNameCell.textContent : '';
            const price = parseInt(row.getAttribute('data-price'));

            const actionCell = row.querySelector('td:last-child');
            if (actionCell) {
                const escapedName = productName.replace(/'/g, "\\'");
                actionCell.innerHTML = `<button onclick="addToCart('${escapedName}', ${price})" class="button">Купить</button>`;
            }
        });
    });
}

// Синхронизация состояния между вкладками
function syncState() {
    console.log('Синхронизация состояния...');

    const newUser = JSON.parse(localStorage.getItem('currentUser'));
    const newCart = JSON.parse(localStorage.getItem('cart')) || [];

    let changed = false;

    if (JSON.stringify(newUser) !== JSON.stringify(currentUser)) {
        console.log('Состояние пользователя изменилось');
        currentUser = newUser;
        changed = true;
    }

    if (JSON.stringify(newCart) !== JSON.stringify(cart)) {
        console.log('Корзина изменилась');
        cart = newCart;
        changed = true;
    }

    if (changed) {
        updateUI();
        updateCartCount();

        const isCartPage = window.location.pathname.includes('cart.html');
        if (isCartPage) {
            displayCart();
        }
    }
}

// Принудительно обновить состояние на всех страницах
function broadcastUpdate() {
    localStorage.setItem('updateTimestamp', Date.now().toString());
}

// Открыть модальное окно авторизации
function openAuthModal(tab = 'login') {
    const modal = document.getElementById('authModal');
    if (!modal) {
        createAuthModal();
    }

    document.getElementById('authModal').classList.add('active');
    switchAuthTab(tab);
}

// Закрыть модальное окно авторизации
function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Переключение вкладок в модальном окне
function switchAuthTab(tab) {
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginTab && registerTab && loginForm && registerForm) {
        if (tab === 'login') {
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
            loginForm.classList.add('active');
            registerForm.classList.remove('active');
        } else {
            registerTab.classList.add('active');
            loginTab.classList.remove('active');
            registerForm.classList.add('active');
            loginForm.classList.remove('active');
        }
    }
}

// Создание модального окна авторизации
function createAuthModal() {
    if (document.getElementById('authModal')) return;

    const modal = document.createElement('div');
    modal.id = 'authModal';
    modal.className = 'auth-modal';
    modal.innerHTML = `
        <div class="auth-modal-content">
            <span class="auth-modal-close" onclick="closeAuthModal()">&times;</span>
            
            <div class="auth-tabs">
                <div id="loginTab" class="auth-tab active" onclick="switchAuthTab('login')">Вход</div>
                <div id="registerTab" class="auth-tab" onclick="switchAuthTab('register')">Регистрация</div>
            </div>
            
            <div id="loginForm" class="auth-form active">
                <form onsubmit="login(event)">
                    <p>Email:</p>
                    <input type="email" id="loginEmail" placeholder="Email" required>
                    <p>Пароль:</p>
                    <input type="password" id="loginPassword" placeholder="Пароль" required>
                    <button type="submit" class="button" style="width: 100%;">Войти</button>
                </form>
            </div>
            
            <div id="registerForm" class="auth-form">
                <form onsubmit="register(event)">
                    <p>Имя:</p>
                    <input type="text" id="regName" placeholder="Ваше имя" required>
                    <p>Email:</p>
                    <input type="email" id="regEmail" placeholder="Email" required>
                    <p>Пароль:</p>
                    <input type="password" id="regPassword" placeholder="Пароль" required>
                    <button type="submit" class="button" style="width: 100%;">Зарегистрироваться</button>
                </form>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// Добавить кнопки редактирования цен для админа
function addPriceEditButtons() {
    const tables = document.querySelectorAll('.price-list');
    tables.forEach(table => {
        const rows = table.querySelectorAll('tr[data-id]');
        rows.forEach(row => {
            const currentPrice = row.getAttribute('data-price');
            const productId = row.getAttribute('data-id');

            const actionCell = row.querySelector('td:last-child');
            if (actionCell) {
                actionCell.innerHTML = `
                    <div style="display: flex; gap: 5px;">
                        <input type="number" value="${currentPrice}" min="0" step="10" id="price-${productId}" style="width: 80px; padding: 5px; border: 1px solid #ddd; border-radius: 4px;">
                        <button onclick="updatePrice('${productId}')" class="button" style="padding: 5px 10px;">Изменить</button>
                    </div>
                `;
            }
        });
    });
}

// Обновить цену товара (только для админа)
function updatePrice(productId) {
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('Только администратор может изменять цены!', 'error');
        return;
    }

    const newPrice = document.getElementById(`price-${productId}`).value;
    if (newPrice && newPrice > 0) {
        // Обновляем в памяти
        if (products[productId]) {
            products[productId].price = parseInt(newPrice);
            localStorage.setItem('products', JSON.stringify(products));
        }

        // Обновляем в таблице
        const row = document.querySelector(`tr[data-id="${productId}"]`);
        if (row) {
            row.setAttribute('data-price', newPrice);
            const priceCell = row.querySelector('.price');
            if (priceCell) {
                priceCell.textContent = newPrice + ' руб.';
            }
        }

        // Сохраняем в файл базы данных
        if (window.DB_MANAGER) {
            DB_MANAGER.exportDatabase();
        }

        showNotification('Цена успешно обновлена!');
        broadcastUpdate();
    }
}

// Регистрация с валидацией и сохранением в файл
function register(event) {
    event.preventDefault();

    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    // Валидация
    if (!validateName(name)) {
        showNotification('Имя должно содержать от 2 до 30 символов (буквы, пробелы и дефисы)', 'error');
        return;
    }

    if (!validateEmail(email)) {
        showNotification('Введите корректный email адрес', 'error');
        return;
    }

    if (password.length < 6) {
        showNotification('Пароль должен содержать не менее 6 символов', 'error');
        return;
    }

    // Используем DB_MANAGER для добавления пользователя
    if (window.DB_MANAGER) {
        // Проверяем, существует ли уже пользователь
        const users = JSON.parse(localStorage.getItem('users')) || {};

        if (users[email]) {
            showNotification('Пользователь с таким email уже существует!', 'error');
            return;
        }

        // Добавляем через DB_MANAGER
        const result = DB_MANAGER.addUser({
            name: name,
            email: email,
            password: password,
            role: 'user'
        });

        if (result) {
            showNotification('Регистрация успешна! Теперь вы можете войти.', 'success');
            switchAuthTab('login');

            // Очищаем форму
            document.getElementById('regName').value = '';
            document.getElementById('regEmail').value = '';
            document.getElementById('regPassword').value = '';
        } else {
            showNotification('Ошибка при регистрации', 'error');
        }
    } else {
        // Fallback на старый метод
        let users = JSON.parse(localStorage.getItem('users')) || {};

        if (users[email]) {
            showNotification('Пользователь с таким email уже существует!', 'error');
            return;
        }

        users[email] = {
            name: name,
            password: password,
            role: 'user',
            registered: new Date().toISOString()
        };

        localStorage.setItem('users', JSON.stringify(users));

        showNotification('Регистрация успешна! Теперь вы можете войти.', 'success');
        switchAuthTab('login');

        document.getElementById('regName').value = '';
        document.getElementById('regEmail').value = '';
        document.getElementById('regPassword').value = '';
    }
}

// Исправленная функция входа
async function login(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    console.log('🔐 Попытка входа:', email);
    
    try {
        // Загружаем свежие данные с сервера
        await DB_MANAGER.loadDatabase();
        
        console.log('📦 Текущие пользователи:', DB_MANAGER.currentData.users);
        
        // Ищем пользователя
        const user = DB_MANAGER.currentData.users.find(u => u.email === email);
        
        if (user) {
            console.log('✅ Пользователь найден:', user);
            console.log('🔑 Введенный пароль:', password);
            console.log('🔑 Пароль в БД:', user.password);
            
            if (user.password === password) {
                currentUser = {
                    email: user.email,
                    name: user.name,
                    role: user.role
                };

                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                showNotification('Вход выполнен успешно!', 'success');

                closeAuthModal();
                updateUI();
            } else {
                console.log('❌ Пароль не совпадает');
                showNotification('Неверный пароль!', 'error');
            }
        } else {
            console.log('❌ Пользователь не найден');
            showNotification('Пользователь не найден!', 'error');
        }
    } catch (error) {
        console.error('❌ Ошибка при входе:', error);
        showNotification('Ошибка при входе', 'error');
    }
}

// Выход
function logout() {
    currentUser = null;
    cart = [];
    localStorage.removeItem('currentUser');
    localStorage.setItem('cart', JSON.stringify(cart));
    showNotification('Вы вышли из системы');
    updateUI();
    updateCartCount();
    broadcastUpdate();

    const isCartPage = window.location.pathname.includes('cart.html');
    if (isCartPage) {
        displayCart();
    }
}

// Добавить в корзину
function addToCart(productName, price) {
    if (!currentUser) {
        showNotification('Необходимо войти в систему!', 'error');
        openAuthModal('login');
        return;
    }

    if (currentUser.role === 'admin') {
        showNotification('Администратор не может совершать покупки!', 'error');
        return;
    }

    cart.push({
        name: productName,
        price: price,
        id: Date.now() + Math.random()
    });

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showNotification('Товар добавлен в корзину!');
    broadcastUpdate();
}

// Удалить из корзины
function removeFromCart(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showNotification('Товар удален из корзины');

    const isCartPage = window.location.pathname.includes('cart.html');
    if (isCartPage) {
        displayCart();
    }

    broadcastUpdate();
}

// Загрузка данных из файла базы данных
async function loadDatabaseFromFile() {
    try {
        // Пытаемся загрузить из db-manager если он есть
        if (window.DB_MANAGER) {
            const data = await DB_MANAGER.loadDatabase();
            if (data) {
                users = data.users || {};
                products = data.products || {};
                localStorage.setItem('users', JSON.stringify(users));
                localStorage.setItem('products', JSON.stringify(products));
                if (data.orders) {
                    localStorage.setItem('orders', JSON.stringify(data.orders));
                }
                console.log('Данные загружены из файла');
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки из файла:', error);
    }
}

// Основная инициализация
async function initialize() {
    if (isInitialized) return;
    isInitialized = true;

    console.log('Инициализация страницы...');

    // Сначала пробуем загрузить из файла
    await loadDatabaseFromFile();

    // Инициализируем продукты если их нет
    initProducts();

    // Инициализируем админа если его нет
    initAdmin();

    // Загружаем актуальные данные
    currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    cart = JSON.parse(localStorage.getItem('cart')) || [];
    users = JSON.parse(localStorage.getItem('users')) || {};
    products = JSON.parse(localStorage.getItem('products')) || {};

    // Восстанавливаем цены в таблицах
    if (Object.keys(products).length > 0) {
        Object.keys(products).forEach(productId => {
            const row = document.querySelector(`tr[data-id="${productId}"]`);
            if (row) {
                const priceCell = row.querySelector('.price');
                if (priceCell) {
                    priceCell.textContent = products[productId].price + ' руб.';
                    row.setAttribute('data-price', products[productId].price);
                }
            }
        });
    }

    createAuthModal();
    updateUI();
}

// Запуск после полной загрузки DOM
document.addEventListener('DOMContentLoaded', initialize);

// Слушаем изменения в localStorage
window.addEventListener('storage', function (e) {
    console.log('Изменение в localStorage:', e.key);

    if (e.key === 'currentUser' || e.key === 'cart' || e.key === 'updateTimestamp') {
        // Обновляем данные
        currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
        cart = JSON.parse(localStorage.getItem('cart')) || [];

        // Обновляем интерфейс
        updateUI();
        updateCartCount();

        const isCartPage = window.location.pathname.includes('cart.html');
        if (isCartPage) {
            displayCart();
        }
    }
});

// Периодическая проверка
setInterval(function () {
    const newUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    const newCart = JSON.parse(localStorage.getItem('cart')) || [];

    if (JSON.stringify(newUser) !== JSON.stringify(currentUser) ||
        JSON.stringify(newCart) !== JSON.stringify(cart)) {
        console.log('Обнаружены изменения при периодической проверке');
        currentUser = newUser;
        cart = newCart;
        updateUI();
        updateCartCount();

        const isCartPage = window.location.pathname.includes('cart.html');
        if (isCartPage) {
            displayCart();
        }
    }
}, 1000);

// При фокусе на вкладке
window.addEventListener('focus', function () {
    console.log('Вкладка получила фокус');
    currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    cart = JSON.parse(localStorage.getItem('cart')) || [];
    updateUI();
    updateCartCount();

    const isCartPage = window.location.pathname.includes('cart.html');
    if (isCartPage) {
        displayCart();
    }
});

// При возвращении на страницу
document.addEventListener('visibilitychange', function () {
    if (!document.hidden) {
        console.log('Страница стала видимой');
        currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
        cart = JSON.parse(localStorage.getItem('cart')) || [];
        updateUI();
        updateCartCount();

        const isCartPage = window.location.pathname.includes('cart.html');
        if (isCartPage) {
            displayCart();
        }
    }
});
