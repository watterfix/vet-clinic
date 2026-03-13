// ============================================
// СКРИПТ ДЛЯ УПРАВЛЕНИЯ БАЗОЙ ДАННЫХ (db-viewer)
// ============================================

// Глобальные переменные
let currentUser = null;

// Ждем полной загрузки DOM и всех скриптов
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM загружен, инициализация...');

    // Проверяем наличие DB_MANAGER
    if (typeof DB_MANAGER === 'undefined') {
        console.error('DB_MANAGER не загружен!');
        showAdminWarning('Ошибка загрузки менеджера БД');
        return;
    }

    // Запускаем инициализацию
    initPage();
});

// Функция показа предупреждения
function showAdminWarning(message) {
    const adminCheck = document.getElementById('adminCheck');
    if (adminCheck) {
        adminCheck.style.display = 'block';
        adminCheck.innerHTML = `⚠️ ${message}`;
        adminCheck.style.backgroundColor = '#dc3545';
        adminCheck.style.color = 'white';
        adminCheck.style.borderColor = '#dc3545';
    }
}

// Проверка прав администратора
function checkAdminAccess() {
    const adminCheck = document.getElementById('adminCheck');
    if (!adminCheck) return false;

    currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (!currentUser) {
        adminCheck.style.display = 'block';
        adminCheck.innerHTML = '⚠️ Необходимо войти в систему!';
        adminCheck.style.backgroundColor = '#dc3545';
        adminCheck.style.color = 'white';
        adminCheck.style.borderColor = '#dc3545';
        return false;
    }

    if (currentUser.role !== 'admin') {
        adminCheck.style.display = 'block';
        adminCheck.innerHTML = '⚠️ Доступ запрещен! Только администратор может просматривать эту страницу.';
        adminCheck.style.backgroundColor = '#dc3545';
        adminCheck.style.color = 'white';
        adminCheck.style.borderColor = '#dc3545';
        return false;
    }

    adminCheck.style.display = 'none';
    return true;
}

// Инициализация страницы
async function initPage() {
    console.log('Инициализация страницы...');

    // Показываем загрузку
    const adminCheck = document.getElementById('adminCheck');
    if (adminCheck) {
        adminCheck.style.display = 'block';
        adminCheck.innerHTML = '⏳ Проверка прав доступа...';
        adminCheck.style.backgroundColor = '#ffc107';
        adminCheck.style.color = '#1e4d2f';
        adminCheck.style.borderColor = '#ffc107';
    }

    // Проверяем права
    if (!checkAdminAccess()) {
        return;
    }

    // Загружаем данные
    try {
        await DB_MANAGER.loadDatabase();
        console.log('Данные загружены');

        // Загружаем все панели
        loadUsers();
        loadProducts();
        loadOrders();
        updateStats();
        loadBackups();
        loadMessages(); // Добавляем загрузку сообщений

        console.log('Страница инициализирована');

        // Показываем интерфейс
        document.querySelectorAll('.db-panel, .export-buttons, .import-area, .db-tabs').forEach(el => {
            if (el) el.style.display = '';
        });

    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        showAdminWarning('Ошибка загрузки данных');
    }
}

// Переключение вкладок
function switchTab(tabName) {
    if (!checkAdminAccess()) return;

    // Обновляем активные вкладки
    document.querySelectorAll('.db-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');

    // Показываем соответствующую панель
    document.querySelectorAll('.db-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    const panel = document.getElementById(tabName + 'Panel');
    if (panel) panel.classList.add('active');

    // Загружаем данные для панели
    switch (tabName) {
        case 'users':
            loadUsers();
            break;
        case 'products':
            loadProducts();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'messages': // Добавляем вкладку сообщений
            loadMessages();
            break;
        case 'backups':
            loadBackups();
            break;
    }
}

// ============================================
// УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ
// ============================================

// Загрузка пользователей
function loadUsers() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    const users = DB_MANAGER.currentData?.users || [];

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px;">Нет пользователей</td></tr>';
        return;
    }

    let html = '';
    users.sort((a, b) => a.email.localeCompare(b.email)).forEach(user => {
        const safeEmail = user.email.replace(/[@.]/g, '_');
        const registered = user.registered ? new Date(user.registered).toLocaleString() : 'Н/Д';
        const roleClass = user.role === 'admin' ? 'role-admin' : 'role-user';
        const roleText = user.role === 'admin' ? '👑 Админ' : '👤 Пользователь';

        html += `
            <tr id="user-${safeEmail}">
                <td>${user.email}</td>
                <td>${user.name}</td>
                <td><span class="role-badge ${roleClass}">${roleText}</span></td>
                <td>${registered}</td>
                <td class="action-buttons">
                    <button onclick="editUser('${user.email}')" class="btn-edit">✏️ Ред.</button>
                    <button onclick="deleteUser('${user.email}')" class="btn-delete" ${user.email === 'admin@vetclinic.ru' ? 'disabled' : ''}>🗑️ Удал.</button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// Поиск пользователей
function searchUsers() {
    const searchText = document.getElementById('userSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#usersTableBody tr');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchText) ? '' : 'none';
    });
}

// Показать форму добавления пользователя
function showAddUserForm() {
    document.getElementById('addUserForm').style.display = 'block';
}

// Скрыть форму добавления пользователя
function hideAddUserForm() {
    document.getElementById('addUserForm').style.display = 'none';
}

// Добавление пользователя
async function addUser() {
    const name = document.getElementById('newUserName').value;
    const email = document.getElementById('newUserEmail').value;
    const password = document.getElementById('newUserPassword').value;
    const role = document.getElementById('newUserRole').value;

    if (!name || !email || !password) {
        showNotification('Заполните все поля!', 'error');
        return;
    }

    const users = DB_MANAGER.currentData?.users || [];
    if (users.some(u => u.email === email)) {
        showNotification('Пользователь с таким email уже существует!', 'error');
        return;
    }

    const result = await DB_MANAGER.addUser({
        name: name,
        email: email,
        password: password,
        role: role
    });

    if (result) {
        showNotification('Пользователь добавлен!', 'success');
        hideAddUserForm();
        loadUsers();
        updateStats();

        document.getElementById('newUserName').value = '';
        document.getElementById('newUserEmail').value = '';
        document.getElementById('newUserPassword').value = '';
    }
}

// Редактирование пользователя
function editUser(email) {
    const safeEmail = email.replace(/[@.]/g, '_');
    const row = document.getElementById(`user-${safeEmail}`);
    const user = DB_MANAGER.currentData?.users.find(u => u.email === email);

    if (!user) return;

    row.innerHTML = `
        <td>${email}</td>
        <td><input type="text" id="edit-name-${safeEmail}" value="${user.name}" class="edit-input"></td>
        <td>
            <select id="edit-role-${safeEmail}" class="edit-input">
                <option value="user" ${user.role === 'user' ? 'selected' : ''}>Пользователь</option>
                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Администратор</option>
            </select>
        </td>
        <td>
            <input type="password" id="edit-password-${safeEmail}" value="" class="edit-input" placeholder="Новый пароль">
        </td>
        <td class="action-buttons">
            <button onclick="saveUserEdit('${email}')" class="btn-save">💾 Сохр.</button>
            <button onclick="cancelUserEdit('${email}')" class="btn-delete">✖ Отм.</button>
        </td>
    `;
}

// Сохранение редактирования пользователя
async function saveUserEdit(email) {
    const safeEmail = email.replace(/[@.]/g, '_');
    const newName = document.getElementById(`edit-name-${safeEmail}`).value;
    const newRole = document.getElementById(`edit-role-${safeEmail}`).value;
    const newPassword = document.getElementById(`edit-password-${safeEmail}`).value;

    const updateData = {
        name: newName,
        role: newRole
    };

    if (newPassword) {
        updateData.password = newPassword;
    }

    const result = await DB_MANAGER.updateUser(email, updateData);
    if (result) {
        showNotification('Пользователь обновлен', 'success');
        loadUsers();
    }
}

// Отмена редактирования пользователя
function cancelUserEdit(email) {
    loadUsers();
}

// Удаление пользователя
async function deleteUser(email) {
    if (email === 'admin@vetclinic.ru') {
        showNotification('Нельзя удалить главного администратора!', 'error');
        return;
    }

    if (confirm(`Удалить пользователя ${email}?`)) {
        try {
            const result = await DB_MANAGER.deleteUser(email);
            if (result) {
                showNotification('Пользователь удален', 'success');
                loadUsers();
                updateStats();
            } else {
                showNotification('Ошибка при удалении', 'error');
            }
        } catch (error) {
            console.error('Ошибка удаления:', error);
            showNotification('Ошибка при удалении', 'error');
        }
    }
}

// ============================================
// УПРАВЛЕНИЕ ТОВАРАМИ
// ============================================

// Загрузка товаров
function loadProducts() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

    const products = DB_MANAGER.currentData?.products || [];

    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px;">Нет товаров</td></tr>';
        return;
    }

    let html = '';
    products.sort((a, b) => a.id.localeCompare(b.id)).forEach(product => {
        const categoryClass = `category-${product.category}`;
        const categoryName = getCategoryName(product.category);

        html += `
            <tr id="product-${product.id}">
                <td><code>${product.id}</code></td>
                <td><strong>${product.name}</strong></td>
                <td><strong style="color: #2c6e49;">${product.price} ₽</strong></td>
                <td><span class="category-badge ${categoryClass}">${categoryName}</span></td>
                <td>${product.description || '—'}</td>
                <td class="action-buttons">
                    <button onclick="editProduct('${product.id}')" class="btn-edit">✏️ Ред.</button>
                    <button onclick="deleteProduct('${product.id}')" class="btn-delete">🗑️ Удал.</button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// Поиск товаров
function searchProducts() {
    const searchText = document.getElementById('productSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#productsTableBody tr');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchText) ? '' : 'none';
    });
}

// Показать форму добавления товара
function showAddProductForm() {
    document.getElementById('addProductForm').style.display = 'block';
}

// Скрыть форму добавления товара
function hideAddProductForm() {
    document.getElementById('addProductForm').style.display = 'none';
}

// Добавление товара
async function addProduct() {
    const id = document.getElementById('newProductId').value;
    const name = document.getElementById('newProductName').value;
    const price = document.getElementById('newProductPrice').value;
    const category = document.getElementById('newProductCategory').value;
    const description = document.getElementById('newProductDescription').value;

    if (!id || !name || !price) {
        showNotification('Заполните обязательные поля!', 'error');
        return;
    }

    const products = DB_MANAGER.currentData?.products || [];
    if (products.some(p => p.id === id)) {
        showNotification('Товар с таким ID уже существует!', 'error');
        return;
    }

    const result = await DB_MANAGER.addProduct({
        id: id,
        name: name,
        price: parseInt(price),
        category: category,
        description: description
    });

    if (result) {
        showNotification('Товар добавлен!', 'success');
        hideAddProductForm();
        loadProducts();
        updateStats();

        document.getElementById('newProductId').value = '';
        document.getElementById('newProductName').value = '';
        document.getElementById('newProductPrice').value = '';
        document.getElementById('newProductDescription').value = '';
    }
}

// Редактирование товара
function editProduct(productId) {
    const row = document.getElementById(`product-${productId}`);
    const product = DB_MANAGER.currentData?.products.find(p => p.id === productId);

    if (!product) return;

    row.innerHTML = `
        <td><code>${productId}</code></td>
        <td><input type="text" id="edit-product-name-${productId}" value="${product.name}" class="edit-input"></td>
        <td><input type="number" id="edit-product-price-${productId}" value="${product.price}" class="edit-input" min="0"></td>
        <td>
            <select id="edit-product-category-${productId}" class="edit-input">
                <option value="food" ${product.category === 'food' ? 'selected' : ''}>🍖 Корма</option>
                <option value="medicine" ${product.category === 'medicine' ? 'selected' : ''}>💊 Лекарства</option>
                <option value="accessories" ${product.category === 'accessories' ? 'selected' : ''}>🪀 Аксессуары</option>
                <option value="hygiene" ${product.category === 'hygiene' ? 'selected' : ''}>🧼 Гигиена</option>
            </select>
        </td>
        <td><input type="text" id="edit-product-desc-${productId}" value="${product.description || ''}" class="edit-input" placeholder="Описание"></td>
        <td class="action-buttons">
            <button onclick="saveProductEdit('${productId}')" class="btn-save">💾 Сохр.</button>
            <button onclick="cancelProductEdit('${productId}')" class="btn-delete">✖ Отм.</button>
        </td>
    `;
}

// Сохранение редактирования товара
async function saveProductEdit(productId) {
    const newName = document.getElementById(`edit-product-name-${productId}`).value;
    const newPrice = document.getElementById(`edit-product-price-${productId}`).value;
    const newCategory = document.getElementById(`edit-product-category-${productId}`).value;
    const newDesc = document.getElementById(`edit-product-desc-${productId}`).value;

    const updateData = {
        name: newName,
        price: parseInt(newPrice),
        category: newCategory,
        description: newDesc
    };

    const result = await DB_MANAGER.updateProduct(productId, updateData);
    if (result) {
        showNotification('Товар обновлен', 'success');
        loadProducts();
    }
}

// Отмена редактирования товара
function cancelProductEdit(productId) {
    loadProducts();
}

// Удаление товара
async function deleteProduct(productId) {
    const product = DB_MANAGER.currentData?.products.find(p => p.id === productId);
    if (!product) return;

    if (confirm(`Удалить товар "${product.name}"?`)) {
        try {
            const result = await DB_MANAGER.deleteProduct(productId);
            if (result) {
                showNotification('Товар удален', 'success');
                loadProducts();
                updateStats();
            } else {
                showNotification('Ошибка при удалении', 'error');
            }
        } catch (error) {
            console.error('Ошибка удаления:', error);
            showNotification('Ошибка при удалении', 'error');
        }
    }
}

// ============================================
// УПРАВЛЕНИЕ ЗАКАЗАМИ (с адресом доставки)
// ============================================

// Загрузка заказов
function loadOrders() {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;

    const orders = DB_MANAGER.currentData?.orders || [];

    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 30px;">Нет заказов</td></tr>';
        return;
    }

    let html = '';
    orders.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(order => {
        const date = new Date(order.date).toLocaleString();

        // Формируем адрес доставки
        let deliveryAddress = '';
        if (order.delivery === 'pickup') {
            deliveryAddress = '🚶 Самовывоз (ул. Ветеринарная, 15)';
        } else {
            deliveryAddress = `🚚 ${order.deliveryAddress || 'Адрес не указан'}`;
            if (order.deliveryComment) {
                deliveryAddress += `<br><small>📝 ${order.deliveryComment}</small>`;
            }
        }

        // Телефон
        const phone = order.deliveryPhone || order.pickupPhone || 'Не указан';

        html += `
            <tr id="order-${order.id}">
                <td><strong>#${order.orderNumber}</strong></td>
                <td>${date}</td>
                <td>
                    ${order.userName}<br>
                    <small style="color: #666;">${order.user}</small><br>
                    <small style="color: #666;">📞 ${phone}</small>
                </td>
                <td><strong style="color: #2c6e49;">${order.total} ₽</strong></td>
                <td>${order.delivery === 'pickup' ? '🚶 Самовывоз' : '🚚 Доставка'}</td>
                <td>
                    <div style="max-width: 200px; word-break: break-word;">
                        ${deliveryAddress}
                    </div>
                </td>
                <td>${order.items ? order.items.length : 0} шт.</td>
                <td class="action-buttons">
                    <button onclick="viewOrderDetails('${order.id}')" class="btn-view">👁️ Дет.</button>
                    <button onclick="deleteOrder('${order.id}')" class="btn-delete">🗑️ Удал.</button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// Поиск заказов
function searchOrders() {
    const searchText = document.getElementById('orderSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#ordersTableBody tr');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchText) ? '' : 'none';
    });
}

// Просмотр деталей заказа
function viewOrderDetails(orderId) {
    const order = DB_MANAGER.currentData?.orders.find(o => o.id == orderId);
    if (!order) return;

    let itemsHtml = '';
    order.items.forEach(item => {
        itemsHtml += `<div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dashed #2c6e49;">
            <span>${item.name}</span>
            <span style="font-weight: bold;">${item.price} ₽</span>
        </div>`;
    });

    let deliveryInfo = '';
    if (order.delivery === 'pickup') {
        deliveryInfo = `
            <p><strong>📍 Адрес самовывоза:</strong> г. Воронеж, ул. Ветеринарная, д. 15</p>
            <p><strong>📞 Телефон:</strong> ${order.pickupPhone || '222-22-22'}</p>
        `;
    } else {
        deliveryInfo = `
            <p><strong>🚚 Адрес доставки:</strong> ${order.deliveryAddress || 'Не указан'}</p>
            <p><strong>📞 Телефон:</strong> ${order.deliveryPhone || 'Не указан'}</p>
            ${order.deliveryComment ? `<p><strong>💬 Комментарий:</strong> ${order.deliveryComment}</p>` : ''}
        `;
    }

    showStyledAlert(`
        <div style="text-align: center;">
            <h2 style="color: #2c6e49;">Заказ #${order.orderNumber}</h2>
            <p><strong>Дата:</strong> ${new Date(order.date).toLocaleString()}</p>
            <p><strong>Пользователь:</strong> ${order.userName} (${order.user})</p>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: left;">
                <h3>📦 Информация о доставке</h3>
                ${deliveryInfo}
            </div>
            
            <div style="background-color: #e8f4e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3>🛒 Состав заказа</h3>
                ${itemsHtml}
                <div style="display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 2px solid #2c6e49; font-weight: bold;">
                    <span>ИТОГО:</span>
                    <span>${order.total} ₽</span>
                </div>
            </div>
            
            <p><strong>💳 Способ оплаты:</strong> ${order.paymentNote || 'Наличными/картой при получении'}</p>
        </div>
    `);
}

// Удаление заказа
async function deleteOrder(orderId) {
    if (confirm('Удалить заказ?')) {
        const result = await DB_MANAGER.deleteOrder(orderId);
        if (result) {
            showNotification('Заказ удален', 'success');
            loadOrders();
            updateStats();
        }
    }
}

// ============================================
// УПРАВЛЕНИЕ СООБЩЕНИЯМИ
// ============================================

// Загрузка сообщений
function loadMessages() {
    const tbody = document.getElementById('messagesTableBody');
    if (!tbody) return;

    const messages = DB_MANAGER.currentData?.messages || [];

    if (messages.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px;">Нет сообщений</td></tr>';
        return;
    }

    let html = '';
    messages.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(message => {
        const date = new Date(message.date).toLocaleString();
        const statusClass = message.status === 'new' ? 'status-new' : 'status-read';
        const statusText = message.status === 'new' ? '🆕 Новое' : '✓ Прочитано';

        html += `
            <tr id="message-${message.id}">
                <td>${date}</td>
                <td>${message.name}</td>
                <td>${message.email}</td>
                <td>${message.phone || '—'}</td>
                <td>
                    <div style="max-width: 300px; word-break: break-word;">
                        ${message.message}
                    </div>
                </td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td class="action-buttons">
                    <button onclick="markMessageAsRead('${message.id}')" class="btn-edit" ${message.status === 'read' ? 'disabled' : ''}>✓ Прочит.</button>
                    <button onclick="deleteMessage('${message.id}')" class="btn-delete">🗑️ Удал.</button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// Отметить сообщение как прочитанное
async function markMessageAsRead(messageId) {
    const result = await DB_MANAGER.markMessageAsRead(messageId);
    if (result) {
        showNotification('Сообщение отмечено как прочитанное', 'success');
        loadMessages();
        updateStats();
    }
}

// Удаление сообщения
async function deleteMessage(messageId) {
    if (confirm('Удалить сообщение?')) {
        const result = await DB_MANAGER.deleteMessage(messageId);
        if (result) {
            showNotification('Сообщение удалено', 'success');
            loadMessages();
            updateStats();
        }
    }
}

// ============================================
// СТАТИСТИКА
// ============================================

// Обновление статистики
function updateStats() {
    const stats = DB_MANAGER.getStats();

    const statsGrid = document.getElementById('statsGrid');
    if (statsGrid) {
        statsGrid.innerHTML = `
            <div class="stat-card">
                <h3>👥 Пользователи</h3>
                <div class="stat-value">${stats.totalUsers}</div>
                <div>👑 Админов: ${stats.adminCount}</div>
                <div>👤 Пользователей: ${stats.userCount}</div>
            </div>
            <div class="stat-card">
                <h3>📦 Товары</h3>
                <div class="stat-value">${stats.totalProducts}</div>
                <div>🍖 Корма: ${stats.productsByCategory?.food || 0}</div>
                <div>💊 Лекарства: ${stats.productsByCategory?.medicine || 0}</div>
                <div>🪀 Аксессуары: ${stats.productsByCategory?.accessories || 0}</div>
                <div>🧼 Гигиена: ${stats.productsByCategory?.hygiene || 0}</div>
            </div>
            <div class="stat-card">
                <h3>📋 Заказы</h3>
                <div class="stat-value">${stats.totalOrders}</div>
                <div>Сегодня: ${stats.todayOrders}</div>
                <div>Средний чек: ${stats.averageOrderValue} ₽</div>
            </div>
            <div class="stat-card">
                <h3>💬 Сообщения</h3>
                <div class="stat-value">${stats.totalMessages}</div>
                <div>Новых: ${stats.totalMessages}</div>
            </div>
            <div class="stat-card">
                <h3>💰 Выручка</h3>
                <div class="stat-value">${stats.totalRevenue} ₽</div>
                <div>Всего продано</div>
            </div>
        `;
    }
}

// ============================================
// РЕЗЕРВНЫЕ КОПИИ
// ============================================

// Загрузка списка бэкапов
function loadBackups() {
    const backupsList = document.getElementById('backupsList');
    if (!backupsList) return;

    const backups = JSON.parse(localStorage.getItem('backups')) || [];

    if (backups.length === 0) {
        backupsList.innerHTML = '<p style="text-align: center; color: #666; padding: 30px;">Нет сохраненных резервных копий</p>';
        return;
    }

    let html = '<ul class="backup-list">';
    backups.reverse().forEach((backup, index) => {
        const date = new Date(backup.date).toLocaleString();
        html += `
            <li>
                <div class="backup-info">
                    <strong>${backup.name}</strong><br>
                    <small>${date}</small><br>
                    <small>👥 ${backup.stats?.totalUsers || 0} пользователей</small>
                </div>
                <div class="backup-actions">
                    <button onclick="restoreBackup(${index})" class="btn-save">🔄 Восст.</button>
                    <button onclick="deleteBackup(${index})" class="btn-delete">🗑️ Удал.</button>
                </div>
            </li>
        `;
    });
    html += '</ul>';

    backupsList.innerHTML = html;
}

// Создание резервной копии
function createBackup() {
    const backup = DB_MANAGER.createBackup();
    showNotification('Резервная копия создана', 'success');
    loadBackups();
}

// Восстановление из бэкапа
async function restoreBackup(index) {
    if (!confirm('Восстановить данные из этой резервной копии? Текущие данные будут заменены.')) {
        return;
    }

    const backups = JSON.parse(localStorage.getItem('backups')) || [];
    const backup = backups[index];

    if (!backup) return;

    const result = await DB_MANAGER.restoreFromBackup(backup);
    if (result) {
        showNotification('Данные восстановлены', 'success');

        // Обновляем все панели
        loadUsers();
        loadProducts();
        loadOrders();
        loadMessages();
        updateStats();
    }
}

// Удаление бэкапа
function deleteBackup(index) {
    if (!confirm('Удалить эту резервную копию?')) return;

    let backups = JSON.parse(localStorage.getItem('backups')) || [];
    backups.splice(index, 1);
    localStorage.setItem('backups', JSON.stringify(backups));

    showNotification('Резервная копия удалена', 'success');
    loadBackups();
}

// Восстановление из последнего бэкапа
async function restoreFromBackup() {
    const backups = JSON.parse(localStorage.getItem('backups')) || [];
    if (backups.length === 0) {
        showNotification('Нет сохраненных резервных копий', 'error');
        return;
    }

    await restoreBackup(backups.length - 1);
}

// ============================================
// РАБОТА С ФАЙЛАМИ
// ============================================

// Экспорт базы данных
function exportDatabase() {
    const data = {
        users: DB_MANAGER.currentData.users,
        products: DB_MANAGER.currentData.products,
        orders: DB_MANAGER.currentData.orders,
        messages: DB_MANAGER.currentData.messages,
        settings: DB_MANAGER.currentData.settings,
        exportedAt: new Date().toISOString()
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `database-export-${new Date().toISOString().slice(0, 10)}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    showNotification('База данных экспортирована', 'success');
}

// Импорт базы данных
async function importDatabase(file) {
    const reader = new FileReader();

    reader.onload = async function (e) {
        try {
            const data = JSON.parse(e.target.result);

            // Восстанавливаем данные
            if (data.users) DB_MANAGER.currentData.users = data.users;
            if (data.products) DB_MANAGER.currentData.products = data.products;
            if (data.orders) DB_MANAGER.currentData.orders = data.orders;
            if (data.messages) DB_MANAGER.currentData.messages = data.messages;
            if (data.settings) DB_MANAGER.currentData.settings = data.settings;

            await DB_MANAGER.saveToServer();

            showNotification('База данных импортирована', 'success');

            // Обновляем все панели
            loadUsers();
            loadProducts();
            loadOrders();
            loadMessages();
            updateStats();

        } catch (error) {
            showNotification('Ошибка импорта: ' + error.message, 'error');
        }
    };

    reader.readAsText(file);
}

// Триггер для выбора файла
function triggerFileInput() {
    document.getElementById('fileInput').click();
}

// Обновление данных
async function refreshData() {
    await DB_MANAGER.loadDatabase();
    loadUsers();
    loadProducts();
    loadOrders();
    loadMessages();
    updateStats();
    showNotification('Данные обновлены', 'success');
}

// Сброс базы данных
async function resetDatabase() {
    if (confirm('Вы уверены? Все данные будут сброшены до начальных!')) {
        await DB_MANAGER.resetToDefault();
        await refreshData();
        showNotification('База данных сброшена', 'success');
    }
}

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

// Получение названия категории
function getCategoryName(category) {
    const categories = {
        'food': '🍖 Корма',
        'medicine': '💊 Лекарства',
        'accessories': '🪀 Аксессуары',
        'hygiene': '🧼 Гигиена'
    };
    return categories[category] || category;
}

// Показать уведомление
function showNotification(message, type = 'success') {
    if (window.showNotification) {
        window.showNotification(message, type);
    } else {
        alert(message);
    }
}

// Показать стилизованное окно
function showStyledAlert(content) {
    if (window.showStyledAlert) {
        window.showStyledAlert(content);
    } else {
        const div = document.createElement('div');
        div.innerHTML = content;
        alert(div.textContent);
    }
}

// Делаем функции глобальными
window.switchTab = switchTab;
window.searchUsers = searchUsers;
window.showAddUserForm = showAddUserForm;
window.hideAddUserForm = hideAddUserForm;
window.addUser = addUser;
window.editUser = editUser;
window.saveUserEdit = saveUserEdit;
window.cancelUserEdit = cancelUserEdit;
window.deleteUser = deleteUser;
window.searchProducts = searchProducts;
window.showAddProductForm = showAddProductForm;
window.hideAddProductForm = hideAddProductForm;
window.addProduct = addProduct;
window.editProduct = editProduct;
window.saveProductEdit = saveProductEdit;
window.cancelProductEdit = cancelProductEdit;
window.deleteProduct = deleteProduct;
window.searchOrders = searchOrders;
window.viewOrderDetails = viewOrderDetails;
window.deleteOrder = deleteOrder;
window.loadMessages = loadMessages;
window.markMessageAsRead = markMessageAsRead;
window.deleteMessage = deleteMessage;
window.exportDatabase = exportDatabase;
window.triggerFileInput = triggerFileInput;
window.importDatabase = importDatabase;
window.refreshData = refreshData;
window.createBackup = createBackup;
window.restoreFromBackup = restoreFromBackup;
window.restoreBackup = restoreBackup;
window.deleteBackup = deleteBackup;
window.resetDatabase = resetDatabase;