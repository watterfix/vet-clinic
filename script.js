const SCRIPT_VERSION = '4';

console.log('📜 script.js загружен (версия', SCRIPT_VERSION + ')');

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
    const re = /^(\+7|8)?[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$|^\d{2,3}[\s\-]?\d{2}[\s\-]?\d{2}$/;
    return phone === '' || re.test(phone.trim());
}

function validateName(name) {
    const re = /^[а-яА-Яa-zA-Z\s\-]{2,30}$/;
    return re.test(name.trim());
}

function validateAddress(address) {
    return address.trim().length >= 10;
}

function validateMessage(message) {
    return message.trim().length >= 10 && message.trim().length <= 1000;
}

function validateContactForm(event) {
    event.preventDefault();
    clearContactErrors();
    let isValid = true;

    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const phone = document.getElementById('contactPhone').value;
    const message = document.getElementById('contactMessage').value;

    if (!validateName(name)) {
        showContactError('nameError', 'Имя должно содержать от 2 до 30 символов (буквы, пробелы и дефисы)');
        isValid = false;
    }

    if (!validateEmail(email)) {
        showContactError('emailError', 'Введите корректный email (например: name@domain.ru)');
        isValid = false;
    }

    if (phone && !validatePhone(phone)) {
        showContactError('phoneError', 'Введите корректный номер телефона');
        isValid = false;
    }

    if (!validateMessage(message)) {
        showContactError('messageError', 'Сообщение должно содержать от 10 до 1000 символов');
        isValid = false;
    }

    if (isValid) {
        saveContactMessage(name, email, phone, message);
        document.getElementById('contactForm').reset();
        showContactSuccess('Спасибо за обращение! Мы свяжемся с вами в ближайшее время.');
        showNotification('Сообщение отправлено!', 'success');
    }

    return false;
}

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

    if (window.DB_MANAGER) {
        DB_MANAGER.saveToServer();
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
        setTimeout(() => {
            successDiv.style.display = 'none';
        }, 5000);
    }
}

function initProducts() {
    if (Object.keys(products).length === 0) {
        products = {
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

function showNotification(message, type = 'success') {
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

function createAuthCorner() {
    if (!document.getElementById('authCorner')) {
        const authCorner = document.createElement('div');
        authCorner.id = 'authCorner';
        authCorner.className = 'auth-corner';
        authCorner.style.cssText = 'position: fixed; top: 10px; left: 10px; z-index: 1000; max-width: 300px;';
        document.body.prepend(authCorner);
        console.log('✅ Блок авторизации создан');
    }
}

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

function updateUI() {
    console.log('Обновление интерфейса, пользователь:', currentUser);

    createAuthCorner();
    createCartButton();

    const authCorner = document.getElementById('authCorner');
    if (!authCorner) return;

    const isCharacteristicsPage = window.location.pathname.includes('characteristics.html');
    const isCartPage = window.location.pathname.includes('cart.html');
    const isAdminPage = window.location.pathname.includes('db-viewer.html');

    if (currentUser) {
        let adminLink = '';
        if (currentUser.role === 'admin' && !isAdminPage) {
            adminLink = `<a href="db-viewer.html" style="margin-left: 10px; color: #ffd700; text-decoration: none; font-size: 12px;">📁 Управление БД</a>`;
        }
        
        authCorner.innerHTML = `
            <div class="user-info-corner" style="background: linear-gradient(135deg, #2c6e49, #1e4d2f); color: white; padding: 8px 15px; border-radius: 30px; display: flex; align-items: center; gap: 10px; border: 2px solid #ffd700;">
                <div style="display: flex; flex-direction: column; gap: 2px;">
                    <span style="font-weight: bold;">${currentUser.name} ${currentUser.role === 'admin' ? '👑' : ''}</span>
                    <span style="font-size: 11px; color: #ffd700;">${currentUser.email}</span>
                </div>
                ${adminLink}
                <button onclick="logout()" style="background-color: #ffd700; color: #1e4d2f; border: none; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; cursor: pointer;">Выйти</button>
            </div>
        `;

        if (isCharacteristicsPage) {
            if (currentUser.role === 'admin') {
                addPriceEditButtons();
            } else {
                restoreBuyButtons();
            }
        }

        updateCartCount();
    } else {
        authCorner.innerHTML = `
            <div class="auth-buttons-corner" style="display: flex; gap: 8px; background-color: white; padding: 5px; border-radius: 40px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); border: 2px solid #2c6e49;">
                <button onclick="openAuthModal('login')" style="background-color: #2c6e49; color: white; border: none; padding: 6px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; cursor: pointer;">Вход</button>
                <button onclick="openAuthModal('register')" style="background-color: #2c6e49; color: white; border: none; padding: 6px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; cursor: pointer;">Регистрация</button>
            </div>
        `;

        if (isCharacteristicsPage) {
            restoreBuyButtons();
        }

        updateCartCount();
    }

    if (isCartPage) {
        displayCart();
    }
}

function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        cartCount.textContent = cart.length;
        cartCount.style.display = cart.length > 0 ? 'inline-block' : 'none';
    }
}

function goToCart() {
    window.location.href = 'cart.html';
}

function generateOrderNumber() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let orderNumber = '';

    for (let i = 0; i < 2; i++) {
        orderNumber += letters.charAt(Math.floor(Math.random() * letters.length));
    }

    for (let i = 0; i < 4; i++) {
        orderNumber += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }

    return orderNumber;
}

function showStyledAlert(content) {
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

    alertBox.innerHTML = content;
    alertBox.appendChild(closeButton);
    overlay.appendChild(alertBox);
    document.body.appendChild(overlay);

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

    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
        }
    });
}

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

    const freeDelivery = total >= 3000;

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

function toggleDeliveryForm() {
    const pickupMethod = document.getElementById('pickupMethod');
    const deliveryForm = document.getElementById('deliveryForm');

    if (pickupMethod && pickupMethod.checked) {
        deliveryForm.style.display = 'none';
    } else {
        deliveryForm.style.display = 'block';
    }
}

// ИСПРАВЛЕННАЯ ФУНКЦИЯ processOrder (без дублирования)
async function processOrder() {
    if (!currentUser) {
        showNotification('Необходимо войти в систему!', 'error');
        openAuthModal('login');
        return;
    }

    if (cart.length === 0) {
        showNotification('Корзина пуста!', 'error');
        return;
    }

    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.textContent = 'Оформление...';
        checkoutBtn.disabled = true;
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

        if (!address || address.trim().length < 10) {
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
            if (checkoutBtn) {
                checkoutBtn.textContent = 'Оформить заказ';
                checkoutBtn.disabled = false;
            }
            return;
        }
    }

    const finalTotal = total + deliveryCost;
    const orderNumber = generateOrderNumber();

    const order = {
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

    try {
        if (window.DB_MANAGER) {
            await DB_MANAGER.addOrder(order);
        } else {
            let orders = JSON.parse(localStorage.getItem('orders')) || [];
            orders.push(order);
            localStorage.setItem('orders', JSON.stringify(orders));
        }
        
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        
        updateCartCount();

        let deliveryInfo = '';
        if (deliveryValue === 'pickup') {
            deliveryInfo = `
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: left;">
                    <p><strong>📍 Адрес самовывоза:</strong> г. Воронеж, ул. Ветеринарная, д. 15</p>
                    <p><strong>🕒 Режим работы:</strong> круглосуточно</p>
                    <p><strong>📞 Телефон:</strong> 222-22-22</p>
                </div>
            `;
        } else {
            deliveryInfo = `
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: left;">
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
                            <span style="font-weight: bold;">${item.price} ₽</span>
                        </div>
                    `).join('')}
                    <div style="display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 2px solid #2c6e49; font-weight: bold;">
                        <span>ИТОГО:</span>
                        <span>${finalTotal} ₽</span>
                    </div>
                </div>
                
                <p>✅ Заказ сохранен в базе данных</p>
            </div>
        `);

        if (typeof displayCart === 'function') {
            displayCart();
        }
        
        broadcastUpdate();
        
        console.log('✅ Заказ создан:', orderNumber);
        
    } catch (error) {
        console.error('❌ Ошибка при оформлении заказа:', error);
        showNotification('Ошибка при оформлении заказа', 'error');
    } finally {
        if (checkoutBtn) {
            checkoutBtn.textContent = 'Оформить заказ';
            checkoutBtn.disabled = false;
        }
    }
}

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

function broadcastUpdate() {
    localStorage.setItem('updateTimestamp', Date.now().toString());
}

function openAuthModal(tab = 'login') {
    const modal = document.getElementById('authModal');
    if (!modal) {
        createAuthModal();
    }

    document.getElementById('authModal').classList.add('active');
    switchAuthTab(tab);
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

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

function updatePrice(productId) {
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('Только администратор может изменять цены!', 'error');
        return;
    }

    const newPrice = document.getElementById(`price-${productId}`).value;
    if (newPrice && newPrice > 0) {
        if (products[productId]) {
            products[productId].price = parseInt(newPrice);
            localStorage.setItem('products', JSON.stringify(products));
        }

        const row = document.querySelector(`tr[data-id="${productId}"]`);
        if (row) {
            row.setAttribute('data-price', newPrice);
            const priceCell = row.querySelector('.price');
            if (priceCell) {
                priceCell.textContent = newPrice + ' руб.';
            }
        }

        if (window.DB_MANAGER) {
            DB_MANAGER.saveToServer();
        }

        showNotification('Цена успешно обновлена!');
        broadcastUpdate();
    }
}

async function register(event) {
    event.preventDefault();

    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    
    if (!validateName(name)) {
        showNotification('Имя должно содержать от 2 до 30 символов', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showNotification('Введите корректный email', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Пароль должен содержать не менее 6 символов', 'error');
        return;
    }

    try {
        const registerBtn = event.target.querySelector('button[type="submit"]');
        registerBtn.textContent = 'Регистрация...';
        registerBtn.disabled = true;
        
        if (window.DB_MANAGER) {
            await DB_MANAGER.loadDatabase();
            
            if (DB_MANAGER.userExists(email)) {
                showNotification('Пользователь с таким email уже существует!', 'error');
                return;
            }

            await DB_MANAGER.addUser({
                name: name,
                email: email,
                password: password,
                role: 'user'
            });
        } else {
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
        }

        showNotification('Регистрация успешна!', 'success');
        
        document.getElementById('regName').value = '';
        document.getElementById('regEmail').value = '';
        document.getElementById('regPassword').value = '';
        
        switchAuthTab('login');
        
    } catch (error) {
        console.error('❌ Ошибка регистрации:', error);
        showNotification('Ошибка при регистрации', 'error');
    } finally {
        const registerBtn = event.target.querySelector('button[type="submit"]');
        if (registerBtn) {
            registerBtn.textContent = 'Зарегистрироваться';
            registerBtn.disabled = false;
        }
    }
}

async function login(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    console.log('🔐 Попытка входа:', email);
    
    try {
        const loginBtn = event.target.querySelector('button[type="submit"]');
        loginBtn.textContent = 'Вход...';
        loginBtn.disabled = true;
        
        let user = null;
        
        if (window.DB_MANAGER) {
            await DB_MANAGER.loadDatabase();
            user = DB_MANAGER.getUserByEmail(email);
        } else {
            let users = JSON.parse(localStorage.getItem('users')) || {};
            if (users[email]) {
                user = {
                    email: email,
                    name: users[email].name,
                    password: users[email].password,
                    role: users[email].role
                };
            }
        }
        
        if (user && user.password === password) {
            currentUser = {
                email: user.email,
                name: user.name,
                role: user.role
            };

            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            updateUI();
            closeAuthModal();
            
            showNotification(`Добро пожаловать, ${user.name}!`, 'success');
            
            document.getElementById('loginEmail').value = '';
            document.getElementById('loginPassword').value = '';
            
            console.log('✅ Вход выполнен');
        } else {
            showNotification('Неверный email или пароль!', 'error');
        }
    } catch (error) {
        console.error('❌ Ошибка входа:', error);
        showNotification('Ошибка при входе', 'error');
    } finally {
        const loginBtn = event.target.querySelector('button[type="submit"]');
        if (loginBtn) {
            loginBtn.textContent = 'Войти';
            loginBtn.disabled = false;
        }
    }
}

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

async function loadDatabaseFromFile() {
    try {
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

async function initialize() {
    if (isInitialized) return;
    isInitialized = true;

    console.log('Инициализация страницы...');

    await loadDatabaseFromFile();

    initProducts();
    initAdmin();

    currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    cart = JSON.parse(localStorage.getItem('cart')) || [];
    users = JSON.parse(localStorage.getItem('users')) || {};
    products = JSON.parse(localStorage.getItem('products')) || {};

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

document.addEventListener('DOMContentLoaded', initialize);

window.addEventListener('storage', function (e) {
    console.log('Изменение в localStorage:', e.key);

    if (e.key === 'currentUser' || e.key === 'cart' || e.key === 'updateTimestamp') {
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
