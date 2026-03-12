// ============================================
// ПРОСТОЙ СКРИПТ ДЛЯ УПРАВЛЕНИЯ БД
// ============================================

console.log('db-viewer.js загружен');

// Функция показа уведомлений
function showMessage(text, isError = false) {
    const msgDiv = document.getElementById('adminCheck');
    if (msgDiv) {
        msgDiv.style.display = 'block';
        msgDiv.innerHTML = text;
        msgDiv.style.backgroundColor = isError ? '#dc3545' : '#ffc107';
        msgDiv.style.color = isError ? 'white' : '#1e4d2f';
        msgDiv.style.borderColor = isError ? '#dc3545' : '#ffc107';
    }
}

// Проверка прав
function checkAccess() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const msgDiv = document.getElementById('adminCheck');

    if (!user) {
        showMessage('⚠️ Необходимо войти в систему', true);
        return false;
    }

    if (user.role !== 'admin') {
        showMessage('⚠️ Доступ только для администратора', true);
        return false;
    }

    return true;
}

// Загрузка данных
async function loadAllData() {
    if (!checkAccess()) return;

    showMessage('⏳ Загрузка данных...');

    try {
        await DB_MANAGER.loadDatabase();

        // Показываем интерфейс
        document.querySelectorAll('.export-buttons, .import-area, .db-tabs, .stats-grid, .db-panel').forEach(el => {
            if (el) el.style.display = '';
        });

        // Загружаем данные в таблицы
        loadUsers();
        loadProducts();
        loadOrders();
        updateStats();
        loadBackups();

        showMessage('✅ Данные загружены');
        setTimeout(() => {
            document.getElementById('adminCheck').style.display = 'none';
        }, 2000);

    } catch (error) {
        showMessage('❌ Ошибка загрузки: ' + error.message, true);
    }
}

// Загрузка пользователей
function loadUsers() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    const users = DB_MANAGER.currentData.users || {};
    let html = '';

    Object.keys(users).forEach(email => {
        const user = users[email];
        const safeEmail = email.replace(/[@.]/g, '_');
        const roleClass = user.role === 'admin' ? 'role-admin' : 'role-user';
        const roleText = user.role === 'admin' ? '👑 Админ' : '👤 Пользователь';

        html += `
            <tr id="user-${safeEmail}">
                <td>${email}</td>
                <td>${user.name}</td>
                <td><span class="role-badge ${roleClass}">${roleText}</span></td>
                <td>${user.registered ? new Date(user.registered).toLocaleDateString() : 'Н/Д'}</td>
                <td>
                    <button onclick="deleteUser('${email}')" class="btn-delete" ${email === 'admin@vetclinic.ru' ? 'disabled' : ''}>🗑️</button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html || '<tr><td colspan="5" style="text-align: center;">Нет пользователей</td></tr>';
}

// Загрузка товаров
function loadProducts() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

    const products = DB_MANAGER.currentData.products || {};
    let html = '';

    Object.keys(products).forEach(id => {
        const p = products[id];
        html += `
            <tr>
                <td>${id}</td>
                <td>${p.name}</td>
                <td>${p.price} ₽</td>
                <td>${p.category}</td>
                <td>${p.description || ''}</td>
                <td>
                    <button onclick="deleteProduct('${id}')" class="btn-delete">🗑️</button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html || '<tr><td colspan="6" style="text-align: center;">Нет товаров</td></tr>';
}

// Загрузка заказов
function loadOrders() {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;

    const orders = DB_MANAGER.currentData.orders || [];
    let html = '';

    orders.forEach(order => {
        html += `
            <tr>
                <td>#${order.orderNumber}</td>
                <td>${new Date(order.date).toLocaleString()}</td>
                <td>${order.userName}</td>
                <td>${order.total} ₽</td>
                <td>${order.delivery === 'pickup' ? 'Самовывоз' : 'Доставка'}</td>
                <td>${order.items?.length || 0}</td>
                <td>
                    <button onclick="deleteOrder('${order.id}')" class="btn-delete">🗑️</button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html || '<tr><td colspan="7" style="text-align: center;">Нет заказов</td></tr>';
}

// Обновление статистики
function updateStats() {
    const stats = DB_MANAGER.getStats();
    const grid = document.getElementById('statsGrid');

    grid.innerHTML = `
        <div class="stat-card">
            <h3>Пользователи</h3>
            <div class="stat-value">${stats.totalUsers}</div>
        </div>
        <div class="stat-card">
            <h3>Товары</h3>
            <div class="stat-value">${stats.totalProducts}</div>
        </div>
        <div class="stat-card">
            <h3>Заказы</h3>
            <div class="stat-value">${stats.totalOrders}</div>
        </div>
        <div class="stat-card">
            <h3>Выручка</h3>
            <div class="stat-value">${stats.totalRevenue} ₽</div>
        </div>
    `;
}

// Загрузка бэкапов
function loadBackups() {
    const list = document.getElementById('backupsList');
    const backups = JSON.parse(localStorage.getItem('backups')) || [];

    if (backups.length === 0) {
        list.innerHTML = '<p>Нет бэкапов</p>';
        return;
    }

    let html = '<ul>';
    backups.forEach((b, i) => {
        html += `<li>${b.name} <button onclick="restoreBackup(${i})">↩️</button></li>`;
    });
    html += '</ul>';
    list.innerHTML = html;
}

// Удаление пользователя
function deleteUser(email) {
    if (email === 'admin@vetclinic.ru') {
        alert('Нельзя удалить админа');
        return;
    }
    if (confirm('Удалить пользователя?')) {
        DB_MANAGER.deleteUser(email);
        loadUsers();
        updateStats();
    }
}

// Удаление товара
function deleteProduct(id) {
    if (confirm('Удалить товар?')) {
        DB_MANAGER.deleteProduct(id);
        loadProducts();
        updateStats();
    }
}

// Удаление заказа
function deleteOrder(id) {
    if (confirm('Удалить заказ?')) {
        DB_MANAGER.deleteOrder(id);
        loadOrders();
        updateStats();
    }
}

// Создание бэкапа
function createBackup() {
    const stats = DB_MANAGER.getStats();
    const backup = {
        name: 'Backup ' + new Date().toLocaleString(),
        date: new Date().toISOString(),
        data: {
            users: DB_MANAGER.currentData.users,
            products: DB_MANAGER.currentData.products,
            orders: DB_MANAGER.currentData.orders
        },
        stats: stats
    };

    let backups = JSON.parse(localStorage.getItem('backups')) || [];
    backups.push(backup);
    localStorage.setItem('backups', JSON.stringify(backups));

    alert('Бэкап создан');
    loadBackups();
}

// Восстановление бэкапа
function restoreBackup(index) {
    let backups = JSON.parse(localStorage.getItem('backups')) || [];
    const backup = backups[index];

    if (backup && confirm('Восстановить?')) {
        localStorage.setItem('users', JSON.stringify(backup.data.users));
        localStorage.setItem('products', JSON.stringify(backup.data.products));
        localStorage.setItem('orders', JSON.stringify(backup.data.orders));

        DB_MANAGER.currentData = backup.data;

        loadUsers();
        loadProducts();
        loadOrders();
        updateStats();

        alert('Восстановлено');
    }
}

// Экспорт
function exportDatabase() {
    DB_MANAGER.exportDatabase();
}

// Импорт
function importDatabase(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);
            localStorage.setItem('users', JSON.stringify(data.users));
            localStorage.setItem('products', JSON.stringify(data.products));
            localStorage.setItem('orders', JSON.stringify(data.orders));

            DB_MANAGER.currentData = data;

            loadUsers();
            loadProducts();
            loadOrders();
            updateStats();

            alert('Импорт выполнен');
        } catch (err) {
            alert('Ошибка: ' + err.message);
        }
    };
    reader.readAsText(file);
}

// Сброс
function resetDatabase() {
    if (confirm('Сбросить все данные?')) {
        DB_MANAGER.resetToDefault();
        loadAllData();
    }
}

// Переключение вкладок
function switchTab(tab) {
    document.querySelectorAll('.db-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');

    document.querySelectorAll('.db-panel').forEach(p => p.classList.remove('active'));
    document.getElementById(tab + 'Panel').classList.add('active');
}

// Функции для показа форм
function showAddUserForm() {
    document.getElementById('addUserForm').style.display = 'block';
}

function hideAddUserForm() {
    document.getElementById('addUserForm').style.display = 'none';
}

// Добавление пользователя
function addUser() {
    const name = document.getElementById('newUserName').value;
    const email = document.getElementById('newUserEmail').value;
    const pass = document.getElementById('newUserPassword').value;
    const role = document.getElementById('newUserRole').value;

    if (!name || !email || !pass) {
        alert('Заполните все поля');
        return;
    }

    DB_MANAGER.addUser({ name, email, password: pass, role });
    hideAddUserForm();
    loadUsers();
    updateStats();

    document.getElementById('newUserName').value = '';
    document.getElementById('newUserEmail').value = '';
    document.getElementById('newUserPassword').value = '';
}

function showAddProductForm() {
    document.getElementById('addProductForm').style.display = 'block';
}

function hideAddProductForm() {
    document.getElementById('addProductForm').style.display = 'none';
}

function addProduct() {
    const id = document.getElementById('newProductId').value;
    const name = document.getElementById('newProductName').value;
    const price = document.getElementById('newProductPrice').value;
    const cat = document.getElementById('newProductCategory').value;
    const desc = document.getElementById('newProductDescription').value;

    if (!id || !name || !price) {
        alert('Заполните обязательные поля');
        return;
    }

    DB_MANAGER.addProduct(id, { name, price, category: cat, description: desc });
    hideAddProductForm();
    loadProducts();
    updateStats();

    document.getElementById('newProductId').value = '';
    document.getElementById('newProductName').value = '';
    document.getElementById('newProductPrice').value = '';
    document.getElementById('newProductDescription').value = '';
}

function triggerFileInput() {
    document.getElementById('fileInput').click();
}

function refreshData() {
    loadAllData();
}

function restoreFromBackup() {
    const backups = JSON.parse(localStorage.getItem('backups')) || [];
    if (backups.length > 0) {
        restoreBackup(backups.length - 1);
    }
}

function searchUsers() { }
function searchProducts() { }
function searchOrders() { }

// Делаем функции глобальными
window.switchTab = switchTab;
window.showAddUserForm = showAddUserForm;
window.hideAddUserForm = hideAddUserForm;
window.addUser = addUser;
window.showAddProductForm = showAddProductForm;
window.hideAddProductForm = hideAddProductForm;
window.addProduct = addProduct;
window.deleteUser = deleteUser;
window.deleteProduct = deleteProduct;
window.deleteOrder = deleteOrder;
window.exportDatabase = exportDatabase;
window.triggerFileInput = triggerFileInput;
window.importDatabase = importDatabase;
window.refreshData = refreshData;
window.createBackup = createBackup;
window.restoreFromBackup = restoreFromBackup;
window.restoreBackup = restoreBackup;
window.resetDatabase = resetDatabase;
window.searchUsers = searchUsers;
window.searchProducts = searchProducts;
window.searchOrders = searchOrders;

// Запуск при загрузке
document.addEventListener('DOMContentLoaded', () => {
    console.log('Страница загружена, запуск...');
    setTimeout(loadAllData, 500); // Небольшая задержка для гарантии
});