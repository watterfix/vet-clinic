// Конфигурация приложения
const APP_CONFIG = {
    // Supabase
    SUPABASE_URL: 'https://ehksdceuihjnzbqdztog.supabase.co',
    SUPABASE_KEY: 'sb_publishable_K1dDdxBKQ_04yOqwkfCxsw_JyiHlkxW',

    // Настройки клиники
    CLINIC_NAME: 'ВетКлиника "Здоровый друг"',
    CLINIC_ADDRESS: 'г. Воронеж, ул. Ветеринарная, д. 15',
    CLINIC_PHONE: '222-22-22',
    CLINIC_EMAIL: 'vet@zdorovydrug.ru',
    WORKING_HOURS: 'круглосуточно',

    // Доставка
    FREE_DELIVERY_THRESHOLD: 3000,
    DELIVERY_COST: 300,

    // Категории товаров
    CATEGORIES: {
        food: { name: '🍖 Корма', icon: '🍖' },
        medicine: { name: '💊 Лекарства', icon: '💊' },
        accessories: { name: '🪀 Аксессуары', icon: '🪀' },
        hygiene: { name: '🧼 Гигиена', icon: '🧼' }
    },

    // Роли пользователей
    ROLES: {
        USER: 'user',
        ADMIN: 'admin'
    }
};

// Делаем глобальным
window.APP_CONFIG = APP_CONFIG;