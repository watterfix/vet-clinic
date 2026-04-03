// Базовый класс для работы с Supabase
class DBManager {
    constructor() {
        this.supabase = null;
        this.isInitialized = false;
        this.initPromise = null;
    }

    async init() {
        if (this.initPromise) return this.initPromise;

        this.initPromise = new Promise(async (resolve) => {
            try {
                if (typeof supabase === 'undefined') {
                    throw new Error('Supabase SDK не загружен');
                }

                this.supabase = supabase.createClient(
                    APP_CONFIG.SUPABASE_URL,
                    APP_CONFIG.SUPABASE_KEY
                );

                // Проверяем подключение
                const { error } = await this.supabase
                    .from('users')
                    .select('count', { count: 'exact', head: true });

                if (error) {
                    console.warn('⚠️ Ошибка подключения к Supabase:', error);
                    this.initError = error.message;
                }

                this.isInitialized = true;
                console.log('✅ DBManager инициализирован');
                resolve(true);

            } catch (error) {
                console.error('❌ Ошибка инициализации:', error);
                this.isInitialized = false;
                resolve(false);
            }
        });

        return this.initPromise;
    }

    async waitForInit() {
        if (this.isInitialized) return true;
        await this.init();
        return this.isInitialized;
    }

    getSupabase() {
        return this.supabase;
    }

    // Общие методы для работы с таблицами
    async getAll(table) {
        await this.waitForInit();
        const { data, error } = await this.supabase
            .from(table)
            .select('*');

        if (error) throw error;
        return data || [];
    }

    async getById(table, id) {
        await this.waitForInit();
        const { data, error } = await this.supabase
            .from(table)
            .select('*')
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    }

    async insert(table, record) {
        await this.waitForInit();
        const { data, error } = await this.supabase
            .from(table)
            .insert([record])
            .select();

        if (error) throw error;
        return data?.[0] || null;
    }

    async update(table, id, updates) {
        await this.waitForInit();
        const { data, error } = await this.supabase
            .from(table)
            .update(updates)
            .eq('id', id)
            .select();

        if (error) throw error;
        return data?.[0] || null;
    }

    async delete(table, id) {
        await this.waitForInit();
        const { error } = await this.supabase
            .from(table)
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }

    // Утилиты
    broadcastUpdate(type = 'general') {
        localStorage.setItem(`db_update_${type}`, Date.now().toString());
    }
}

window.DBManager = DBManager;