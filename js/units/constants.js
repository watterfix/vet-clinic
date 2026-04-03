// Константы приложения
const CONSTANTS = {
    // Категории товаров
    CATEGORIES: {
        food: { name: '🍖 Корма', icon: '🍖', color: '#ffd700' },
        medicine: { name: '💊 Лекарства', icon: '💊', color: '#dc3545' },
        accessories: { name: '🪀 Аксессуары', icon: '🪀', color: '#17a2b8' },
        hygiene: { name: '🧼 Гигиена', icon: '🧼', color: '#6c757d' }
    },

    // Роли пользователей
    ROLES: {
        USER: 'user',
        ADMIN: 'admin'
    },

    // Статусы заказов
    ORDER_STATUS: {
        NEW: 'new',
        PROCESSING: 'processing',
        COMPLETED: 'completed',
        CANCELLED: 'cancelled'
    },

    // Статусы сообщений
    MESSAGE_STATUS: {
        NEW: 'new',
        READ: 'read'
    },

    // Типы доставки
    DELIVERY_TYPES: {
        PICKUP: 'pickup',
        DELIVERY: 'delivery'
    },

    // Способы оплаты
    PAYMENT_METHODS: {
        CASH: 'cash',
        CARD: 'card',
        ONLINE: 'online'
    },

    // Валидация
    VALIDATION: {
        MIN_PASSWORD_LENGTH: 6,
        MIN_NAME_LENGTH: 2,
        MAX_NAME_LENGTH: 30,
        MIN_MESSAGE_LENGTH: 10,
        MIN_ADDRESS_LENGTH: 10
    },

    // Уведомления
    NOTIFICATION_DURATION: 3000,

    // Автообновление (мс)
    AUTO_REFRESH_INTERVAL: 30000
};

window.CONSTANTS = CONSTANTS;