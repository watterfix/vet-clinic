class NotificationView {
    static show(message, type = 'success', duration = 3000) {
        const oldNotification = document.querySelector('.notification');
        if (oldNotification) oldNotification.remove();

        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background-color: ${type === 'success' ? '#2c6e49' : '#dc3545'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 1500;
            animation: slideIn 0.3s ease;
            font-weight: bold;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => notification.remove(), duration);
    }

    static showConfirm(options) {
        return new Promise((resolve) => {
            const {
                title = 'Подтверждение',
                message = 'Вы уверены?',
                confirmText = 'Да',
                cancelText = 'Нет',
                type = 'warning'
            } = options;

            const overlay = document.createElement('div');
            overlay.className = 'confirm-modal-overlay';

            const icon = type === 'danger' ? '⚠️' : type === 'info' ? 'ℹ️' : '❓';
            const titleClass = type === 'danger' ? 'danger' : type === 'info' ? 'info' : 'warning';

            overlay.innerHTML = `
                <div class="confirm-modal">
                    <div class="confirm-icon ${titleClass}">${icon}</div>
                    <div class="confirm-title ${titleClass}">${title}</div>
                    <div class="confirm-message">${message}</div>
                    <div class="confirm-buttons">
                        <button class="confirm-btn confirm-btn-${type === 'danger' ? 'danger' : 'confirm'}" id="confirmYes">${confirmText}</button>
                        <button class="confirm-btn confirm-btn-cancel" id="confirmNo">${cancelText}</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            const cleanup = () => overlay.remove();

            document.getElementById('confirmYes').onclick = () => {
                cleanup();
                resolve(true);
            };

            document.getElementById('confirmNo').onclick = () => {
                cleanup();
                resolve(false);
            };

            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    cleanup();
                    resolve(false);
                }
            });
        });
    }

    static showModal(content, title = 'Информация') {
        const overlay = document.createElement('div');
        overlay.className = 'custom-alert-overlay';

        overlay.innerHTML = `
            <div class="custom-alert">
                <span class="custom-alert-close">&times;</span>
                ${title ? `<h2>${title}</h2>` : ''}
                ${content}
            </div>
        `;

        document.body.appendChild(overlay);

        const closeBtn = overlay.querySelector('.custom-alert-close');
        closeBtn.onclick = () => overlay.remove();

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
    }
}

window.NotificationView = NotificationView;