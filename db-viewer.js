// ============================================
// СКРИПТ ДЛЯ УПРАВЛЕНИЯ БАЗОЙ ДАННЫХ (db-viewer)
// ============================================

console.log('📊 db-viewer.js загружен');

// Глобальные переменные
let adminCurrentUser = null;

// Ждем полной загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM загружен, инициализация админ-панели...');
    
    // Даем время на загрузку всех скриптов
    setTimeout(initAdminPage, 500);
});

// Функция инициализации
async function initAdminPage() {
    console.log('Инициализация админ-панели...');
    
    const adminCheck = document.getElementById('adminCheck');
    if (!adminCheck) return;
    
    adminCheck.style.display = 'block';
    adminCheck.innerHTML = '⏳ Проверка подключения...';
    adminCheck.style.backgroundColor = '#ffc107';
    adminCheck.style.color = '#1e4d2f';
    
    // Проверяем наличие DB_MANAGER
    if (typeof DB_MANAGER === 'undefined') {
        console.error('❌ DB_MANAGER не загружен!');
        adminCheck.innerHTML = '❌ Ошибка: DB_MANAGER не загружен';
        adminCheck.style.backgroundColor = '#dc3545';
        adminCheck.style.color = 'white';
        return;
    }
    
    try {
        // Ждем инициализацию
        await DB_MANAGER.waitForInit();
        
        // Проверяем права администратора
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        if (!currentUser) {
            adminCheck.innerHTML = '⚠️ Необходимо войти в систему!';
            adminCheck.style.backgroundColor = '#dc3545';
            adminCheck.style.color = 'white';
            return;
        }
        
        if (currentUser.role !== 'admin') {
            adminCheck.innerHTML = '⚠️ Доступ запрещен! Только администратор';
            adminCheck.style.backgroundColor = '#dc3545';
            adminCheck.style.color = 'white';
            return;
        }
        
        adminCheck.innerHTML = '⏳ Загрузка данных...';
        
        // Загружаем данные
        await DB_MANAGER.loadDatabase();
        
        // Загружаем все панели
        loadUsers();
        loadProducts();
        loadOrders();
        loadMessages();
        updateStats();
        loadBackups();
        
        // Показываем интерфейс
        document.querySelectorAll('.db-panel, .export-buttons, .import-area, .db-tabs').forEach(el => {
            if (el) el.style.display = '';
        });
        
        adminCheck.style.display = 'none';
        console.log('✅ Админ-панель готова');
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
        adminCheck.innerHTML = `❌ Ошибка: ${error.message}`;
        adminCheck.style.backgroundColor = '#dc3545';
        adminCheck.style.color = 'white';
    }
}

// ============================================
// ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК
// ============================================

function switchTab(tabName) {
    document.querySelectorAll('.db-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');

    document.querySelectorAll('.db-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    const panel = document.getElementById(tabName + 'Panel');
    if (panel) panel.classList.add('active');

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
        case 'messages':
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
                    <button onclick="deleteUser('${user.email}')" class="btn-delete" ${user.email === 'admin@vetclinic.ru' ? 'disabled' : ''}>🗑️ Удалить</button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

function searchUsers() {
    const searchText = document.getElementById('userSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#usersTableBody tr');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchText) ? '' : 'none';
    });
}

async function deleteUser(email) {
    if (email === 'admin@vetclinic.ru') {
        showNotification('Нельзя удалить главного администратора!', 'error');
        return;
    }

    if (confirm(`Удалить пользователя ${email}?`)) {
        try {
            await DB_MANAGER.deleteUser(email);
            showNotification('Пользователь удален', 'success');
            // Принудительно перезагружаем данные
            await DB_MANAGER.loadDatabase();
            loadUsers();
            updateStats();
        } catch (error) {
            console.error('Ошибка удаления:', error);
            showNotification('Ошибка при удалении', 'error');
        }
    }
}

// ============================================
// УПРАВЛЕНИЕ ТОВАРАМИ
// ============================================

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
                <td>${product.name}</td>
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

function searchProducts() {
    const searchText = document.getElementById('productSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#productsTableBody tr');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchText) ? '' : 'none';
    });
}

function showAddProductForm() {
    document.getElementById('addProductForm').style.display = 'block';
}

function hideAddProductForm() {
    document.getElementById('addProductForm').style.display = 'none';
}

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

    try {
        await DB_MANAGER.addProduct({
            id: id,
            name: name,
            price: parseInt(price),
            category: category,
            description: description
        });

        showNotification('Товар добавлен!', 'success');
        hideAddProductForm();
        await DB_MANAGER.loadDatabase();
        loadProducts();
        updateStats();

        document.getElementById('newProductId').value = '';
        document.getElementById('newProductName').value = '';
        document.getElementById('newProductPrice').value = '';
        document.getElementById('newProductDescription').value = '';
        
    } catch (error) {
        console.error('Ошибка добавления товара:', error);
        showNotification('Ошибка при добавлении товара', 'error');
    }
}

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
            <button onclick="saveProductEdit('${productId}')" class="btn-save">💾 Сохранить</button>
            <button onclick="cancelProductEdit('${productId}')" class="btn-delete">Отмена</button>
        </td>
    `;
}

async function saveProductEdit(productId) {
    const newName = document.getElementById(`edit-product-name-${productId}`).value;
    const newPrice = document.getElementById(`edit-product-price-${productId}`).value;
    const newCategory = document.getElementById(`edit-product-category-${productId}`).value;
    const newDesc = document.getElementById(`edit-product-desc-${productId}`).value;

    try {
        await DB_MANAGER.updateProduct(productId, {
            name: newName,
            price: parseInt(newPrice),
            category: newCategory,
            description: newDesc
        });

        showNotification('Товар обновлен', 'success');
        await DB_MANAGER.loadDatabase();
        loadProducts();
        
    } catch (error) {
        console.error('Ошибка обновления товара:', error);
        showNotification('Ошибка при обновлении', 'error');
    }
}

function cancelProductEdit(productId) {
    loadProducts();
}

async function deleteProduct(productId) {
    const product = DB_MANAGER.currentData?.products.find(p => p.id === productId);
    if (!product) return;

    if (confirm(`Удалить товар "${product.name}"?`)) {
        try {
            await DB_MANAGER.deleteProduct(productId);
            showNotification('Товар удален', 'success');
            await DB_MANAGER.loadDatabase();
            loadProducts();
            updateStats();
        } catch (error) {
            console.error('Ошибка удаления:', error);
            showNotification('Ошибка при удалении', 'error');
        }
    }
}

// ============================================
// УПРАВЛЕНИЕ ЗАКАЗАМИ - ИСПРАВЛЕННАЯ ВЕРСИЯ
// ============================================

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

        let deliveryAddress = '';
        if (order.delivery === 'pickup') {
            deliveryAddress = '🚶 Самовывоз';
        } else {
            deliveryAddress = `🚚 ${order.delivery_address || 'Адрес не указан'}`;
        }

        const phone = order.delivery_phone || order.pickup_phone || 'Не указан';

        html += `
            <tr id="order-${order.id}">
                <td><strong>#${order.order_number || 'Н/Д'}</strong></td>
                <td>${date}</td>
                <td>
                    ${order.user_name}<br>
                    <small>${order.user_email}</small>
                </td>
                <td><strong>${order.total} ₽</strong></td>
                <td>${order.delivery === 'pickup' ? '🚶 Самовывоз' : '🚚 Доставка'}</td>
                <td>${deliveryAddress}</td>
                <td>${order.items ? order.items.length : 0} шт.</td>
                <td class="action-buttons">
                    <button onclick="viewOrderDetails('${order.id}')" class="btn-view">👁️ Детали</button>
                    <button onclick="deleteOrder('${order.id}')" class="btn-delete">🗑️ Удалить</button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

function searchOrders() {
    const searchText = document.getElementById('orderSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#ordersTableBody tr');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchText) ? '' : 'none';
    });
}

function viewOrderDetails(orderId) {
    const order = DB_MANAGER.currentData?.orders.find(o => o.id == orderId);
    if (!order) return;

    let itemsList = '';
    if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
            itemsList += `${item.name} - ${item.price} ₽\n`;
        });
    }

    alert(`Заказ #${order.order_number || 'Н/Д'}
        
Дата: ${new Date(order.date).toLocaleString()}
Клиент: ${order.user_name} (${order.user_email})

Состав заказа:
${itemsList || 'Нет товаров'}
Сумма: ${order.total || 0} ₽

Доставка: ${order.delivery === 'pickup' ? 'Самовывоз' : 'Доставка'}
${order.delivery_address ? 'Адрес: ' + order.delivery_address : ''}
${order.delivery_phone ? 'Телефон: ' + order.delivery_phone : ''}`);
}

// ============================================
// УПРАВЛЕНИЕ ЗАКАЗАМИ - ИСПРАВЛЕННАЯ ВЕРСИЯ
// ============================================

async function deleteOrder(orderId) {
    console.log('Попытка удаления заказа:', orderId);
    
    // Спрашиваем подтверждение
    if (!confirm('Вы уверены, что хотите удалить этот заказ?')) {
        return;
    }
    
    try {
        // Показываем индикатор загрузки на кнопке
        const deleteBtn = event?.target;
        const originalText = deleteBtn?.textContent;
        if (deleteBtn) {
            deleteBtn.textContent = 'Удаление...';
            deleteBtn.disabled = true;
        }
        
        // Проверяем наличие метода
        if (typeof DB_MANAGER.deleteOrder !== 'function') {
            throw new Error('Метод удаления заказов не найден');
        }
        
        // Удаляем заказ
        const result = await DB_MANAGER.deleteOrder(orderId);
        
        if (result) {
            showNotification('Заказ успешно удален', 'success');
            
            // Принудительно перезагружаем данные
            await DB_MANAGER.loadDatabase();
            
            // Обновляем отображение
            loadOrders();
            updateStats();
            
            console.log('✅ Заказ удален, таблица обновлена');
        } else {
            throw new Error('Не удалось удалить заказ');
        }
        
    } catch (error) {
        console.error('❌ Ошибка удаления заказа:', error);
        showNotification('Ошибка при удалении: ' + error.message, 'error');
    } finally {
        // Возвращаем кнопку в исходное состояние
        const deleteBtn = event?.target;
        if (deleteBtn) {
            deleteBtn.textContent = originalText || '🗑️ Удалить';
            deleteBtn.disabled = false;
        }
    }
}

// ============================================
// УПРАВЛЕНИЕ СООБЩЕНИЯМИ - ИСПРАВЛЕННАЯ ВЕРСИЯ
// ============================================

function loadMessages() {
    const tbody = document.getElementById('messagesTableBody');
    if (!tbody) return;

    const messages = DB_MANAGER.currentData?.messages || [];

    if (messages.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 30px;">Нет сообщений</td></tr>';
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
                <td>${message.message}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td class="action-buttons">
                    <button onclick="markMessageAsRead('${message.id}')" class="btn-edit" ${message.status === 'read' ? 'disabled' : ''}>✓ Прочитать</button>
                    <button onclick="deleteMessage('${message.id}')" class="btn-delete">🗑️ Удалить</button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

async function markMessageAsRead(messageId) {
    try {
        if (typeof DB_MANAGER.markMessageAsRead === 'function') {
            await DB_MANAGER.markMessageAsRead(messageId);
            showNotification('Сообщение отмечено как прочитанное', 'success');
            await DB_MANAGER.loadDatabase();
            loadMessages();
            updateStats();
        } else {
            console.error('Метод markMessageAsRead не найден в DB_MANAGER');
            showNotification('Ошибка: метод не найден', 'error');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showNotification('Ошибка при отметке', 'error');
    }
}

async function deleteMessage(messageId) {
    if (confirm('Удалить сообщение?')) {
        try {
            if (typeof DB_MANAGER.deleteMessage === 'function') {
                await DB_MANAGER.deleteMessage(messageId);
                showNotification('Сообщение удалено', 'success');
                await DB_MANAGER.loadDatabase();
                loadMessages();
                updateStats();
            } else {
                console.error('Метод deleteMessage не найден в DB_MANAGER');
                showNotification('Ошибка: метод удаления не найден', 'error');
            }
        } catch (error) {
            console.error('Ошибка удаления:', error);
            showNotification('Ошибка при удалении', 'error');
        }
    }
}

// ============================================
// СТАТИСТИКА
// ============================================

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
            </div>
            <div class="stat-card">
                <h3>💰 Выручка</h3>
                <div class="stat-value">${stats.totalRevenue} ₽</div>
            </div>
        `;
    }
}

// ============================================
// РЕЗЕРВНЫЕ КОПИИ
// ============================================

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
                    <small>${date}</small>
                </div>
                <div class="backup-actions">
                    <button onclick="restoreBackup(${index})" class="btn-save">🔄 Восстановить</button>
                    <button onclick="deleteBackup(${index})" class="btn-delete">🗑️ Удалить</button>
                </div>
            </li>
        `;
    });
    html += '</ul>';

    backupsList.innerHTML = html;
}

function createBackup() {
    const stats = DB_MANAGER.getStats();
    const backup = {
        id: Date.now(),
        name: `Backup ${new Date().toLocaleString()}`,
        date: new Date().toISOString(),
        data: {
            users: DB_MANAGER.currentData.users,
            products: DB_MANAGER.currentData.products,
            orders: DB_MANAGER.currentData.orders,
            messages: DB_MANAGER.currentData.messages
        },
        stats: stats
    };

    let backups = JSON.parse(localStorage.getItem('backups')) || [];
    backups.push(backup);
    if (backups.length > 10) backups = backups.slice(-10);
    localStorage.setItem('backups', JSON.stringify(backups));

    showNotification('Резервная копия создана', 'success');
    loadBackups();
}

function deleteBackup(index) {
    if (!confirm('Удалить эту резервную копию?')) return;

    let backups = JSON.parse(localStorage.getItem('backups')) || [];
    backups.splice(index, 1);
    localStorage.setItem('backups', JSON.stringify(backups));

    showNotification('Резервная копия удалена', 'success');
    loadBackups();
}

// ============================================
// РАБОТА С ФАЙЛАМИ
// ============================================

function exportDatabase() {
    const data = {
        users: DB_MANAGER.currentData.users,
        products: DB_MANAGER.currentData.products,
        orders: DB_MANAGER.currentData.orders,
        messages: DB_MANAGER.currentData.messages,
        exportedAt: new Date().toISOString()
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const fileName = `database-export-${new Date().toISOString().slice(0, 10)}.json`;

    const link = document.createElement('a');
    link.href = dataUri;
    link.download = fileName;
    link.click();

    showNotification('База данных экспортирована', 'success');
}

function triggerFileInput() {
    document.getElementById('fileInput').click();
}

async function refreshData() {
    await DB_MANAGER.loadDatabase();
    loadUsers();
    loadProducts();
    loadOrders();
    loadMessages();
    updateStats();
    showNotification('Данные обновлены', 'success');
}

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

function getCategoryName(category) {
    const categories = {
        'food': '🍖 Корма',
        'medicine': '💊 Лекарства',
        'accessories': '🪀 Аксессуары',
        'hygiene': '🧼 Гигиена'
    };
    return categories[category] || category;
}

function showNotification(message, type = 'success') {
    if (window.showNotification) {
        window.showNotification(message, type);
    } else {
        alert(message);
    }
}

// Добавьте в конец файла db-viewer.js (после других функций, но перед window)

// Слушаем обновления сообщений
window.addEventListener('storage', function(e) {
    if (e.key === 'message_update_timestamp') {
        console.log('💬 Получен сигнал обновления сообщений');
        
        // Если мы на вкладке сообщений, обновляем их
        if (document.getElementById('messagesPanel')?.classList.contains('active')) {
            setTimeout(async () => {
                await DB_MANAGER.loadMessages();
                loadMessages();
                updateStats();
                showNotification('Сообщения обновлены', 'success');
            }, 500);
        }
    }
});

// Делаем функции глобальными
window.switchTab = switchTab;
window.searchUsers = searchUsers;
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
window.refreshData = refreshData;
window.createBackup = createBackup;
window.deleteBackup = deleteBackup;
