class MessageController {
    constructor(messageModel, userModel) {
        this.messageModel = messageModel;
        this.userModel = userModel;
        this.init();
    }

    init() {
        window.messageController = this;

        if (window.location.pathname.includes('db-viewer.html')) {
            this.renderMessages();
        }
    }

    async renderMessages() {
        const container = document.getElementById('messagesTableBody');
        if (!container) return;

        const messages = this.messageModel.getMessages();

        container.innerHTML = MessageView.renderMessages(
            messages,
            (id) => this.markAsRead(id),
            (id) => this.deleteMessage(id)
        );
    }

    async markAsRead(messageId) {
        try {
            await this.messageModel.markAsRead(messageId);
            NotificationView.show('Сообщение отмечено как прочитанное', 'success');
            await this.renderMessages();
            this.updateStats();
        } catch (error) {
            NotificationView.show(error.message, 'error');
        }
    }

    async deleteMessage(messageId) {
        const confirmed = await NotificationView.showConfirm({
            title: 'Удаление сообщения',
            message: 'Вы уверены, что хотите удалить это сообщение?',
            confirmText: '🗑️ Удалить',
            cancelText: '↩️ Отмена',
            type: 'danger'
        });

        if (!confirmed) return;

        try {
            await this.messageModel.deleteMessage(messageId);
            NotificationView.show('Сообщение удалено', 'success');
            await this.renderMessages();
            this.updateStats();
        } catch (error) {
            NotificationView.show(error.message, 'error');
        }
    }

    async updateStats() {
        const statsContainer = document.getElementById('messagesStats');
        if (!statsContainer) return;

        const messages = this.messageModel.getMessages();
        const stats = {
            totalMessages: messages.length,
            unreadCount: messages.filter(m => m.status === 'new').length,
            readCount: messages.filter(m => m.status === 'read').length
        };

        statsContainer.innerHTML = MessageView.renderStats(stats);
    }

    async refresh() {
        await this.messageModel.loadMessages();
        await this.renderMessages();
        await this.updateStats();
    }
}

window.MessageController = MessageController;