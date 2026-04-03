/**
 * AuthController - Контроллер авторизации
 * Обрабатывает логику входа, регистрации и выхода
 */
class AuthController {
    constructor(userModel) {
        this.userModel = userModel;
        this.init();
    }

    init() {
        // Делаем контроллер глобальным для доступа из view
        window.authController = this;

        // Обновляем UI
        this.updateUI();

        // Настраиваем обработчики после загрузки DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.bindEvents());
        } else {
            this.bindEvents();
        }
    }

    bindEvents() {
        // Привязываем обработчики к формам, если они существуют
        const loginForm = document.getElementById('loginFormElement');
        const registerForm = document.getElementById('registerFormElement');

        if (loginForm) {
            loginForm.onsubmit = (e) => this.login(e);
        }

        if (registerForm) {
            registerForm.onsubmit = (e) => this.register(e);
        }
    }

    async login(event) {
        if (event) event.preventDefault();

        const email = document.getElementById('loginEmail')?.value.trim();
        const password = document.getElementById('loginPassword')?.value;

        // Валидация
        if (!email || !password) {
            AuthView.showFormMessage('loginMessage', 'Заполните все поля', 'error');
            return;
        }

        if (!Helpers.validateEmail(email)) {
            AuthView.showFormMessage('loginMessage', 'Введите корректный email', 'error');
            return;
        }

        // Показываем индикатор загрузки
        AuthView.setButtonLoading('loginSubmitBtn', true, 'Вход...');

        try {
            const user = await this.userModel.login(email, password);

            // Успешный вход
            AuthView.showFormMessage('loginMessage', '✅ Вход выполнен успешно!', 'success');

            setTimeout(() => {
                AuthView.hideModal();
                this.updateUI();

                // Показываем приветствие
                ModalView.showToast(`Добро пожаловать, ${user.name}!`, 'success');

                // Очищаем форму
                document.getElementById('loginEmail').value = '';
                document.getElementById('loginPassword').value = '';
            }, 1000);

        } catch (error) {
            console.error('Ошибка входа:', error);
            AuthView.showFormMessage('loginMessage', error.message, 'error');
        } finally {
            AuthView.setButtonLoading('loginSubmitBtn', false);
        }
    }

    async register(event) {
        if (event) event.preventDefault();

        const name = document.getElementById('regName')?.value.trim();
        const email = document.getElementById('regEmail')?.value.trim();
        const password = document.getElementById('regPassword')?.value;

        // Валидация
        if (!name || !email || !password) {
            AuthView.showFormMessage('registerMessage', 'Заполните все поля', 'error');
            return;
        }

        if (!Helpers.validateName(name)) {
            AuthView.showFormMessage('registerMessage', 'Имя должно содержать от 2 до 30 символов (буквы, дефис, пробел)', 'error');
            return;
        }

        if (!Helpers.validateEmail(email)) {
            AuthView.showFormMessage('registerMessage', 'Введите корректный email', 'error');
            return;
        }

        if (password.length < 6) {
            AuthView.showFormMessage('registerMessage', 'Пароль должен содержать не менее 6 символов', 'error');
            return;
        }

        // Показываем индикатор загрузки
        AuthView.setButtonLoading('registerSubmitBtn', true, 'Регистрация...');

        try {
            await this.userModel.register({ name, email, password });

            // Успешная регистрация
            AuthView.showFormMessage('registerMessage', '✅ Регистрация успешна! Теперь войдите в систему', 'success');

            setTimeout(() => {
                // Переключаем на вкладку входа
                const modal = document.getElementById('authModal');
                if (modal) {
                    const loginTab = modal.querySelector('.auth-tab[data-tab="login"]');
                    if (loginTab) loginTab.click();
                }

                // Автоматически заполняем email
                const loginEmail = document.getElementById('loginEmail');
                if (loginEmail) {
                    loginEmail.value = email;
                }

                // Очищаем форму регистрации
                document.getElementById('regName').value = '';
                document.getElementById('regEmail').value = '';
                document.getElementById('regPassword').value = '';

                // Очищаем сообщение
                AuthView.clearMessages();
            }, 1500);

        } catch (error) {
            console.error('Ошибка регистрации:', error);
            AuthView.showFormMessage('registerMessage', error.message, 'error');
        } finally {
            AuthView.setButtonLoading('registerSubmitBtn', false);
        }
    }

    logout() {
        this.userModel.logout();
        this.updateUI();

        // Очищаем корзину
        if (window.cartController) {
            window.cartController.clearCart();
        }

        // Показываем уведомление
        ModalView.showToast('Вы вышли из системы', 'info');

        // Перенаправляем, если на странице админки
        if (window.location.pathname.includes('db-viewer.html')) {
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        }
    }

    updateUI() {
        const user = this.userModel.getCurrentUser();
        AuthView.updateAuthCorner(
            user,
            (tab) => this.showAuthModal(tab),
            () => this.logout()
        );

        // Обновляем корзину
        if (window.cartController) {
            window.cartController.updateCartCount();
        }
    }

    showAuthModal(tab = 'login') {
        AuthView.showModal(tab);

        // Перепривязываем обработчики после рендеринга
        setTimeout(() => {
            this.bindEvents();
        }, 100);
    }

    isAuthenticated() {
        return this.userModel.isAuthenticated();
    }

    isAdmin() {
        return this.userModel.isAdmin();
    }

    getCurrentUser() {
        return this.userModel.getCurrentUser();
    }
}

window.AuthController = AuthController;