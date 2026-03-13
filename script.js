const SCRIPT_VERSION = '6';

console.log('📜 script.js загружен (версия', SCRIPT_VERSION + ')');

// Делаем функции глобальными
window.showNotification = showNotification;
window.showStyledAlert = showStyledAlert;

// Хранилище данных (только текущая сессия)
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Флаг инициализации
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

function showNotification(message, type = 'success') {
    const oldNotification = document.querySelector('.notification');
    if (oldNotification) oldNotification.remove();

    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.backgroundColor = type === 'success' ? '#2c6e49' : '#dc3545';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 3000);
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
        z-index: 10;
    `;
    closeButton.onclick = () => document.body.removeChild(overlay);

    alertBox.innerHTML = content;
    alertBox.appendChild(closeButton);
    overlay.appendChild(alertBox);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) document.body.removeChild(overlay);
    });
}

function createAuthCorner() {
    if (!document.getElementById('authCorner')) {
        const authCorner = document.createElement('div');
        authCorner.id = 'authCorner';
        authCorner.className = 'auth-corner';
        authCorner.style.cssText = 'position: fixed; top: 10px; left: 10px; z-index: 1000; max-width: 300px;';
        document.body.prepend(authCorner);
    }
}

function createCartButton() {
    if (window.location.pathname.includes('characteristics.html') && !document.getElementById('cartButton')) {
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
    createAuthCorner();
    createCartButton();

    const authCorner = document.getElementById('authCorner');
    if (!authCorner) return;

    if (currentUser) {
        authCorner.innerHTML = `
            <div class="user-info-corner" style="background: linear-gradient(135deg, #2c6e49, #1e4d2f); color: white; padding: 8px 15px; border-radius: 30px; display: flex; align-items: center; gap: 10px; border: 2px solid #ffd700;">
                <div style="display: flex; flex-direction: column; gap: 2px;">
                    <span style="font-weight: bold;">${currentUser.name} ${currentUser.role === 'admin' ? '👑' : ''}</span>
                    <span style="font-size: 11px; color: #ffd700;">${currentUser.email}</span>
                </div>
                ${currentUser.role === 'admin' && !window.location.pathname.includes('db-viewer.html') ? 
                    '<a href="db-viewer.html" style="color: #ffd700; text-decoration: none; font-size: 12px;">📁 Управление БД</a>' : ''}
                <button onclick="logout()" style="background-color: #ffd700; color: #1e4d2f; border: none; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; cursor: pointer;">Выйти</button>
            </div>
        `;
        
        if (window.location.pathname.includes('characteristics.html') && currentUser.role === 'admin') {
            addPriceEditButtons();
        }
    } else {
        authCorner.innerHTML = `
            <div class="auth-buttons-corner" style="display: flex; gap: 8px; background-color: white; padding: 5px; border-radius: 40px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); border: 2px solid #2c6e49;">
                <button onclick="openAuthModal('login')" style="background-color: #2c6e49; color: white; border: none; padding: 6px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; cursor: pointer;">Вход</button>
                <button onclick="openAuthModal('register')" style="background-color: #2c6e49; color: white; border: none; padding: 6px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; cursor: pointer;">Регистрация</button>
            </div>
        `;
    }

    updateCartCount();
    
    if (window.location.pathname.includes('cart.html')) {
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
    for (let i = 0; i < 2; i++) orderNumber += letters[Math.floor(Math.random() * letters.length)];
    for (let i = 0; i < 4; i++) orderNumber += numbers[Math.floor(Math.random() * numbers.length)];
    return orderNumber;
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

    let total = 0;
    let html = '<div class="cart-items-list">';
    
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
                </div>
            </div>
            <div class="delivery-method">
                <div class="delivery-option">
                    <input type="radio" name="deliveryMethod" id="deliveryMethod" value="delivery" onchange="toggleDeliveryForm()">
                    <label for="deliveryMethod"><strong>Доставка</strong> ${total >= 3000 ? '<span class="free-delivery">(бесплатно)</span>' : '(300 руб.)'}</label>
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
            <button onclick="processOrder()" class="button checkout-btn">Оформить заказ</button>
        </div>
    `;

    cartContainer.innerHTML = html;
}

function toggleDeliveryForm() {
    const deliveryForm = document.getElementById('deliveryForm');
    if (deliveryForm) {
        deliveryForm.style.display = document.getElementById('deliveryMethod')?.checked ? 'block' : 'none';
    }
}

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

    const total = cart.reduce((sum, item) => sum + item.price, 0);
    const isDelivery = document.getElementById('deliveryMethod')?.checked;
    
    if (isDelivery) {
        const address = document.getElementById('deliveryAddress')?.value;
        const phone = document.getElementById('deliveryPhone')?.value;
        
        if (!address || address.length < 10) {
            document.getElementById('deliveryAddressError').textContent = 'Введите корректный адрес';
            return;
        }
        if (!phone || !validatePhone(phone)) {
            document.getElementById('deliveryPhoneError').textContent = 'Введите корректный телефон';
            return;
        }
    }

    const order = {
        orderNumber: generateOrderNumber(),
        user: currentUser.email,
        userName: currentUser.name,
        items: [...cart],
        delivery: isDelivery ? 'delivery' : 'pickup',
        deliveryCost: isDelivery ? (total >= 3000 ? 0 : 300) : 0,
        total: total + (isDelivery ? (total >= 3000 ? 0 : 300) : 0),
        date: new Date().toISOString()
    };

    if (isDelivery) {
        order.deliveryAddress = document.getElementById('deliveryAddress').value;
        order.deliveryPhone = document.getElementById('deliveryPhone').value;
    }

    try {
        await DB_MANAGER.addOrder(order);
        
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        
        showStyledAlert(`
            <div style="text-align: center;">
                <h2 style="color: #2c6e49;">Заказ оформлен!</h2>
                <p>Номер заказа: <strong>#${order.orderNumber}</strong></p>
                <p>Сумма: ${order.total} ₽</p>
            </div>
        `);
        
        if (window.location.pathname.includes('cart.html')) {
            displayCart();
        }
    } catch (error) {
        showNotification('Ошибка при оформлении заказа', 'error');
    }
}

function openAuthModal(tab = 'login') {
    let modal = document.getElementById('authModal');
    if (!modal) {
        modal = document.createElement('div');
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
                        <input type="email" id="loginEmail" required>
                        <p>Пароль:</p>
                        <input type="password" id="loginPassword" required>
                        <button type="submit" class="button">Войти</button>
                    </form>
                </div>
                <div id="registerForm" class="auth-form">
                    <form onsubmit="register(event)">
                        <p>Имя:</p>
                        <input type="text" id="regName" required>
                        <p>Email:</p>
                        <input type="email" id="regEmail" required>
                        <p>Пароль:</p>
                        <input type="password" id="regPassword" required>
                        <button type="submit" class="button">Зарегистрироваться</button>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    modal.classList.add('active');
    switchAuthTab(tab);
}

function closeAuthModal() {
    document.getElementById('authModal')?.classList.remove('active');
}

function switchAuthTab(tab) {
    document.getElementById('loginTab')?.classList.toggle('active', tab === 'login');
    document.getElementById('registerTab')?.classList.toggle('active', tab === 'register');
    document.getElementById('loginForm')?.classList.toggle('active', tab === 'login');
    document.getElementById('registerForm')?.classList.toggle('active', tab === 'register');
}

async function register(event) {
    event.preventDefault();
    
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    if (!validateName(name) || !validateEmail(email) || password.length < 6) {
        showNotification('Проверьте введенные данные', 'error');
        return;
    }

    try {
        await DB_MANAGER.loadDatabase();
        
        if (DB_MANAGER.userExists(email)) {
            showNotification('Email уже существует', 'error');
            return;
        }
        
        await DB_MANAGER.addUser({ name, email, password, role: 'user' });
        
        showNotification('Регистрация успешна!', 'success');
        switchAuthTab('login');
    } catch (error) {
        showNotification('Ошибка регистрации', 'error');
    }
}

async function login(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        await DB_MANAGER.loadDatabase();
        
        const user = DB_MANAGER.getUserByEmail(email);
        
        if (user && user.password === password) {
            currentUser = { email: user.email, name: user.name, role: user.role };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            closeAuthModal();
            updateUI();
            showNotification(`Добро пожаловать, ${user.name}!`, 'success');
        } else {
            showNotification('Неверный email или пароль', 'error');
        }
    } catch (error) {
        showNotification('Ошибка входа', 'error');
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateUI();
    showNotification('Вы вышли из системы');
}

function addToCart(name, price) {
    if (!currentUser) {
        showNotification('Необходимо войти в систему', 'error');
        openAuthModal('login');
        return;
    }
    if (currentUser.role === 'admin') {
        showNotification('Администратор не может покупать', 'error');
        return;
    }
    cart.push({ name, price, id: Date.now() });
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showNotification('Товар добавлен в корзину');
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    if (window.location.pathname.includes('cart.html')) displayCart();
}

async function initialize() {
    if (isInitialized) return;
    isInitialized = true;
    
    console.log('Инициализация...');
    
    // Загружаем данные с JSONBin
    await DB_MANAGER.loadDatabase();
    
    currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    createAuthModal();
    updateUI();
}

document.addEventListener('DOMContentLoaded', initialize);
