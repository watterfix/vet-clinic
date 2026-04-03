class AdminView {
    static renderStats(stats) {
        return `
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>👥 Пользователи</h3>
                    <div class="stat-value">${stats.totalUsers}</div>
                    <div>👑 Админов: ${stats.adminCount}</div>
                    <div>👤 Пользователей: ${stats.userCount}</div>
                </div>
                <div class="stat-card">
                    <h3>📦 Товары</h3>
                    <div class="stat-value">${stats.totalProducts}</div>
                    ${Object.entries(stats.productsByCategory || {}).map(([cat, count]) =>
            `<div>${APP_CONFIG.CATEGORIES[cat]?.name || cat}: ${count}</div>`
        ).join('')}
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
                    <div>Непрочитанных: ${stats.unreadMessages}</div>
                </div>
                <div class="stat-card">
                    <h3>💰 Выручка</h3>
                    <div class="stat-value">${stats.totalRevenue} ₽</div>
                </div>
            </div>
        `;
    }

    static renderUsersTable(users, onDelete) {
        if (!users || users.length === 0) {
            return '<tr><td colspan="5" style="text-align: center; padding: 30px;">Нет пользователей</td></tr>';
        }

        let html = '';
        users.sort((a, b) => a.email.localeCompare(b.email)).forEach(user => {
            const registered = user.registered ? new Date(user.registered).toLocaleString() : 'Н/Д';
            const roleClass = user.role === 'admin' ? 'role-admin' : 'role-user';
            const roleText = user.role === 'admin' ? '👑 Админ' : '👤 Пользователь';

            html += `
                <tr id="user-${user.email.replace(/[@.]/g, '_')}">
                    <td>${this.escapeHtml(user.email)}</td>
                    <td>${this.escapeHtml(user.name)}</td>
                    <td><span class="role-badge ${roleClass}">${roleText}</span></td>
                    <td>${registered}</td>
                    <td class="action-buttons">
                        <button onclick="(${onDelete.toString()})('${user.email}')" class="btn-delete" ${user.email === 'admin@vetclinic.ru' ? 'disabled' : ''}>
                            🗑️ Удалить
                        </button>
                    </td>
                </tr>
            `;
        });

        return html;
    }

    static renderProductsTable(products, onEdit, onDelete) {
        if (!products || products.length === 0) {
            return '<tr><td colspan="6" style="text-align: center; padding: 30px;">Нет товаров</td></tr>';
        }

        let html = '';
        products.sort((a, b) => a.id.localeCompare(b.id)).forEach(product => {
            const category = APP_CONFIG.CATEGORIES[product.category]?.name || product.category;

            html += `
                <tr id="product-${product.id}">
                    <td><code>${this.escapeHtml(product.id)}</code></td>
                    <td>${this.escapeHtml(product.name)}</td>
                    <td><strong style="color: #2c6e49;">${product.price} ₽</strong></td>
                    <td>${category}</td>
                    <td>${this.escapeHtml(product.description || '—')}</td>
                    <td class="action-buttons">
                        <button onclick="(${onEdit.toString()})('${product.id}')" class="btn-edit">✏️ Ред.</button>
                        <button onclick="(${onDelete.toString()})('${product.id}')" class="btn-delete">🗑️ Удал.</button>
                    </td>
                </tr>
            `;
        });

        return html;
    }

    static renderAddUserForm() {
        return `
            <div id="addUserForm" class="add-form" style="display: none;">
                <h3>Добавление нового пользователя</h3>
                <div class="form-row">
                    <input type="text" id="newUserName" placeholder="Имя">
                    <input type="email" id="newUserEmail" placeholder="Email">
                </div>
                <div class="form-row">
                    <input type="password" id="newUserPassword" placeholder="Пароль">
                    <select id="newUserRole">
                        <option value="user">Пользователь</option>
                        <option value="admin">Администратор</option>
                    </select>
                </div>
                <div class="form-row">
                    <button onclick="window.adminController?.addUser()" class="btn-save">💾 Сохранить</button>
                    <button onclick="window.adminController?.hideAddUserForm()" class="btn-delete">✖ Отмена</button>
                </div>
            </div>
        `;
    }

    static renderAddProductForm() {
        return `
            <div id="addProductForm" class="add-form" style="display: none;">
                <h3>Добавление нового товара</h3>
                <div class="form-row">
                    <input type="text" id="newProductId" placeholder="ID товара (например: food9)">
                    <input type="text" id="newProductName" placeholder="Название товара">
                </div>
                <div class="form-row">
                    <input type="number" id="newProductPrice" placeholder="Цена" min="0">
                    <select id="newProductCategory">
                        <option value="food">🍖 Корма</option>
                        <option value="medicine">💊 Лекарства</option>
                        <option value="accessories">🪀 Аксессуары</option>
                        <option value="hygiene">🧼 Гигиена</option>
                    </select>
                </div>
                <div class="form-row">
                    <input type="text" id="newProductDescription" placeholder="Описание товара">
                </div>
                <div class="form-row">
                    <button onclick="window.adminController?.addProduct()" class="btn-save">💾 Сохранить</button>
                    <button onclick="window.adminController?.hideAddProductForm()" class="btn-delete">✖ Отмена</button>
                </div>
            </div>
        `;
    }

    static renderSearchBox(placeholder, onSearch) {
        return `
            <div class="search-box">
                <input type="text" id="searchInput" placeholder="${placeholder}" onkeyup="(${onSearch.toString()})()">
            </div>
        `;
    }

    static escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

window.AdminView = AdminView;