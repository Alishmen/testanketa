// Начальные данные опросника
let questionnaireData = {
    "idAnketa": "1",
    "idPacient": "1",
    "title": "Анкета для оценки выполнения рекомендаций по изменению образа жизни",
    "questionnaire": []
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
 * Собирает и отправляет данные формы
 * @param {Event} e - Событие отправки формы
 */
function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = {};
    const inputs = this.querySelectorAll('input, textarea');
    let isValid = true;
    
    // Проверяем каждое поле на валидность
    inputs.forEach(input => {
        validateField(input);
        if (!input.validity.valid) {
            isValid = false;
        }
    });
    
    // Если форма не валидна, прекращаем отправку
    if (!isValid) {
        // Прокручиваем к первому невалидному полю
        const firstInvalid = this.querySelector('input:invalid, textarea:invalid');
        if (firstInvalid) {
            firstInvalid.focus();
            firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }
    
    // Анимация загрузки при отправке
    const submitBtn = this.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.textContent = 'Отправка...';
        submitBtn.disabled = true;
    }
    
    // Собираем данные
    inputs.forEach(input => {
        // Используем data-атрибут для связи с вопросом
        const question = input.dataset.questionId;
        formData[question] = input.value;
    });

    try {
        // Отправка данных
        console.log('Отправленные данные:', formData);
        
        // Показываем анимацию успешной отправки
        showSuccessAnimation();
        
        // Проверяем доступность Telegram WebApp API
        if (window.Telegram?.WebApp) {
            Telegram.WebApp.sendData(JSON.stringify(formData));
        } else {
            // Запасной вариант, если API Telegram недоступен
            setTimeout(() => {
                alert('Данные успешно отправлены!');
                
                // Сбрасываем форму после успешной отправки
                this.reset();
                
                // Восстанавливаем кнопку
                if (submitBtn) {
                    submitBtn.textContent = 'Отправить анкету';
                    submitBtn.disabled = false;
                }
            }, 2000);
        }
        
        // Анимация успешной отправки
        this.classList.add('submitted');
        setTimeout(() => {
            this.classList.remove('submitted');
        }, 300);
    } catch (error) {
        console.error('Ошибка при отправке данных:', error);
        alert('Произошла ошибка при отправке формы. Пожалуйста, попробуйте еще раз.');
        
        // Восстанавливаем кнопку
        if (submitBtn) {
            submitBtn.textContent = 'Отправить анкету';
            submitBtn.disabled = false;
        }
    }
}

/**
 * Инициализирует приложение
 */
async function initApp() {
    try {
        await loadQuestionnaireData();
        generateForm();
        animateFormElements();
    } catch (error) {
        console.error('Ошибка при инициализации приложения:', error);
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
