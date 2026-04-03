class MessageModel {
    constructor(dbManager) {
        this.db = dbManager;
        this.messages = [];
    }

    async loadMessages() {
        await this.db.waitForInit();

        const { data, error } = await this.db.getSupabase()
            .from('messages')
            .select('*')
            .order('date', { ascending: false });

        if (error) throw error;
        this.messages = data || [];
        return this.messages;
    }

    getMessages() {
        return this.messages;
    }

    async sendMessage(messageData) {
        await this.db.waitForInit();

        const newMessage = {
            name: messageData.name.trim(),
            email: messageData.email.trim().toLowerCase(),
            phone: messageData.phone || '',
            message: messageData.message.trim(),
            status: 'new',
            date: new Date().toISOString()
        };

        const result = await this.db.insert('messages', newMessage);
        await this.loadMessages();
        this.db.broadcastUpdate('messages');
        return result;
    }

    async markAsRead(messageId) {
        const userModel = new UserModel(this.db);
        if (!userModel.isAdmin()) {
            throw new Error('Доступ запрещен');
        }

        const updated = await this.db.update('messages', messageId, { status: 'read' });
        await this.loadMessages();
        this.db.broadcastUpdate('messages');
        return updated;
    }

    async deleteMessage(messageId) {
        const userModel = new UserModel(this.db);
        if (!userModel.isAdmin()) {
            throw new Error('Доступ запрещен');
        }

        await this.db.delete('messages', messageId);
        await this.loadMessages();
        this.db.broadcastUpdate('messages');
        return true;
    }

    getUnreadCount() {
        return this.messages.filter(m => m.status === 'new').length;
    }
}

window.MessageModel = MessageModel;