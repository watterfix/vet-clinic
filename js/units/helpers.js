const Helpers = {
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    },

    validatePhone(phone) {
        const re = /^(\+7|8)?[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$|^\d{2,3}[\s\-]?\d{2}[\s\-]?\d{2}$/;
        return phone === '' || re.test(phone.trim());
    },

    validateName(name) {
        const re = /^[а-яА-Яa-zA-Z\s\-]{2,30}$/;
        return re.test(name.trim());
    },

    formatDate(date) {
        return new Date(date).toLocaleString();
    },

    formatPrice(price) {
        return `${price} ₽`;
    },

    generateId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    }
};

window.Helpers = Helpers;