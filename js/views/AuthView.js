/**
 * AuthView - Управление отображением авторизации
 * Отвечает за рендеринг модальных окон входа/регистрации
 */
class AuthView {
    // Рендеринг модального окна авторизации
    static renderModal() {
        // Удаляем существующее модальное окно, если есть
        const existingModal = document.getElementById('authModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Создаем модальное окно
        const modal = document.createElement('div');
        modal.id = 'authModal';
        modal.className = 'auth-modal';
        modal.innerHTML = `
            <div class="auth-modal-content">
                <span class="auth-modal-close">&times;</span>
                
                <div class="auth-tabs">
                    <div class="auth-tab active" data-tab="login">🔐 Вход</div>
                    <div class="auth-tab" data-tab="register">📝 Регистрация</div>
                </div>
                
                <!-- Форма входа -->
                <div id="loginForm" class="auth-form active">
                    <form id="loginFormElement" onsubmit="return false;">
                        <div class="form-group">
                            <label for="loginEmail">Email <span class="required">*</span></label>
                            <input type="email" id="loginEmail" name="email" placeholder="example@mail.ru" required autocomplete="email">
                        </div>
                        
                        <div class="form-group">
                            <label for="loginPassword">Пароль <span class="required">*</span></label>
                            <input type="password" id="loginPassword" name="password" placeholder="••••••" required autocomplete="current-password">
                        </div>
                        
                        <div id="loginMessage" class="form-message" style="display: none;"></div>
                        
                        <button type="submit" class="button auth-button" id="loginSubmitBtn">
                            🔓 Войти
                        </button>
                    </form>
                </div>
                
                <!-- Форма регистрации -->
                <div id="registerForm" class="auth-form">
                    <form id="registerFormElement" onsubmit="return false;">
                        <div class="form-group">
                            <label for="regName">Имя <span class="required">*</span></label>
                            <input type="text" id="regName" name="name" placeholder="Ваше имя" required autocomplete="name">
                            <small class="field-hint">От 2 до 30 символов</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="regEmail">Email <span class="required">*</span></label>
                            <input type="email" id="regEmail" name="email" placeholder="example@mail.ru" required autocomplete="email">
                        </div>
                        
                        <div class="form-group">
                            <label for="regPassword">Пароль <span class="required">*</span></label>
                            <input type="password" id="regPassword" name="password" placeholder="Минимум 6 символов" required autocomplete="new-password">
                            <small class="field-hint">Не менее 6 символов</small>
                        </div>
                        
                        <div id="registerMessage" class="form-message" style="display: none;"></div>
                        
                        <button type="submit" class="button auth-button" id="registerSubmitBtn">
                            📝 Зарегистрироваться
                        </button>
                    </form>
                </div>
                
                <div class="auth-footer">
                    <p>🔒 Ваши данные защищены</p>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Настройка закрытия модального окна
        this.setupModalClose(modal);

        return modal;
    }

    // Настройка закрытия модального окна
    static setupModalClose(modal) {
        const closeBtn = modal.querySelector('.auth-modal-close');
        if (closeBtn) {
            closeBtn.onclick = () => this.hideModal();
        }

        // Закрытие по клику на фон
        modal.onclick = (e) => {
            if (e.target === modal) {
                this.hideModal();
            }
        };

        // Закрытие по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                this.hideModal();
            }
        });
    }

    // Настройка переключения вкладок
    static setupTabs(modal) {
        const tabs = modal.querySelectorAll('.auth-tab');
        const loginForm = modal.querySelector('#loginForm');
        const registerForm = modal.querySelector('#registerForm');

        tabs.forEach(tab => {
            tab.onclick = () => {
                const tabName = tab.dataset.tab;

                // Обновляем активную вкладку
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Показываем соответствующую форму
                if (tabName === 'login') {
                    loginForm.classList.add('active');
                    registerForm.classList.remove('active');
                } else {
                    registerForm.classList.add('active');
                    loginForm.classList.remove('active');
                }

                // Очищаем сообщения об ошибках
                this.clearMessages();
            };
        });
    }

    // Показать модальное окно
    static showModal(tab = 'login') {
        let modal = document.getElementById('authModal');

        if (!modal) {
            modal = this.renderModal();
        }

        // Настраиваем вкладки
        this.setupTabs(modal);

        // Показываем нужную вкладку
        if (tab === 'register') {
            const registerTab = modal.querySelector('.auth-tab[data-tab="register"]');
            if (registerTab) registerTab.click();
        } else {
            const loginTab = modal.querySelector('.auth-tab[data-tab="login"]');
            if (loginTab) loginTab.click();
        }

        // Очищаем поля и сообщения
        this.clearFormFields();
        this.clearMessages();

        // Показываем модальное окно
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Фокусируемся на первом поле
        setTimeout(() => {
            const firstInput = modal.querySelector('input');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    // Скрыть модальное окно
    static hideModal() {
        const modal = document.getElementById('authModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // Очистить поля формы
    static clearFormFields() {
        const loginEmail = document.getElementById('loginEmail');
        const loginPassword = document.getElementById('loginPassword');
        const regName = document.getElementById('regName');
        const regEmail = document.getElementById('regEmail');
        const regPassword = document.getElementById('regPassword');

        if (loginEmail) loginEmail.value = '';
        if (loginPassword) loginPassword.value = '';
        if (regName) regName.value = '';
        if (regEmail) regEmail.value = '';
        if (regPassword) regPassword.value = '';
    }

    // Очистить сообщения
    static clearMessages() {
        const loginMessage = document.getElementById('loginMessage');
        const registerMessage = document.getElementById('registerMessage');

        if (loginMessage) {
            loginMessage.style.display = 'none';
            loginMessage.textContent = '';
        }
        if (registerMessage) {
            registerMessage.style.display = 'none';
            registerMessage.textContent = '';
        }
    }

    // Показать сообщение в форме
    static showFormMessage(formId, message, type = 'error') {
        const messageDiv = document.getElementById(formId);
        if (messageDiv) {
            messageDiv.textContent = message;
            messageDiv.className = `form-message ${type}`;
            messageDiv.style.display = 'block';

            // Автоматически скрываем через 5 секунд
            setTimeout(() => {
                if (messageDiv) {
                    messageDiv.style.display = 'none';
                }
            }, 5000);
        }
    }

    // Обновить угловой блок авторизации
    static updateAuthCorner(user, onLoginClick, onLogout) {
        let authCorner = document.getElementById('authCorner');

        if (!authCorner) {
            authCorner = document.createElement('div');
            authCorner.id = 'authCorner';
            document.body.prepend(authCorner);
        }

        if (user) {
            // Пользователь авторизован
            authCorner.innerHTML = `
                <div class="user-info-corner" style="background: linear-gradient(135deg, #2c6e49, #1e4d2f); color: white; padding: 8px 15px; border-radius: 30px; display: flex; align-items: center; gap: 10px; border: 2px solid #ffd700; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                    <div style="display: flex; flex-direction: column; gap: 2px;">
                        <span style="font-weight: bold; font-size: 14px;">
                            ${this.escapeHtml(user.name)} ${user.role === 'admin' ? '👑' : '🐾'}
                        </span>
                        <span style="font-size: 11px; color: #ffd700;">${this.escapeHtml(user.email)}</span>
                    </div>
                    ${user.role === 'admin' && !window.location.pathname.includes('db-viewer.html') ?
                    '<a href="db-viewer.html" style="color: #ffd700; text-decoration: none; font-size: 12px; font-weight: bold;">📁 Управление БД</a>' : ''}
                    <button onclick="(${onLogout.toString()})()" class="logout-btn" style="background-color: #ffd700; color: #1e4d2f; border: none; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; cursor: pointer; transition: all 0.3s;">
                        Выйти
                    </button>
                </div>
            `;
        } else {
            // Пользователь не авторизован
            authCorner.innerHTML = `
                <div class="auth-buttons-corner" style="display: flex; gap: 8px; background-color: white; padding: 5px; border-radius: 40px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); border: 2px solid #2c6e49;">
                    <button onclick="(${onLoginClick.toString()})('login')" class="auth-btn" style="background-color: #2c6e49; color: white; border: none; padding: 6px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; cursor: pointer; transition: all 0.3s;">
                        🔐 Вход
                    </button>
                    <button onclick="(${onLoginClick.toString()})('register')" class="auth-btn" style="background-color: #2c6e49; color: white; border: none; padding: 6px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; cursor: pointer; transition: all 0.3s;">
                        📝 Регистрация
                    </button>
                </div>
            `;
        }

        // Добавляем стили для кнопок при наведении
        const style = document.createElement('style');
        style.textContent = `
            .logout-btn:hover, .auth-btn:hover {
                transform: scale(1.05);
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            }
            .logout-btn:active, .auth-btn:active {
                transform: scale(0.98);
            }
        `;
        if (!document.querySelector('#auth-corner-styles')) {
            style.id = 'auth-corner-styles';
            document.head.appendChild(style);
        }
    }

    // Экранирование HTML
    static escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Показать индикатор загрузки на кнопке
    static setButtonLoading(buttonId, isLoading, loadingText = 'Загрузка...') {
        const button = document.getElementById(buttonId);
        if (!button) return;

        if (isLoading) {
            button.dataset.originalText = button.textContent;
            button.textContent = loadingText;
            button.disabled = true;
        } else {
            button.textContent = button.dataset.originalText || button.textContent;
            button.disabled = false;
        }
    }
}

// Делаем класс глобальным
window.AuthView = AuthView;