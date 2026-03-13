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
// СТИЛИЗОВАННОЕ ОКНО ПОДТВЕРЖДЕНИЯ
// ============================================

function showConfirmDialog(options) {
    const {
        title = 'Подтверждение',
        message = 'Вы уверены?',
        confirmText = 'Да',
        cancelText = 'Нет',
        type = 'warning', // warning, danger, info
        icon = '⚠️',
        onConfirm,
        onCancel
    } = options;

    // Создаем затемненный фон
    const overlay = document.createElement('div');
    overlay.className = 'confirm-modal-overlay';

    // Определяем иконку по умолчанию
    let defaultIcon = icon;
    if (!icon) {
        switch(type) {
            case 'danger':
                defaultIcon = '❌';
                break;
            case 'info':
                defaultIcon = 'ℹ️';
                break;
            default:
                defaultIcon = '⚠️';
        }
    }

    // Создаем содержимое
    overlay.innerHTML = `
        <div class="confirm-modal">
            <div class="confirm-icon ${type}">${defaultIcon}</div>
            <div class="confirm-title ${type}">${title}</div>
            <div class="confirm-message">${message}</div>
            <div class="confirm-buttons">
                <button class="confirm-btn confirm-btn-${type === 'danger' ? 'danger' : 'confirm'}" id="confirmYes">
                    ${confirmText}
                </button>
                <button class="confirm-btn confirm-btn-cancel" id="confirmNo">
                    ${cancelText}
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Обработчики кнопок
    document.getElementById('confirmYes').onclick = () => {
        overlay.remove();
        if (onConfirm) onConfirm();
    };

    document.getElementById('confirmNo').onclick = () => {
        overlay.remove();
        if (onCancel) onCancel();
    };

    // Закрытие по клику на фон
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
            if (onCancel) onCancel();
        }
    });
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
        showConfirmDialog({
            title: 'Ошибка',
            message: 'Нельзя удалить главного администратора!',
            confirmText: 'OK',
            cancelText: '',
            type: 'danger',
            icon: '⛔',
            onConfirm: () => {}
        });
        return;
    }

    showConfirmDialog({
        title: 'Удаление пользователя',
        message: `Вы уверены, что хотите удалить пользователя <span class="confirm-highlight">${email}</span>?`,
        confirmText: '🗑️ Удалить',
        cancelText: '↩️ Отмена',
        type: 'danger',
        icon: '⚠️',
        onConfirm: async () => {
            try {
                const result = await DB_MANAGER.deleteUser(email);
                if (result) {
                    showNotification('Пользователь удален', 'success');
                    await DB_MANAGER.loadDatabase();
                    loadUsers();
                    updateStats();
                }
            } catch (error) {
                console.error('Ошибка удаления:', error);
                showNotification('Ошибка при удалении', 'error');
            }
        }
    });
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

    showConfirmDialog({
        title: 'Удаление товара',
        message: `Вы уверены, что хотите удалить товар <span class="confirm-highlight">${product.name}</span>?`,
        confirmText: '🗑️ Удалить',
        cancelText: '↩️ Отмена',
        type: 'danger',
        icon: '⚠️',
        onConfirm: async () => {
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
    });
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

// ============================================
// ПРОСМОТР ДЕТАЛЕЙ ЗАКАЗА (СТИЛИЗОВАННАЯ ВЕРСИЯ)
// ============================================

function viewOrderDetails(orderId) {
    const order = DB_MANAGER.currentData?.orders.find(o => o.id == orderId);
    if (!order) {
        showNotification('Заказ не найден', 'error');
        return;
    }

    // Создаем затемненный фон
    const overlay = document.createElement('div');
    overlay.className = 'order-details-modal';
    
    // Формируем список товаров
    let itemsHtml = '';
    if (order.items && Array.isArray(order.items)) {
        // Группируем одинаковые товары
        const itemCount = {};
        order.items.forEach(item => {
            const key = `${item.name}_${item.price}`;
            if (itemCount[key]) {
                itemCount[key].quantity++;
            } else {
                itemCount[key] = {
                    name: item.name,
                    price: item.price,
                    quantity: 1
                };
            }
        });
        
        // Сортируем товары по имени
        const sortedItems = Object.values(itemCount).sort((a, b) => a.name.localeCompare(b.name));
        
        itemsHtml = sortedItems.map(item => `
            <div class="order-item-row">
                <span class="order-item-name">
                    ${item.name} ${item.quantity > 1 ? `<span style="color: #666; font-size: 12px;">(x${item.quantity})</span>` : ''}
                </span>
                <span class="order-item-price">${item.price * item.quantity} ₽</span>
            </div>
        `).join('');
    }

    // Формируем информацию о доставке
    let deliveryInfo = '';
    if (order.delivery === 'pickup') {
        deliveryInfo = `
            <div class="order-delivery-info">
                <p><strong>📍 Адрес самовывоза:</strong> г. Воронеж, ул. Ветеринарная, д. 15</p>
                <p><strong>🕒 Режим работы:</strong> круглосуточно</p>
                <p><strong>📞 Телефон:</strong> 222-22-22</p>
            </div>
        `;
    } else {
        deliveryInfo = `
            <div class="order-delivery-info">
                <p><strong>🚚 Адрес доставки:</strong> ${order.delivery_address || 'Не указан'}</p>
                <p><strong>📞 Телефон:</strong> ${order.delivery_phone || 'Не указан'}</p>
                ${order.delivery_comment ? `<p><strong>💬 Комментарий:</strong> ${order.delivery_comment}</p>` : ''}
                <p><strong>💰 Стоимость доставки:</strong> ${order.delivery_cost > 0 ? order.delivery_cost + ' ₽' : 'Бесплатно'}</p>
            </div>
        `;
    }

    // Создаем содержимое модального окна
    overlay.innerHTML = `
        <div class="order-details-content">
            <div class="order-details-close" onclick="this.closest('.order-details-modal').remove()">×</div>
            
            <div class="order-details-header">
                <div class="order-details-number">#${order.order_number || 'Н/Д'}</div>
                <div class="order-details-date">${order.date ? new Date(order.date).toLocaleString() : 'Дата не указана'}</div>
            </div>
            
            <div class="order-details-section">
                <h3>Информация о клиенте</h3>
                <div class="order-info-grid">
                    <div class="order-info-item">
                        <div class="order-info-label">Имя</div>
                        <div class="order-info-value">${order.user_name || 'Н/Д'}</div>
                    </div>
                    <div class="order-info-item">
                        <div class="order-info-label">Email</div>
                        <div class="order-info-value">${order.user_email || order.user || 'Н/Д'}</div>
                    </div>
                </div>
            </div>
            
            <div class="order-details-section">
                <h3>Состав заказа</h3>
                <div class="order-items-list">
                    ${itemsHtml || '<p style="text-align: center; color: #999;">Нет товаров</p>'}
                </div>
                <div class="order-total-row">
                    <span class="order-total-label">ИТОГО:</span>
                    <span class="order-total-value">${order.total || 0} ₽</span>
                </div>
            </div>
            
            <div class="order-details-section">
                <h3>Информация о доставке</h3>
                ${deliveryInfo}
            </div>
            
            <button class="order-details-button" onclick="this.closest('.order-details-modal').remove()">
                Закрыть
            </button>
        </div>
    `;

    document.body.appendChild(overlay);
    
    // Закрытие по клику на фон
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
}

// ============================================
// УПРАВЛЕНИЕ ЗАКАЗАМИ - ИСПРАВЛЕННАЯ ВЕРСИЯ
// ============================================

async function deleteOrder(orderId) {
    const order = DB_MANAGER.currentData?.orders.find(o => o.id == orderId);
    if (!order) return;

    showConfirmDialog({
        title: 'Удаление заказа',
        message: `Вы уверены, что хотите удалить заказ <span class="confirm-highlight">#${order.order_number}</span>?`,
        confirmText: '🗑️ Удалить',
        cancelText: '↩️ Отмена',
        type: 'danger',
        icon: '⚠️',
        onConfirm: async () => {
            try {
                if (typeof DB_MANAGER.deleteOrder === 'function') {
                    await DB_MANAGER.deleteOrder(orderId);
                    showNotification('Заказ удален', 'success');
                    await DB_MANAGER.loadDatabase();
                    loadOrders();
                    updateStats();
                } else {
                    throw new Error('Метод удаления не найден');
                }
            } catch (error) {
                console.error('Ошибка удаления заказа:', error);
                showNotification('Ошибка при удалении: ' + error.message, 'error');
            }
        }
    });
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

// ============================================
// УПРАВЛЕНИЕ СООБЩЕНИЯМИ - ИСПРАВЛЕННАЯ ВЕРСИЯ
// ============================================

async function deleteMessage(messageId) {
    const message = DB_MANAGER.currentData?.messages.find(m => m.id == messageId);
    if (!message) {
        showNotification('Сообщение не найдено', 'error');
        return;
    }

    console.log('Попытка удаления сообщения:', messageId, message);

    showConfirmDialog({
        title: 'Удаление сообщения',
        message: `Вы уверены, что хотите удалить сообщение от <span class="confirm-highlight">${message.name}</span>?`,
        confirmText: '🗑️ Удалить',
        cancelText: '↩️ Отмена',
        type: 'danger',
        icon: '⚠️',
        onConfirm: async () => {
            try {
                // Показываем индикатор загрузки на кнопке
                const deleteBtn = event?.target;
                const originalText = deleteBtn?.textContent;
                if (deleteBtn) {
                    deleteBtn.textContent = 'Удаление...';
                    deleteBtn.disabled = true;
                }

                // Проверяем наличие метода
                if (typeof DB_MANAGER.deleteMessage !== 'function') {
                    throw new Error('Метод удаления сообщений не найден');
                }

                // Удаляем сообщение
                const result = await DB_MANAGER.deleteMessage(messageId);
                
                if (result) {
                    showNotification('✅ Сообщение успешно удалено', 'success');
                    
                    // Принудительно перезагружаем данные
                    await DB_MANAGER.loadDatabase();
                    
                    // Обновляем отображение
                    loadMessages();
                    updateStats();
                    
                    console.log('✅ Сообщение удалено, таблица обновлена');
                } else {
                    throw new Error('Не удалось удалить сообщение');
                }
                
            } catch (error) {
                console.error('❌ Ошибка удаления сообщения:', error);
                showNotification('❌ Ошибка при удалении: ' + error.message, 'error');
            } finally {
                // Возвращаем кнопку в исходное состояние
                const deleteBtn = event?.target;
                if (deleteBtn) {
                    deleteBtn.textContent = originalText || '🗑️ Удалить';
                    deleteBtn.disabled = false;
                }
            }
        }
    });
}

function showInfoDialog(message, title = 'Информация') {
    showConfirmDialog({
        title: title,
        message: message,
        confirmText: 'OK',
        cancelText: '',
        type: 'info',
        icon: 'ℹ️',
        onConfirm: () => {}
    });
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
