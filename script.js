const SCRIPT_VERSION = '10';

// В самом начале script.js добавьте:
console.log('📜 script.js загружается...');

// Функция ожидания DB_MANAGER
async function waitForDBManager() {
    return new Promise((resolve) => {
        if (window.DB_MANAGER) {
            resolve();
        } else {
            let attempts = 0;
            const interval = setInterval(() => {
                attempts++;
                if (window.DB_MANAGER) {
                    clearInterval(interval);
                    resolve();
                } else if (attempts > 50) { // 5 секунд максимум
                    clearInterval(interval);
                    console.error('❌ DB_MANAGER не загрузился за 5 секунд');
                    resolve();
                }
            }, 100);
        }
    });
}

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
    // Используем стилизованное уведомление если оно доступно
    if (typeof showDbNotification === 'function') {
        showDbNotification(message, type);
        return;
    }
    
    // Старая реализация как запасной вариант
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

    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.textContent = 'Оформление...';
        checkoutBtn.disabled = true;
    }

    const total = cart.reduce((sum, item) => sum + item.price, 0);
    const isDelivery = document.getElementById('deliveryMethod')?.checked;
    
    if (isDelivery) {
        const address = document.getElementById('deliveryAddress')?.value;
        const phone = document.getElementById('deliveryPhone')?.value;
        
        if (!address || address.length < 10) {
            document.getElementById('deliveryAddressError').textContent = 'Введите корректный адрес';
            if (checkoutBtn) {
                checkoutBtn.textContent = 'Оформить заказ';
                checkoutBtn.disabled = false;
            }
            return;
        }
        if (!phone || !validatePhone(phone)) {
            document.getElementById('deliveryPhoneError').textContent = 'Введите корректный телефон';
            if (checkoutBtn) {
                checkoutBtn.textContent = 'Оформить заказ';
                checkoutBtn.disabled = false;
            }
            return;
        }
    }

    // Генерируем номер заказа
    const orderNumber = generateOrderNumber();
    const deliveryCost = isDelivery ? (total >= 3000 ? 0 : 300) : 0;
    const finalTotal = total + deliveryCost;

    // Создаем заказ с полной информацией
    const order = {
        orderNumber: orderNumber,
        user: currentUser.email,
        userName: currentUser.name,
        items: cart.map(item => ({
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
        order.deliveryAddress = document.getElementById('deliveryAddress').value;
        order.deliveryPhone = document.getElementById('deliveryPhone').value;
        order.deliveryComment = document.getElementById('deliveryComment')?.value || '';
    }

    try {
        console.log('📦 Отправка заказа:', order);
        
        // Сохраняем заказ в Supabase
        const savedOrder = await DB_MANAGER.addOrder(order);
        console.log('✅ Заказ сохранен:', savedOrder);
        
        // Очищаем корзину
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        
        // Формируем информацию о доставке
        let deliveryInfo = '';
        if (isDelivery) {
            deliveryInfo = `
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: left;">
                    <p><strong>🚚 Адрес доставки:</strong> ${order.deliveryAddress}</p>
                    <p><strong>📞 Телефон:</strong> ${order.deliveryPhone}</p>
                    ${order.deliveryComment ? `<p><strong>💬 Комментарий:</strong> ${order.deliveryComment}</p>` : ''}
                    <p><strong>💰 Стоимость доставки:</strong> ${deliveryCost > 0 ? deliveryCost + ' руб.' : 'Бесплатно'}</p>
                </div>
            `;
        } else {
            deliveryInfo = `
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: left;">
                    <p><strong>📍 Адрес самовывоза:</strong> г. Воронеж, ул. Ветеринарная, д. 15</p>
                    <p><strong>🕒 Режим работы:</strong> круглосуточно</p>
                    <p><strong>📞 Телефон:</strong> 222-22-22</p>
                </div>
            `;
        }

        // Показываем подтверждение
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
                <button onclick="location.href='characteristics.html'" class="button" style="margin-top: 15px;">🛒 Продолжить покупки</button>
            </div>
        `);
        
        // Обновляем отображение корзины
        if (window.location.pathname.includes('cart.html')) {
            displayCart();
        }
        
        // Отправляем сигнал об обновлении
        if (DB_MANAGER.broadcastPriceUpdate) {
            DB_MANAGER.broadcastPriceUpdate();
        }
        
    } catch (error) {
        console.error('❌ Ошибка заказа:', error);
        showNotification('Ошибка при оформлении заказа: ' + error.message, 'error');
    } finally {
        if (checkoutBtn) {
            checkoutBtn.textContent = 'Оформить заказ';
            checkoutBtn.disabled = false;
        }
    }
}

function addPriceEditButtons() {
    document.querySelectorAll('tr[data-id]').forEach(row => {
        const productId = row.dataset.id;
        const price = row.dataset.price;
        const actionCell = row.querySelector('td:last-child');
        if (actionCell) {
            actionCell.innerHTML = `
                <div style="display: flex; gap: 5px;">
                    <input type="number" value="${price}" id="price-${productId}" style="width: 80px; padding: 5px;">
                    <button onclick="updatePrice('${productId}')" class="button">Изменить</button>
                </div>
            `;
        }
    });
}

// Обновить цену товара (только для админа)
async function updatePrice(productId) {
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('Только администратор может изменять цены!', 'error');
        return;
    }

    const newPrice = document.getElementById(`price-${productId}`).value;
    if (newPrice && newPrice > 0) {
        try {
            // Обновляем цену через DB_MANAGER
            await DB_MANAGER.updateProduct(productId, { price: parseInt(newPrice) });
            
            // Обновляем локально
            const row = document.querySelector(`tr[data-id="${productId}"]`);
            if (row) {
                row.setAttribute('data-price', newPrice);
                const priceCell = row.querySelector('.price');
                if (priceCell) {
                    priceCell.textContent = newPrice + ' руб.';
                }
            }
            
            // Отправляем сигнал об обновлении цен
            DB_MANAGER.broadcastPriceUpdate();
            
            showNotification('Цена успешно обновлена!', 'success');
            
        } catch (error) {
            console.error('❌ Ошибка обновления цены:', error);
            showNotification('Ошибка при обновлении цены', 'error');
        }
    }
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
    document.getElementById('authModal')?.classList.remove('active');
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

// ИСПРАВЛЕННАЯ ФУНКЦИЯ РЕГИСТРАЦИИ С АВТОМАТИЧЕСКИМ ОБНОВЛЕНИЕМ
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

    const registerBtn = event.target.querySelector('button[type="submit"]');
    const originalText = registerBtn.textContent;
    registerBtn.textContent = 'Регистрация...';
    registerBtn.disabled = true;

    try {
        // Проверяем наличие DB_MANAGER
        if (!window.DB_MANAGER) {
            throw new Error('База данных не доступна');
        }
        
        await DB_MANAGER.waitForInit();
        
        const exists = await DB_MANAGER.userExists(email);
        
        if (exists) {
            showNotification('Пользователь с таким email уже существует', 'error');
            return;
        }
        
        await DB_MANAGER.addUser({
            name: name,
            email: email,
            password: password,
            role: 'user'
        });
        
        showNotification('Регистрация успешна! Теперь можно войти.', 'success');
        
        document.getElementById('regName').value = '';
        document.getElementById('regEmail').value = '';
        document.getElementById('regPassword').value = '';
        
        switchAuthTab('login');
        
    } catch (error) {
        console.error('❌ Ошибка регистрации:', error);
        showNotification('Ошибка при регистрации: ' + error.message, 'error');
    } finally {
        registerBtn.textContent = originalText;
        registerBtn.disabled = false;
    }
}

// Функция для принудительного обновления данных в других вкладках
function broadcastUpdate() {
    // Сохраняем временную метку в localStorage
    localStorage.setItem('db_update_timestamp', Date.now().toString());
    console.log('📢 Отправлен сигнал обновления данных');
}

// ИСПРАВЛЕННАЯ ФУНКЦИЯ СОЗДАНИЯ ЗАКАЗА
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

    // Показываем индикатор загрузки
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.textContent = 'Оформление...';
        checkoutBtn.disabled = true;
    }

    const total = cart.reduce((sum, item) => sum + item.price, 0);
    const isDelivery = document.getElementById('deliveryMethod')?.checked;
    
    if (isDelivery) {
        const address = document.getElementById('deliveryAddress')?.value;
        const phone = document.getElementById('deliveryPhone')?.value;
        
        if (!address || address.length < 10) {
            document.getElementById('deliveryAddressError').textContent = 'Введите корректный адрес';
            if (checkoutBtn) {
                checkoutBtn.textContent = 'Оформить заказ';
                checkoutBtn.disabled = false;
            }
            return;
        }
        if (!phone || !validatePhone(phone)) {
            document.getElementById('deliveryPhoneError').textContent = 'Введите корректный телефон';
            if (checkoutBtn) {
                checkoutBtn.textContent = 'Оформить заказ';
                checkoutBtn.disabled = false;
            }
            return;
        }
    }

    // Генерируем номер заказа
    const orderNumber = generateOrderNumber();
    const deliveryCost = isDelivery ? (total >= 3000 ? 0 : 300) : 0;
    const finalTotal = total + deliveryCost;

    // Создаем заказ с полной информацией
    const order = {
        orderNumber: orderNumber,
        user: currentUser.email,
        userName: currentUser.name,
        items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: 1
        })),
        delivery: isDelivery ? 'delivery' : 'pickup',
        deliveryCost: deliveryCost,
        total: finalTotal,
        date: new Date().toISOString()
    };

    if (isDelivery) {
        order.deliveryAddress = document.getElementById('deliveryAddress').value;
        order.deliveryPhone = document.getElementById('deliveryPhone').value;
        order.deliveryComment = document.getElementById('deliveryComment')?.value || '';
    } else {
        order.pickupAddress = 'г. Воронеж, ул. Ветеринарная, д. 15';
        order.pickupPhone = '222-22-22';
    }

    try {
        // Сохраняем заказ в Supabase
        await DB_MANAGER.addOrder(order);
        
        // Очищаем корзину
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        
        // Формируем детальную информацию о доставке для отображения
        let deliveryInfo = '';
        if (isDelivery) {
            deliveryInfo = `
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: left;">
                    <p><strong>🚚 Адрес доставки:</strong> ${order.deliveryAddress}</p>
                    <p><strong>📞 Телефон:</strong> ${order.deliveryPhone}</p>
                    ${order.deliveryComment ? `<p><strong>💬 Комментарий:</strong> ${order.deliveryComment}</p>` : ''}
                    <p><strong>💰 Стоимость доставки:</strong> ${deliveryCost > 0 ? deliveryCost + ' руб.' : 'Бесплатно'}</p>
                </div>
            `;
        } else {
            deliveryInfo = `
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: left;">
                    <p><strong>📍 Адрес самовывоза:</strong> г. Воронеж, ул. Ветеринарная, д. 15</p>
                    <p><strong>🕒 Режим работы:</strong> круглосуточно</p>
                    <p><strong>📞 Телефон:</strong> 222-22-22</p>
                </div>
            `;
        }

        // Показываем детальную информацию о заказе
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
                <button onclick="location.href='characteristics.html'" class="button" style="margin-top: 15px;">🛒 Продолжить покупки</button>
            </div>
        `);
        
        // Обновляем отображение корзины
        if (window.location.pathname.includes('cart.html')) {
            displayCart();
        }
        
        // Принудительно обновляем данные в админ-панели (если открыта)
        if (window.location.pathname.includes('db-viewer.html')) {
            setTimeout(() => {
                loadOrders();
                updateStats();
            }, 1000);
        }
        
    } catch (error) {
        console.error('❌ Ошибка заказа:', error);
        showNotification('Ошибка при оформлении заказа', 'error');
    } finally {
        // Возвращаем кнопку в исходное состояние
        if (checkoutBtn) {
            checkoutBtn.textContent = 'Оформить заказ';
            checkoutBtn.disabled = false;
        }
    }
}

// ИСПРАВЛЕННАЯ ФУНКЦИЯ ВХОДА
async function login(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    console.log('🔐 Попытка входа:', email);

    try {
        // Проверяем наличие DB_MANAGER
        if (!window.DB_MANAGER) {
            showNotification('Ошибка подключения к базе данных', 'error');
            return;
        }
        
        // Ждем инициализацию
        await DB_MANAGER.waitForInit();
        
        // Загружаем свежие данные
        await DB_MANAGER.loadDatabase();
        
        // Ищем пользователя
        const user = DB_MANAGER.currentData.users.find(u => u.email === email);
        
        if (user) {
            if (user.password === password) {
                currentUser = {
                    email: user.email,
                    name: user.name,
                    role: user.role
                };

                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                
                closeAuthModal();
                updateUI();
                
                showNotification(`Добро пожаловать, ${user.name}!`, 'success');
                
                document.getElementById('loginEmail').value = '';
                document.getElementById('loginPassword').value = '';
                
            } else {
                showNotification('Неверный пароль!', 'error');
            }
        } else {
            showNotification('Пользователь не найден!', 'error');
        }
        
    } catch (error) {
        console.error('❌ Ошибка входа:', error);
        showNotification('Ошибка при входе в систему', 'error');
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
    cart.push({ 
        name, 
        price, 
        id: Date.now() + Math.random()
    });
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
    
    console.log('🔄 Инициализация...');
    
    // Ждем DB_MANAGER
    await waitForDBManager();
    
    // Теперь проверяем наличие DB_MANAGER
    if (window.DB_MANAGER) {
        console.log('✅ DB_MANAGER найден');
        try {
            await DB_MANAGER.waitForInit();
            console.log('✅ DB_MANAGER инициализирован');
        } catch (error) {
            console.error('❌ Ошибка инициализации DB_MANAGER:', error);
        }
    } else {
        console.warn('⚠️ DB_MANAGER не найден, работа в автономном режиме');
    }
    
    currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    createAuthModal();
    updateUI();
    
    console.log('✅ Инициализация завершена');
}

// ============================================
// ОБРАБОТКА ФОРМЫ КОНТАКТОВ
// ============================================

// Функция валидации сообщения
function validateContactMessage(message) {
    return message && message.trim().length >= 10 && message.trim().length <= 1000;
}

// Обработчик отправки формы контактов
async function handleContactSubmit(event) {
    event.preventDefault();
    
    console.log('📝 Отправка формы контактов...');
    
    // Получаем элементы
    const nameInput = document.getElementById('contactName');
    const emailInput = document.getElementById('contactEmail');
    const phoneInput = document.getElementById('contactPhone');
    const messageInput = document.getElementById('contactMessage');
    const successDiv = document.getElementById('formSuccess');
    const errorDiv = document.getElementById('formError');
    const submitBtn = document.getElementById('contactSubmitBtn');
    
    // Очищаем предыдущие сообщения
    if (successDiv) successDiv.style.display = 'none';
    if (errorDiv) errorDiv.style.display = 'none';
    
    // Получаем значения
    const name = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const message = messageInput ? messageInput.value.trim() : '';
    
    console.log('Получены данные:', { name, email, phone, message });
    
    // Валидация
    if (!name) {
        showContactError('Укажите ваше имя');
        return false;
    }
    
    if (!email || !validateEmail(email)) {
        showContactError('Укажите корректный email');
        return false;
    }
    
    if (!message || !validateContactMessage(message)) {
        showContactError('Сообщение должно содержать от 10 до 1000 символов');
        return false;
    }
    
    if (phone && !validatePhone(phone)) {
        showContactError('Укажите корректный номер телефона');
        return false;
    }
    
    // Блокируем кнопку
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Отправка...';
    }
    
    try {
        // Проверяем наличие DB_MANAGER
        if (!window.DB_MANAGER) {
            throw new Error('Менеджер базы данных не загружен');
        }
        
        // Ждем инициализацию
        await DB_MANAGER.waitForInit();
        
        // Сохраняем сообщение
        console.log('Сохраняем сообщение в БД...');
        const result = await DB_MANAGER.addMessage({
            name: name,
            email: email,
            phone: phone || '',
            message: message
        });
        
        console.log('✅ Сообщение сохранено:', result);
        
        // Показываем успех
        if (successDiv) {
            successDiv.style.display = 'block';
            successDiv.innerHTML = '✅ Спасибо за обращение! Мы свяжемся с вами в ближайшее время.';
        }
        
        // Очищаем форму
        if (nameInput) nameInput.value = '';
        if (emailInput) emailInput.value = '';
        if (phoneInput) phoneInput.value = '';
        if (messageInput) messageInput.value = '';
        
        // Показываем уведомление
        showNotification('Сообщение отправлено!', 'success');
        
    } catch (error) {
        console.error('❌ Ошибка при отправке сообщения:', error);
        showContactError('Ошибка при отправке: ' + error.message);
    } finally {
        // Разблокируем кнопку
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Отправить';
        }
    }
    
    return false;
}

// Вспомогательная функция для показа ошибки в форме контактов
function showContactError(message) {
    const errorDiv = document.getElementById('formError');
    const successDiv = document.getElementById('formSuccess');
    
    if (successDiv) successDiv.style.display = 'none';
    
    if (errorDiv) {
        errorDiv.style.display = 'block';
        errorDiv.innerHTML = '❌ ' + message;
    } else {
        alert(message);
    }
    
    // Также показываем уведомление
    showNotification(message, 'error');
}

// Слушаем изменения в localStorage для обновления данных в реальном времени
window.addEventListener('storage', function(e) {
    if (e.key === 'db_update_timestamp') {
        console.log('🔄 Получен сигнал обновления данных');
        
        // Если мы на странице админ-панели, обновляем данные
        if (window.location.pathname.includes('db-viewer.html')) {
            setTimeout(async () => {
                await DB_MANAGER.loadDatabase();
                if (typeof loadUsers === 'function') loadUsers();
                if (typeof loadProducts === 'function') loadProducts();
                if (typeof loadOrders === 'function') loadOrders();
                if (typeof loadMessages === 'function') loadMessages();
                if (typeof updateStats === 'function') updateStats();
                showDbNotification('Данные обновлены', 'success');
            }, 500);
        }
    }
});
// ============================================
// ОБНОВЛЕНИЕ ЦЕН НА СТРАНИЦЕ ТОВАРОВ
// ============================================

// Функция для обновления отображаемых цен
async function refreshProductPrices() {
    // Проверяем, находимся ли мы на странице товаров
    if (!window.location.pathname.includes('characteristics.html')) {
        return;
    }
    
    console.log('🔄 Обновление цен на странице товаров...');
    
    try {
        // Получаем актуальные данные из БД
        await DB_MANAGER.waitForInit();
        await DB_MANAGER.loadDatabase();
        
        // Обновляем цены в каждой строке таблицы
        document.querySelectorAll('tr[data-id]').forEach(row => {
            const productId = row.getAttribute('data-id');
            const product = DB_MANAGER.currentData.products.find(p => p.id === productId);
            
            if (product) {
                // Обновляем атрибут data-price
                row.setAttribute('data-price', product.price);
                
                // Обновляем отображаемую цену
                const priceCell = row.querySelector('.price');
                if (priceCell) {
                    priceCell.textContent = product.price + ' руб.';
                }
                
                // Если есть кнопки редактирования для админа, обновляем их
                if (currentUser && currentUser.role === 'admin') {
                    const priceInput = document.getElementById(`price-${productId}`);
                    if (priceInput) {
                        priceInput.value = product.price;
                    }
                }
            }
        });
        
        console.log('✅ Цены обновлены');
        
        // Показываем уведомление (только если не админ-панель)
        if (!window.location.pathname.includes('db-viewer.html')) {
            showNotification('Цены обновлены', 'success');
        }
        
    } catch (error) {
        console.error('❌ Ошибка при обновлении цен:', error);
    }
}

// Слушаем изменения цен в localStorage
window.addEventListener('storage', function(e) {
    if (e.key === 'price_update_timestamp') {
        console.log('💰 Получен сигнал обновления цен');
        
        // Обновляем цены на странице товаров
        if (window.location.pathname.includes('characteristics.html')) {
            refreshProductPrices();
        }
    }
});

// Периодическая проверка цен (каждые 30 секунд)
setInterval(async () => {
    if (window.location.pathname.includes('characteristics.html')) {
        await refreshProductPrices();
    }
}, 30000);

// Делаем функцию глобальной
window.refreshProductPrices = refreshProductPrices;
window.handleContactSubmit = handleContactSubmit;

document.addEventListener('DOMContentLoaded', initialize);
