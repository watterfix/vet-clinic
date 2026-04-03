class MessageView {
    static renderMessages(messages, onMarkRead, onDelete) {
        if (!messages || messages.length === 0) {
            return '<tr><td colspan="7" style="text-align: center; padding: 30px;">Нет сообщений</td></tr>';
        }

        let html = '';
        messages.forEach(message => {
            const date = new Date(message.date).toLocaleString();
            const statusClass = message.status === 'new' ? 'status-new' : 'status-read';
            const statusText = message.status === 'new' ? '🆕 Новое' : '✓ Прочитано';

            html += `
                <tr id="message-${message.id}">
                    <td>${date}</td>
                    <td>${this.escapeHtml(message.name)}</td>
                    <td>${this.escapeHtml(message.email)}</td>
                    <td>${this.escapeHtml(message.phone || '—')}</td>
                    <td style="max-width: 300px; word-wrap: break-word;">${this.escapeHtml(message.message)}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td class="action-buttons">
                        ${message.status === 'new' ?
                    `<button onclick="(${onMarkRead.toString()})('${message.id}')" class="btn-edit">✓ Прочитать</button>` :
                    ''
                }
                        <button onclick="(${onDelete.toString()})('${message.id}')" class="btn-delete">🗑️ Удалить</button>
                    </td>
                </tr>
            `;
        });

        return html;
    }

    static renderStats(stats) {
        return `
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>📊 Всего сообщений</h3>
                    <div class="stat-value">${stats.totalMessages}</div>
                </div>
                <div class="stat-card">
                    <h3>🆕 Непрочитанных</h3>
                    <div class="stat-value">${stats.unreadCount}</div>
                </div>
                <div class="stat-card">
                    <h3>✓ Прочитанных</h3>
                    <div class="stat-value">${stats.readCount}</div>
                </div>
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

window.MessageView = MessageView;