// Хранилище данных
let users = JSON.parse(localStorage.getItem('users')) || {};
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let products = JSON.parse(localStorage.getItem('products')) || {};

// Флаг для отслеживания инициализации
let isInitialized = false;

// Инициализация товаров при первом запуске
function initProducts() {
    if (Object.keys(products).length === 0) {
        products = {
            food1: { name: 'Royal Canin (для кошек)', price: 1200, category: 'food' },
            food2: { name: 'Royal Canin (для собак)', price: 1300, category: 'food' },
            food3: { name: 'Hill\'s (лечебный)', price: 1500, category: 'food' },
            food4: { name: 'Purina Pro Plan', price: 1100, category: 'food' },
            med1: { name: 'Антибиотики', price: 500, category: 'medicine' },
            med2: { name: 'Противоглистные', price: 300, category: 'medicine' },
            med3: { name: 'Витамины', price: 450, category: 'medicine' },
            med4: { name: 'Обезболивающие', price: 400, category: 'medicine' },
            acc1: { name: 'Ошейники', price: 350, category: 'accessories' },
            acc2: { name: 'Миски', price: 250, category: 'accessories' },
            acc3: { name: 'Лежаки', price: 1200, category: 'accessories' },
            acc4: { name: 'Переноски', price: 2000, category: 'accessories' },
            hyg1: { name: 'Шампуни', price: 450, category: 'hygiene' },
            hyg2: { name: 'Зубные пасты', price: 300, category: 'hygiene' },
            hyg3: { name: 'Когтерезки', price: 400, category: 'hygiene' }
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
            role: 'admin'
        };
        localStorage.setItem('users', JSON.stringify(users));
    }
}

// Показать уведомление
function showNotification(message, type = 'success') {
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

    if (currentUser) {
        // Пользователь авторизован
        authCorner.innerHTML = `
            <div class="user-info-corner">
                <span>👤 ${currentUser.name} ${currentUser.role === 'admin' ? '👑' : ''}</span>
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
                    <label for="deliveryMethod"><strong>Доставка</strong> (300 руб.)</label>
                </div>
                <div id="deliveryForm" class="delivery-info" style="display: none;">
                    <div class="form-group">
                        <label for="deliveryAddress">Адрес доставки:</label>
                        <input type="text" id="deliveryAddress" placeholder="Улица, дом, квартира" class="delivery-input">
                    </div>
                    <div class="form-group">
                        <label for="deliveryPhone">Контактный телефон:</label>
                        <input type="tel" id="deliveryPhone" placeholder="+7 (999) 123-45-67" class="delivery-input">
                    </div>
                    <div class="form-group">
                        <label for="deliveryComment">Комментарий курьеру:</label>
                        <textarea id="deliveryComment" placeholder="Домофон, этаж, особенности проезда" class="delivery-input" rows="2"></textarea>
                    </div>
                </div>
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

// Обработка заказа
function processOrder() {
    if (cart.length === 0) {
        showNotification('Корзина пуста!', 'error');
        return;
    }

    const pickupMethod = document.getElementById('pickupMethod');
    const deliveryMethod = document.getElementById('deliveryMethod');

    let deliveryValue = 'pickup';
    let deliveryCost = 0;
    let deliveryText = 'самовывозом';

    if (deliveryMethod && deliveryMethod.checked) {
        deliveryValue = 'delivery';
        deliveryCost = 300;
        deliveryText = 'доставкой';

        // Проверяем заполнение данных для доставки
        const address = document.getElementById('deliveryAddress')?.value;
        const phone = document.getElementById('deliveryPhone')?.value;

        if (!address || !phone) {
            showNotification('Заполните адрес и телефон для доставки!', 'error');
            return;
        }
    }

    let total = cart.reduce((sum, item) => sum + item.price, 0);
    const finalTotal = total + deliveryCost;

    // Генерируем номер заказа
    const orderNumber = generateOrderNumber();

    // Создаем заказ
    const order = {
        id: Date.now(),
        orderNumber: orderNumber,
        user: currentUser.email,
        userName: currentUser.name,
        items: [...cart],
        delivery: deliveryValue,
        total: finalTotal,
        date: new Date().toLocaleString()
    };

    // Добавляем данные в зависимости от способа доставки
    if (deliveryValue === 'pickup') {
        order.pickupAddress = 'г. Воронеж, ул. Ветеринарная, д. 15';
        order.pickupPhone = '222-22-22';
    } else {
        order.deliveryAddress = document.getElementById('deliveryAddress').value;
        order.deliveryPhone = document.getElementById('deliveryPhone').value;
        order.deliveryComment = document.getElementById('deliveryComment').value || '';
    }

    // Сохраняем заказ в историю
    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));

    // Очищаем корзину
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));

    // Показываем уведомление в зависимости от способа получения
    if (deliveryValue === 'pickup') {
        showNotification(`✅ Заказ #${orderNumber} оформлен! Самовывоз с ул. Ветеринарная, 15`, 'success');

        // Показываем детали самовывоза
        setTimeout(() => {
            alert(`
                🎉 ЗАКАЗ #${orderNumber} ОФОРМЛЕН!
                
                Способ получения: САМОВЫВОЗ
                
                📍 Адрес: г. Воронеж, ул. Ветеринарная, д. 15
                🕒 Режим работы: круглосуточно
                📞 Телефон: 222-22-22
                
                Товары:
                ${order.items.map(item => `• ${item.name}: ${item.price} руб.`).join('\n')}
                
                Итого: ${finalTotal} руб.
                
                Приезжайте за заказом в любое удобное время!
            `);
        }, 500);
    } else {
        showNotification(`✅ Заказ #${orderNumber} оформлен! Курьер приедет в течение часа`, 'success');

        // Показываем детали доставки
        setTimeout(() => {
            alert(`
                🎉 ЗАКАЗ #${orderNumber} ОФОРМЛЕН!
                
                Способ получения: ДОСТАВКА
                
                🚚 Адрес доставки: ${order.deliveryAddress}
                📞 Телефон: ${order.deliveryPhone}
                ${order.deliveryComment ? `💬 Комментарий: ${order.deliveryComment}` : ''}
                
                Товары:
                ${order.items.map(item => `• ${item.name}: ${item.price} руб.`).join('\n')}
                
                Стоимость доставки: 300 руб.
                Итого: ${finalTotal} руб.
                
                Курьер приедет в течение часа!
                Спасибо за заказ!
            `);
        }, 500);
    }

    // Обновляем отображение
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

        showNotification('Цена успешно обновлена!');
        broadcastUpdate();
    }
}

// Регистрация
function register(event) {
    event.preventDefault();

    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    if (users[email]) {
        showNotification('Пользователь с таким email уже существует!', 'error');
        return;
    }

    users[email] = {
        name: name,
        password: password,
        role: 'user'
    };

    localStorage.setItem('users', JSON.stringify(users));
    showNotification('Регистрация успешна! Теперь вы можете войти.');
    switchAuthTab('login');
}

// Вход
function login(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (users[email] && users[email].password === password) {
        currentUser = {
            email: email,
            name: users[email].name,
            role: users[email].role
        };

        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showNotification('Вход выполнен успешно!');

        closeAuthModal();
        updateUI();
        broadcastUpdate();
    } else {
        showNotification('Неверный email или пароль!', 'error');
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

// Основная инициализация
function initialize() {
    if (isInitialized) return;
    isInitialized = true;

    console.log('Инициализация страницы...');

    initProducts();
    initAdmin();

    // Загружаем актуальные данные
    currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    cart = JSON.parse(localStorage.getItem('cart')) || [];

    // Восстанавливаем цены
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