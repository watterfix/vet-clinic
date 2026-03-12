// ============================================
// СКРИПТ ДЛЯ УПРАВЛЕНИЯ БАЗОЙ ДАННЫХ (db-viewer)
// ============================================

// Глобальные переменные
let currentUser = null;
let backups = [];
let isInitialized = false;

// Проверка прав администратора
function checkAdminAccess() {
    const adminWarning = document.getElementById('adminCheck');
    if (!adminWarning) return false;

    currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (!currentUser || currentUser.role !== 'admin') {
        adminWarning.style.display = 'block';
        adminWarning.innerHTML = '⚠️ Доступ запрещен! Только администратор может просматривать эту страницу.';
        adminWarning.style.backgroundColor = '#dc3545';
        adminWarning.style.color = 'white';
        adminWarning.style.borderColor = '#dc3545';

        // Скрываем все панели и кнопки
        document.querySelectorAll('.db-panel, .export-buttons, .import-area, .db-tabs').forEach(el => {
            if (el) el.style.display = 'none';
        });

        return false;
    } else {
        adminWarning.style.display = 'none';
        return true;
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
    if (!checkAdminAccess()) return;

    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    let html = '';
    const users = DB_MANAGER.currentData.users || {};

    if (Object.keys(users).length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px;">Нет пользователей</td></tr>';
        return;
    }

    Object.keys(users).sort().forEach(email => {
        const user = users[email];
        const safeEmail = email.replace(/[@.]/g, '_');
        const registered = user.registered ? new Date(user.registered).toLocaleString() : 'Н/Д';
        const roleClass = user.role === 'admin' ? 'role-admin' : 'role-user';
        const roleText = user.role === 'admin' ? '👑 Админ' : '👤 Пользователь';

        html += `
            <tr id="user-${safeEmail}">
                <td>${email}</td>
                <td>${user.name}</td>
                <td><span class="role-badge ${roleClass}">${roleText}</span></td>
                <td>${registered}</td>
                <td class="action-buttons">
                    <button onclick="editUser('${email}')" class="btn-edit">✏️ Ред.</button>
                    <button onclick="deleteUser('${email}')" class="btn-delete" ${email === 'admin@vetclinic.ru' ? 'disabled' : ''}>🗑️ Удал.</button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// Поиск пользователей
function searchUsers() {
    if (!checkAdminAccess()) return;

    const searchText = document.getElementById('userSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#usersTableBody tr');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchText) ? '' : 'none';
    });
}

// Показать форму добавления пользователя
function showAddUserForm() {
    if (!checkAdminAccess()) return;
    document.getElementById('addUserForm').style.display = 'block';
}

// Скрыть форму добавления пользователя
function hideAddUserForm() {
    document.getElementById('addUserForm').style.display = 'none';
}

// Добавление пользователя
function addUser() {
    if (!checkAdminAccess()) return;

    const name = document.getElementById('newUserName').value;
    const email = document.getElementById('newUserEmail').value;
    const password = document.getElementById('newUserPassword').value;
    const role = document.getElementById('newUserRole').value;

    if (!name || !email || !password) {
        showNotification('Заполните все поля!', 'error');
        return;
    }

    // Проверяем существование
    const users = DB_MANAGER.currentData.users || {};
    if (users[email]) {
        showNotification('Пользователь с таким email уже существует!', 'error');
        return;
    }

    // Добавляем через DB_MANAGER
    const result = DB_MANAGER.addUser({
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

        // Очищаем форму
        document.getElementById('newUserName').value = '';
        document.getElementById('newUserEmail').value = '';
        document.getElementById('newUserPassword').value = '';
    } else {
        showNotification('Ошибка при добавлении', 'error');
    }
}

// Редактирование пользователя
function editUser(email) {
    if (!checkAdminAccess()) return;

    const safeEmail = email.replace(/[@.]/g, '_');
    const row = document.getElementById(`user-${safeEmail}`);
    const user = DB_MANAGER.currentData.users[email];

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
function saveUserEdit(email) {
    if (!checkAdminAccess()) return;

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

    if (DB_MANAGER.updateUser(email, updateData)) {
        showNotification('Пользователь обновлен', 'success');
        loadUsers();
    } else {
        showNotification('Ошибка обновления', 'error');
    }
}

// Отмена редактирования пользователя
function cancelUserEdit(email) {
    loadUsers();
}

// Удаление пользователя
function deleteUser(email) {
    if (!checkAdminAccess()) return;

    if (email === 'admin@vetclinic.ru') {
        showNotification('Нельзя удалить главного администратора!', 'error');
        return;
    }

    if (confirm(`Удалить пользователя ${email}?`)) {
        if (DB_MANAGER.deleteUser(email)) {
            showNotification('Пользователь удален', 'success');
            loadUsers();
            updateStats();
        } else {
            showNotification('Ошибка удаления', 'error');
        }
    }
}

// ============================================
// УПРАВЛЕНИЕ ТОВАРАМИ
// ============================================

// Загрузка товаров
function loadProducts() {
    if (!checkAdminAccess()) return;

    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

    let html = '';
    const products = DB_MANAGER.currentData.products || {};

    if (Object.keys(products).length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px;">Нет товаров</td></tr>';
        return;
    }

    Object.keys(products).sort().forEach(id => {
        const product = products[id];
        const categoryClass = `category-${product.category}`;
        const categoryName = getCategoryName(product.category);

        html += `
            <tr id="product-${id}">
                <td><code>${id}</code></td>
                <td><strong>${product.name}</strong></td>
                <td><strong style="color: #2c6e49;">${product.price} ₽</strong></td>
                <td><span class="category-badge ${categoryClass}">${categoryName}</span></td>
                <td>${product.description || '—'}</td>
                <td class="action-buttons">
                    <button onclick="editProduct('${id}')" class="btn-edit">✏️ Ред.</button>
                    <button onclick="deleteProduct('${id}')" class="btn-delete">🗑️ Удал.</button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// Поиск товаров
function searchProducts() {
    if (!checkAdminAccess()) return;

    const searchText = document.getElementById('productSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#productsTableBody tr');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchText) ? '' : 'none';
    });
}

// Показать форму добавления товара
function showAddProductForm() {
    if (!checkAdminAccess()) return;
    document.getElementById('addProductForm').style.display = 'block';
}

// Скрыть форму добавления товара
function hideAddProductForm() {
    document.getElementById('addProductForm').style.display = 'none';
}

// Добавление товара
function addProduct() {
    if (!checkAdminAccess()) return;

    const id = document.getElementById('newProductId').value;
    const name = document.getElementById('newProductName').value;
    const price = document.getElementById('newProductPrice').value;
    const category = document.getElementById('newProductCategory').value;
    const description = document.getElementById('newProductDescription').value;

    if (!id || !name || !price) {
        showNotification('Заполните обязательные поля!', 'error');
        return;
    }

    const products = DB_MANAGER.currentData.products || {};
    if (products[id]) {
        showNotification('Товар с таким ID уже существует!', 'error');
        return;
    }

    const result = DB_MANAGER.addProduct(id, {
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

        // Очищаем форму
        document.getElementById('newProductId').value = '';
        document.getElementById('newProductName').value = '';
        document.getElementById('newProductPrice').value = '';
        document.getElementById('newProductDescription').value = '';
    } else {
        showNotification('Ошибка при добавлении', 'error');
    }
}

// Редактирование товара
function editProduct(productId) {
    if (!checkAdminAccess()) return;

    const row = document.getElementById(`product-${productId}`);
    const product = DB_MANAGER.currentData.products[productId];

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
function saveProductEdit(productId) {
    if (!checkAdminAccess()) return;

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

    if (DB_MANAGER.updateProduct(productId, updateData)) {
        showNotification('Товар обновлен', 'success');
        loadProducts();
    } else {
        showNotification('Ошибка обновления', 'error');
    }
}

// Отмена редактирования товара
function cancelProductEdit(productId) {
    loadProducts();
}

// Удаление товара
function deleteProduct(productId) {
    if (!checkAdminAccess()) return;

    const product = DB_MANAGER.currentData.products[productId];
    if (!product) return;

    if (confirm(`Удалить товар "${product.name}"?`)) {
        if (DB_MANAGER.deleteProduct(productId)) {
            showNotification('Товар удален', 'success');
            loadProducts();
            updateStats();
        } else {
            showNotification('Ошибка удаления', 'error');
        }
    }
}

// ============================================
// УПРАВЛЕНИЕ ЗАКАЗАМИ
// ============================================

// Загрузка заказов
function loadOrders() {
    if (!checkAdminAccess()) return;

    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;

    let html = '';
    const orders = DB_MANAGER.currentData.orders || [];

    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 30px;">Нет заказов</td></tr>';
        return;
    }

    orders.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(order => {
        const date = new Date(order.date).toLocaleString();
        const deliveryType = order.delivery === 'pickup' ? '🚶 Самовывоз' : '🚚 Доставка';

        html += `
            <tr id="order-${order.id}">
                <td><strong>#${order.orderNumber}</strong></td>
                <td>${date}</td>
                <td>${order.userName}<br><small style="color: #666;">${order.user}</small></td>
                <td><strong style="color: #2c6e49;">${order.total} ₽</strong></td>
                <td>${deliveryType}</td>
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
    if (!checkAdminAccess()) return;

    const searchText = document.getElementById('orderSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#ordersTableBody tr');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchText) ? '' : 'none';
    });
}

// Просмотр деталей заказа
function viewOrderDetails(orderId) {
    if (!checkAdminAccess()) return;

    const order = DB_MANAGER.currentData.orders.find(o => o.id == orderId);
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
            <p><strong>📍 Адрес самовывоза:</strong> ${order.pickupAddress}</p>
            <p><strong>📞 Телефон:</strong> ${order.pickupPhone}</p>
        `;
    } else {
        deliveryInfo = `
            <p><strong>🚚 Адрес доставки:</strong> ${order.deliveryAddress}</p>
            <p><strong>📞 Телефон:</strong> ${order.deliveryPhone}</p>
            ${order.deliveryComment ? `<p><strong>💬 Комментарий:</strong> ${order.deliveryComment}</p>` : ''}
        `;
    }

    showStyledAlert(`
        <div style="text-align: center;">
            <h2 style="color: #2c6e49;">Заказ #${order.orderNumber}</h2>
            <p><strong>Дата:</strong> ${new Date(order.date).toLocaleString()}</p>
            <p><strong>Пользователь:</strong> ${order.userName} (${order.user})</p>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: left;">
                <h3>Информация о доставке</h3>
                ${deliveryInfo}
            </div>
            
            <div style="background-color: #e8f4e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3>Состав заказа</h3>
                ${itemsHtml}
                <div style="display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 2px solid #2c6e49; font-weight: bold;">
                    <span>ИТОГО:</span>
                    <span>${order.total} ₽</span>
                </div>
            </div>
            
            <p><strong>Способ оплаты:</strong> ${order.paymentNote}</p>
        </div>
    `);
}

// Удаление заказа
function deleteOrder(orderId) {
    if (!checkAdminAccess()) return;

    if (confirm('Удалить заказ?')) {
        if (DB_MANAGER.deleteOrder(orderId)) {
            showNotification('Заказ удален', 'success');
            loadOrders();
            updateStats();
        } else {
            showNotification('Ошибка удаления', 'error');
        }
    }
}

// ============================================
// СТАТИСТИКА
// ============================================

// Обновление статистики
function updateStats() {
    if (!checkAdminAccess()) return;

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
    if (!checkAdminAccess()) return;

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
                    <small>${date} | Пользователей: ${backup.stats?.users || 0} | Товаров: ${backup.stats?.products || 0} | Заказов: ${backup.stats?.orders || 0}</small>
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
    if (!checkAdminAccess()) return;

    const stats = DB_MANAGER.getStats();
    const backup = {
        id: Date.now(),
        name: `Backup ${new Date().toLocaleString()}`,
        date: new Date().toISOString(),
        data: {
            users: DB_MANAGER.currentData.users,
            products: DB_MANAGER.currentData.products,
            orders: DB_MANAGER.currentData.orders,
            settings: DB_MANAGER.currentData.settings
        },
        stats: {
            users: stats.totalUsers,
            products: stats.totalProducts,
            orders: stats.totalOrders
        }
    };

    let backups = JSON.parse(localStorage.getItem('backups')) || [];
    backups.push(backup);
    localStorage.setItem('backups', JSON.stringify(backups));

    showNotification('Резервная копия создана', 'success');
    loadBackups();
}

// Восстановление из бэкапа
function restoreBackup(index) {
    if (!checkAdminAccess()) return;

    if (!confirm('Восстановить данные из этой резервной копии? Текущие данные будут заменены.')) {
        return;
    }

    const backups = JSON.parse(localStorage.getItem('backups')) || [];
    const backup = backups[index];

    if (!backup) return;

    // Восстанавливаем данные
    localStorage.setItem('users', JSON.stringify(backup.data.users));
    localStorage.setItem('products', JSON.stringify(backup.data.products));
    localStorage.setItem('orders', JSON.stringify(backup.data.orders));
    localStorage.setItem('settings', JSON.stringify(backup.data.settings));

    // Обновляем DB_MANAGER
    DB_MANAGER.currentData = backup.data;

    showNotification('Данные восстановлены', 'success');

    // Обновляем все панели
    loadUsers();
    loadProducts();
    loadOrders();
    updateStats();
}

// Удаление бэкапа
function deleteBackup(index) {
    if (!checkAdminAccess()) return;

    if (!confirm('Удалить эту резервную копию?')) return;

    let backups = JSON.parse(localStorage.getItem('backups')) || [];
    backups.splice(index, 1);
    localStorage.setItem('backups', JSON.stringify(backups));

    showNotification('Резервная копия удалена', 'success');
    loadBackups();
}

// Восстановление из последнего бэкапа
function restoreFromBackup() {
    if (!checkAdminAccess()) return;

    const backups = JSON.parse(localStorage.getItem('backups')) || [];
    if (backups.length === 0) {
        showNotification('Нет сохраненных резервных копий', 'error');
        return;
    }

    restoreBackup(backups.length - 1);
}

// ============================================
// РАБОТА С ФАЙЛАМИ
// ============================================

// Экспорт базы данных
function exportDatabase() {
    if (!checkAdminAccess()) return;
    DB_MANAGER.exportDatabase();
}

// Импорт базы данных
function importDatabase(file) {
    if (!checkAdminAccess()) return;

    DB_MANAGER.importDatabase(file)
        .then(data => {
            const fileInfo = document.getElementById('fileInfo');
            if (fileInfo) {
                fileInfo.style.display = 'block';
                fileInfo.innerHTML = `
                    ✅ Файл успешно загружен!<br>
                    Пользователей: ${Object.keys(data.users).length}<br>
                    Товаров: ${Object.keys(data.products).length}<br>
                    Заказов: ${data.orders ? data.orders.length : 0}
                `;
                fileInfo.style.backgroundColor = '#d4edda';
                fileInfo.style.color = '#155724';
                fileInfo.style.border = '2px solid #c3e6cb';
            }

            // Обновляем все панели
            loadUsers();
            loadProducts();
            loadOrders();
            updateStats();

            showNotification('База данных импортирована', 'success');

            setTimeout(() => {
                if (fileInfo) fileInfo.style.display = 'none';
            }, 5000);
        })
        .catch(error => {
            const fileInfo = document.getElementById('fileInfo');
            if (fileInfo) {
                fileInfo.style.display = 'block';
                fileInfo.innerHTML = `❌ Ошибка: ${error.message}`;
                fileInfo.style.backgroundColor = '#f8d7da';
                fileInfo.style.color = '#721c24';
                fileInfo.style.border = '2px solid #f5c6cb';
            }
            showNotification('Ошибка импорта', 'error');
        });
}

// Триггер для выбора файла
function triggerFileInput() {
    if (!checkAdminAccess()) return;
    document.getElementById('fileInput').click();
}

// Обновление данных
function refreshData() {
    if (!checkAdminAccess()) return;

    DB_MANAGER.loadDatabase().then(() => {
        loadUsers();
        loadProducts();
        loadOrders();
        updateStats();
        showNotification('Данные обновлены', 'success');
    });
}

// Сброс базы данных
function resetDatabase() {
    if (!checkAdminAccess()) return;

    if (confirm('Вы уверены? Все данные будут сброшены до начальных!')) {
        DB_MANAGER.resetToDefault();
        refreshData();
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

// Показать уведомление (используем глобальную функцию)
function showNotification(message, type = 'success') {
    if (window.showNotification) {
        window.showNotification(message, type);
    } else {
        console.log(message);
        alert(message);
    }
}

// Показать стилизованное окно (используем глобальную функцию)
function showStyledAlert(content) {
    if (window.showStyledAlert) {
        window.showStyledAlert(content);
    } else {
        alert('Просмотр деталей (стилизованное окно не доступно)');
    }
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

// Инициализация страницы
async function initPage() {
    console.log('Инициализация страницы управления БД...');

    // Ждем загрузки DOM
    if (document.readyState === 'loading') {
        await new Promise(resolve => {
            document.addEventListener('DOMContentLoaded', resolve);
        });
    }

    // Проверяем наличие необходимых элементов
    const adminCheck = document.getElementById('adminCheck');
    if (!adminCheck) {
        console.error('Элемент adminCheck не найден!');
        return;
    }

    // Ждем загрузки DB_MANAGER
    if (!window.DB_MANAGER) {
        console.log('Ожидание DB_MANAGER...');
        await new Promise(resolve => {
            const checkInterval = setInterval(() => {
                if (window.DB_MANAGER) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        });
    }

    console.log('DB_MANAGER загружен');

    // Проверяем права доступа
    const hasAccess = checkAdminAccess();
    console.log('Права доступа:', hasAccess);

    if (!hasAccess) {
        return;
    }

    // Загружаем данные
    await DB_MANAGER.loadDatabase();
    console.log('Данные загружены');

    // Загружаем начальные данные
    loadUsers();
    loadProducts();
    loadOrders();
    updateStats();
    loadBackups();

    console.log('Страница управления БД инициализирована');
}

// Запускаем инициализацию
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
} else {
    initPage();
}

// Делаем функции глобальными для доступа из HTML
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
window.exportDatabase = exportDatabase;
window.triggerFileInput = triggerFileInput;
window.importDatabase = importDatabase;
window.refreshData = refreshData;
window.createBackup = createBackup;
window.restoreFromBackup = restoreFromBackup;
window.restoreBackup = restoreBackup;
window.deleteBackup = deleteBackup;
window.resetDatabase = resetDatabase;