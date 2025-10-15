// Начальные данные опросника
let questionnaireData = {
    "idAnketa": "1",
    "idPacient": "1",
    "title": "Анкета для оценки выполнения рекомендаций по изменению образа жизни",
    "questionnaire": []
};

// Загружаем конфигурацию
const config = window.questionnaireConfig || {
    API_BASE_URL: 'http://localhost:5000/api',
    TELEGRAM_BOT_URL: 'https://t.me/HealthMonitoringUR_bot'
};

// Состояние верификации
let patientVerificationStatus = {
    verified: false,
    patientId: null,
    phone: null
};

/**
 * Показывает элемент загрузки
 */
function showLoading() {
    document.getElementById('loading').style.display = 'flex';
    document.getElementById('error-message').style.display = 'none';
    document.getElementById('questionnaireForm').style.display = 'none';
}

/**
 * Показывает сообщение об ошибке
 */
function showError() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error-message').style.display = 'block';
    document.getElementById('questionnaireForm').style.display = 'none';
}

/**
 * Показывает форму опросника
 */
function showForm() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error-message').style.display = 'none';
    document.getElementById('questionnaireForm').style.display = 'block';
}

/**
 * Загружает данные из JSON файла
 * @returns {Promise} Promise с данными опросника
 */
async function loadQuestionnaireData() {
    try {
        showLoading();
        const response = await fetch('mock.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        questionnaireData = await response.json();
        return questionnaireData;
    } catch (error) {
        console.error('Ошибка загрузки данных из JSON:', error);
        showError();
        throw error;
    }
}

/**
 * Показывает анимацию успешной отправки
 */
function showSuccessAnimation() {
    const successAnim = document.getElementById('success-animation');
    if (successAnim) {
        successAnim.classList.add('show');
        setTimeout(() => {
            successAnim.classList.remove('show');
        }, 2000);
    }
}

/**
 * Создает элемент формы на основе типа вопроса
 * @param {Object} question - Объект с данными вопроса
 * @returns {HTMLElement} - Созданный элемент ввода
 */
function createInputElement(question) {
    let input;
    
    if (question.type === 'text') {
        input = document.createElement('textarea');
        input.rows = 4;
        input.maxLength = question.validation?.max_length || 500;
    } else {
        input = document.createElement('input');
        input.type = question.type;
    }
    
    input.placeholder = `Пример: ${question.example}`;
    input.dataset.questionId = question.question;
    input.required = true; // Делаем все поля обязательными
    
    // Устанавливаем вчерашнюю дату для поля даты по умолчанию
    if (question.type === 'date' && question.question === 'Дата заполнения анкеты:') {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1); // Вычитаем один день
        const yyyy = yesterday.getFullYear();
        const mm = String(yesterday.getMonth() + 1).padStart(2, '0');
        const dd = String(yesterday.getDate()).padStart(2, '0');
        input.value = `${yyyy}-${mm}-${dd}`;
    }
    
    // Добавляем анимацию при фокусе
    input.addEventListener('focus', function() {
        this.classList.add('focused');
    });
    
    input.addEventListener('blur', function() {
        this.classList.remove('focused');
        
        // Проверяем валидность поля при потере фокуса
        validateField(this);
    });
    
    // Применяем правила валидации
    if (question.validation) {
        if (question.validation.min !== undefined) input.min = question.validation.min;
        if (question.validation.max !== undefined) input.max = question.validation.max;
        if (question.validation.pattern) input.pattern = question.validation.pattern;
    }
    
    return input;
}

/**
 * Проверяет валидность поля и отображает сообщение об ошибке
 * @param {HTMLElement} field - Поле для проверки
 */
function validateField(field) {
    // Удаляем предыдущее сообщение об ошибке, если оно есть
    const parent = field.parentElement;
    const existingError = parent.querySelector('.error-hint');
    if (existingError) {
        parent.removeChild(existingError);
    }
    
    // Если поле невалидно, показываем сообщение об ошибке
    if (!field.validity.valid) {
        const errorHint = document.createElement('div');
        errorHint.className = 'error-hint';
        
        // Определяем текст ошибки в зависимости от типа валидации
        if (field.validity.valueMissing) {
            errorHint.textContent = 'Это поле обязательно для заполнения';
        } else if (field.validity.rangeUnderflow) {
            errorHint.textContent = `Минимальное значение: ${field.min}`;
        } else if (field.validity.rangeOverflow) {
            errorHint.textContent = `Максимальное значение: ${field.max}`;
        } else if (field.validity.patternMismatch) {
            errorHint.textContent = 'Неверный формат';
        }
        
        // Добавляем сообщение об ошибке после поля ввода
        parent.appendChild(errorHint);
        
        // Анимация ошибки
        field.classList.add('invalid');
        setTimeout(() => {
            field.classList.remove('invalid');
        }, 500);
    } else {
        field.classList.add('valid');
    }
}

/**
 * Генерирует форму опросника на основе данных
 */
function generateForm() {
    const form = document.getElementById('questionnaireForm');
    const title = document.getElementById('title');
    
    if (!form || !title) {
        console.error('Не найдены необходимые элементы формы');
        return;
    }
    
    // Очищаем форму перед генерацией
    form.innerHTML = '';
    title.textContent = questionnaireData.title;

    // Создаем элементы для каждого вопроса
    questionnaireData.questionnaire.forEach((question, index) => {
        const group = document.createElement('div');
        group.className = 'question-group';
        group.style.animationDelay = `${index * 0.1}s`;

        const label = document.createElement('label');
        label.textContent = question.question;
        
        const input = createInputElement(question);

        // Добавляем обработчик ввода для проверки в реальном времени
        input.addEventListener('input', function() {
            // Сбрасываем классы валидации при новом вводе
            this.classList.remove('valid', 'invalid');
        });

        group.appendChild(label);
        group.appendChild(input);
        form.appendChild(group);
    });

    // Добавляем контейнер для сообщения об ошибке формы
    const formErrorContainer = document.createElement('div');
    formErrorContainer.id = 'form-error-container';
    formErrorContainer.className = 'form-error-container';
    formErrorContainer.style.display = 'none';
    form.appendChild(formErrorContainer);

    // Добавляем кнопку отправки
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.textContent = 'Отправить анкету';
    form.appendChild(submitBtn);
    
    // Добавляем обработчик отправки формы
    form.addEventListener('submit', handleFormSubmit);
    
    // Добавляем обработчик валидации всей формы перед отправкой
    form.addEventListener('invalid', function(e) {
        // Предотвращаем стандартное поведение браузера
        e.preventDefault();
        
        // Отображаем сообщение об ошибке формы
        const errorContainer = document.getElementById('form-error-container');
        if (errorContainer) {
            errorContainer.textContent = 'Пожалуйста, заполните все обязательные поля';
            errorContainer.style.display = 'block';
            
            // Скрываем сообщение через 5 секунд
            setTimeout(() => {
                errorContainer.style.display = 'none';
            }, 5000);
        }
        
        // Фокусируемся на первом невалидном поле
        const firstInvalid = this.querySelector('input:invalid, textarea:invalid');
        if (firstInvalid) {
            validateField(firstInvalid);
            firstInvalid.focus();
            firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, true);
    
    // Показываем форму после генерации
    showForm();
}

/**
 * Анимирует элементы формы
 */
function animateFormElements() {
    const elements = document.querySelectorAll('.question-group');
    
    // Применяем задержку для каждого элемента
    elements.forEach((el, idx) => {
        // Сначала скрываем элемент
        el.style.opacity = '0';
        el.style.transform = 'translateX(-20px)';
        
        // Затем показываем с задержкой
        setTimeout(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateX(0)';
        }, idx * 100 + 300);
    });
    
    // Добавляем эффект появления для кнопки отправки
    const submitBtn = document.querySelector('#questionnaireForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.style.opacity = '0';
        submitBtn.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            submitBtn.style.opacity = '1';
            submitBtn.style.transform = 'translateY(0)';
        }, elements.length * 100 + 500);
    }
}

/**
 * Проверяет статус верификации пациента
 */
async function checkPatientVerification() {
    try {
        // Получаем номер телефона из URL параметров или localStorage
        const urlParams = new URLSearchParams(window.location.search);
        const phone = urlParams.get('phone') || localStorage.getItem('patientPhone');
        
        if (!phone) {
            showVerificationRequired('Номер телефона не найден');
            return false;
        }

        // Проверяем статус верификации через API
        const response = await fetch(`${config.API_BASE_URL}/patients/verify-status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ phone })
        });

        if (!response.ok) {
            throw new Error('Ошибка проверки статуса');
        }

        const data = await response.json();
        
        if (data.success && data.data.verified) {
            patientVerificationStatus = {
                verified: true,
                patientId: data.data.patientId,
                phone: phone
            };
            return true;
        } else {
            showVerificationRequired('Требуется подтверждение данных');
            return false;
        }
    } catch (error) {
        console.error('Ошибка проверки верификации:', error);
        showVerificationRequired('Ошибка проверки статуса');
        return false;
    }
}

/**
 * Показывает блок с требованием верификации
 */
function showVerificationRequired(message) {
    const loadingElement = document.getElementById('loading');
    const errorElement = document.getElementById('error-message');
    const formElement = document.getElementById('questionnaireForm');
    
    // Скрываем все элементы
    if (loadingElement) loadingElement.style.display = 'none';
    if (errorElement) errorElement.style.display = 'none';
    if (formElement) formElement.style.display = 'none';
    
    // Создаем или обновляем блок верификации
    let verificationBlock = document.getElementById('verification-required');
    if (!verificationBlock) {
        verificationBlock = document.createElement('div');
        verificationBlock.id = 'verification-required';
        verificationBlock.className = 'verification-block';
        document.querySelector('.container').appendChild(verificationBlock);
    }
    
    verificationBlock.innerHTML = `
        <div class="verification-content">
            <div class="verification-icon">🔒</div>
            <h2>Требуется подтверждение данных</h2>
            <p>${message}</p>
            <p>Для заполнения анкеты необходимо подтвердить ваши данные через Telegram</p>
            <div class="verification-actions">
                <a href="${config.TELEGRAM_BOT_URL}" class="btn btn-primary" target="_blank">
                    Подтвердить через Telegram
                </a>
                <button onclick="retryVerification()" class="btn btn-secondary">
                    Проверить снова
                </button>
            </div>
            <div class="verification-info">
                <p><strong>Как это работает:</strong></p>
                <ol>
                    <li>Нажмите "Подтвердить через Telegram"</li>
                    <li>Согласитесь с политикой конфиденциальности</li>
                    <li>Поделитесь своим номером телефона</li>
                    <li>Вернитесь на эту страницу и нажмите "Проверить снова"</li>
                </ol>
            </div>
        </div>
    `;
    
    verificationBlock.style.display = 'block';
}

/**
 * Повторная проверка верификации
 */
async function retryVerification() {
    const verified = await checkPatientVerification();
    if (verified) {
        // Скрываем блок верификации и загружаем анкету
        const verificationBlock = document.getElementById('verification-required');
        if (verificationBlock) {
            verificationBlock.style.display = 'none';
        }
        await initApp();
    }
}

/**
 * Отправляет данные анкеты в analiz-system
 */
async function submitToAnalizSystem(formData) {
    try {
        const response = await fetch(`${config.API_BASE_URL}/medical-data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                patientId: patientVerificationStatus.patientId,
                questionnaireData: formData,
                timestamp: new Date().toISOString()
            })
        });

        if (!response.ok) {
            throw new Error('Ошибка отправки данных');
        }

        const result = await response.json();
        return result.success;
    } catch (error) {
        console.error('Ошибка отправки в analiz-system:', error);
        return false;
    }
}

/**
 * Обработчик отправки формы
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Проверяем верификацию перед отправкой
    if (!patientVerificationStatus.verified) {
        alert('Требуется подтверждение данных для отправки анкеты');
        return;
    }

    const formData = new FormData(e.target);
    const data = {};
    
    // Собираем данные формы
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }

    // Показываем анимацию загрузки
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Отправка...';
    submitButton.disabled = true;

    try {
        // Отправляем в analiz-system
        const analizSuccess = await submitToAnalizSystem(data);
        
        if (analizSuccess) {
            // Показываем анимацию успеха
            showSuccessAnimation();
            
            // Очищаем форму
            e.target.reset();
            
            // Показываем сообщение об успехе
            setTimeout(() => {
                alert('Анкета успешно отправлена! Данные сохранены в системе.');
            }, 2000);
        } else {
            throw new Error('Ошибка отправки в analiz-system');
        }
    } catch (error) {
        console.error('Ошибка отправки формы:', error);
        alert('Произошла ошибка при отправке анкеты. Попробуйте позже.');
    } finally {
        // Восстанавливаем кнопку
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
}

/**
 * Инициализирует приложение
 */
async function initApp() {
    try {
        // Сначала проверяем верификацию
        const verified = await checkPatientVerification();
        
        if (!verified) {
            return; // Останавливаем инициализацию, показывается блок верификации
        }

        // Если верифицирован, загружаем анкету
        await loadQuestionnaireData();
        generateForm();
        animateFormElements();
        
        // Добавляем обработчик отправки
        const form = document.getElementById('questionnaireForm');
        if (form) {
            form.addEventListener('submit', handleFormSubmit);
        }
        
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        showError();
    }
}

// Инициализация при загрузке страницы
window.addEventListener('DOMContentLoaded', () => {
    // Инициализируем приложение
    initApp();
    
    // Добавляем обработчик отправки формы
    const form = document.getElementById('questionnaireForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    
    // Добавляем обработчик кнопки повторной попытки
    const retryButton = document.getElementById('retry-button');
    if (retryButton) {
        retryButton.addEventListener('click', initApp);
    }
});

// Проверяем, что Telegram Web App API доступен
function initTelegramWebApp() {
    if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
        console.log("Telegram Web App API доступен!");

        document.getElementById('questionnaireForm').addEventListener('submit', function(event) {
            event.preventDefault();
            const data = {};
            const inputs = this.querySelectorAll('input, textarea');
            inputs.forEach(input => {
                const question = input.dataset.questionId;
                data[question] = input.value;
            });

            console.log("Данные для отправки:", data);

            // Отправляем данные обратно в Telegram
            Telegram.WebApp.sendData(JSON.stringify(data));
            console.log("Данные отправлены!");

            // Закрываем Web App после отправки данных
            Telegram.WebApp.close();
        });
    } else {
        console.error("Telegram Web App API не доступен.");
        alert("Этот Web App работает только внутри Telegram. Пожалуйста, откройте его через бота.");
    }
}

// Инициализация Telegram Web App
initTelegramWebApp();
