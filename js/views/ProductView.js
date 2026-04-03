class ProductView {
    static renderProducts(products, isAdmin, onAddToCart, onEditPrice) {
        // Группируем товары по категориям
        const categories = {
            food: { name: '🍖 Корма', products: [] },
            medicine: { name: '💊 Лекарства', products: [] },
            accessories: { name: '🪀 Аксессуары', products: [] },
            hygiene: { name: '🧼 Гигиена', products: [] }
        };

        products.forEach(product => {
            if (categories[product.category]) {
                categories[product.category].products.push(product);
            }
        });

        let html = '';

        for (const [key, category] of Object.entries(categories)) {
            if (category.products.length === 0) continue;

            html += `
                <article>
                    <h3>${category.name}</h3>
                    <table class="price-list">
                        <thead>
                            <tr>
                                <th>Товар</th>
                                <th>Цена</th>
                                <th>Описание</th>
                                <th>Действие</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            category.products.forEach(product => {
                html += `
                    <tr data-id="${product.id}" data-price="${product.price}">
                        <td>${this.escapeHtml(product.name)}</td>
                        <td class="price">${product.price} руб.</td>
                        <td>${this.escapeHtml(product.description || '—')}</td>
                        <td>
                            ${isAdmin ? `
                                <div style="display: flex; gap: 5px;">
                                    <input type="number" value="${product.price}" id="price-${product.id}" style="width: 80px; padding: 5px;">
                                    <button onclick="window.productController?.updatePrice('${product.id}')" class="button">Изменить</button>
                                </div>
                            ` : `
                                <button onclick="window.cartController?.addToCart('${this.escapeHtml(product.name)}', ${product.price})" class="button">Купить</button>
                            `}
                        </td>
                    </tr>
                `;
            });

            html += `
                        </tbody>
                    </table>
                </article>
            `;
        }

        return html;
    }

    static renderRefreshButton() {
        return `
            <button onclick="window.productController?.refreshPrices()" class="button" style="padding: 8px 15px; font-size: 14px; margin-bottom: 20px;">
                🔄 Обновить цены
            </button>
        `;
    }

    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

window.ProductView = ProductView;