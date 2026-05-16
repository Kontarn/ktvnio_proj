/**
 * Основное приложение системы дистанционного обучения
 */

class LearningApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentTopicIndex = 0;
        this.currentTestQuestion = 0;
        this.testStartTime = null;
        this.testAnswers = {};
        this.learningTopics = [];
        
        this.init();
    }
    
    async init() {
        await DataManager.loadData();
        this.setupEventListeners();
        this.checkSession();
    }
    
    // Настройка обработчиков событий
    setupEventListeners() {
        // Форма входа
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
        
        // Выход - проверяем и прямую привязку, и делегирование
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                console.log('Клик по кнопке выхода обнаружен');
                e.stopPropagation();
                this.handleLogout();
            });
        }
        
        // Дополнительно - делегирование на весь документ
        document.addEventListener('click', (e) => {
            if (e.target.closest('#logout-btn')) {
                console.log('Делегированный клик по кнопке выхода');
                this.handleLogout();
            }
        });
        
        // Навигация
        document.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem) {
                const section = navItem.dataset.section;
                this.navigate(section);
            }
        });
        
        // Навигация по темам
        const prevTopicBtn = document.getElementById('prev-topic');
        const nextTopicBtn = document.getElementById('next-topic');
        const completeLearningBtn = document.getElementById('complete-learning-btn');
        const startTestBtn = document.getElementById('start-test-btn');
        const prevQuestionBtn = document.getElementById('prev-question-btn');
        const nextQuestionBtn = document.getElementById('next-question-btn');
        const submitTestBtn = document.getElementById('submit-test-btn');
        const refreshLogsBtn = document.getElementById('refresh-logs-btn');
        const solveEquationBtn = document.getElementById('solve-equation-btn');
        const clearCalculatorBtn = document.getElementById('clear-calculator-btn');
        
        if (prevTopicBtn) prevTopicBtn.addEventListener('click', () => this.prevTopic());
        if (nextTopicBtn) nextTopicBtn.addEventListener('click', () => this.nextTopic());
        if (completeLearningBtn) completeLearningBtn.addEventListener('click', () => this.completeLearning());
        if (startTestBtn) startTestBtn.addEventListener('click', () => this.startTest());
        if (prevQuestionBtn) prevQuestionBtn.addEventListener('click', () => this.prevQuestion());
        if (nextQuestionBtn) nextQuestionBtn.addEventListener('click', () => this.nextQuestion());
        if (submitTestBtn) submitTestBtn.addEventListener('click', () => this.submitTest());
        if (refreshLogsBtn) refreshLogsBtn.addEventListener('click', () => this.loadLogs());
        const refreshStudentResultsBtn = document.getElementById('refresh-student-results-btn');
        if (refreshStudentResultsBtn) refreshStudentResultsBtn.addEventListener('click', () => this.loadStudentResults());
        if (solveEquationBtn) solveEquationBtn.addEventListener('click', () => this.solveEquation());
        if (clearCalculatorBtn) clearCalculatorBtn.addEventListener('click', () => this.clearCalculator());
        
        // Фильтры логов
        const logUserFilter = document.getElementById('log-user-filter');
        const logTypeFilter = document.getElementById('log-type-filter');
        if (logUserFilter) logUserFilter.addEventListener('change', () => this.loadLogs());
        if (logTypeFilter) logTypeFilter.addEventListener('change', () => this.loadLogs());
        const courseFilter = document.getElementById('course-filter');
        if (courseFilter) courseFilter.addEventListener('change', () => this.loadStudentResults());
        
        // Модальное окно
        const modalClose = document.querySelector('.modal-close');
        const modal = document.getElementById('modal');
        if (modalClose) modalClose.addEventListener('click', () => this.closeModal());
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target.id === 'modal') this.closeModal();
            });
        }
    }
    
    // Проверка активной сессии
    async checkSession() {
        const user = DataManager.getCurrentUser();
        if (user) {
            this.showMainScreen();
        } else {
            this.showAuthScreen();
        }
    }
    
    // Обработка входа
    async handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        const user = await DataManager.authenticate(username, password);
        
        if (user) {
            // Обновляем время входа
            DataManager.updateUser({ lastLogin: new Date().toISOString() });
            // Полностью скрываем экран аутентификации и показываем главный
            this.hideAuthScreen();
            this.showMainScreen();
        } else {
            alert('Неверное имя пользователя или пароль!');
        }
    }
    
    // Обработка выхода
    async handleLogout() {
        console.log('handleLogout вызван');
        try {
            // Сначала обновляем время выхода
            if (DataManager.getCurrentUser()) {
                DataManager.updateUser({ lastLogout: new Date().toISOString() });
            }
            // Затем выполняем выход
            await DataManager.logout();
            console.log('Выход выполнен, показываем экран входа');
            this.showAuthScreen();
            document.getElementById('login-form').reset();
        } catch (error) {
            console.error('Ошибка при выходе:', error);
        }
    }
    
    // Показ экрана аутентификации
    showAuthScreen() {
        document.getElementById('auth-screen').classList.add('active');
        document.getElementById('main-screen').classList.remove('active');
    }
    
    // Скрытие экрана аутентификации
    hideAuthScreen() {
        document.getElementById('auth-screen').classList.remove('active');
    }
    
    // Показ главного экрана
    showMainScreen() {
        const user = DataManager.getCurrentUser();
        if (!user) return;
        
        // Явно скрываем экран аутентификации
        document.getElementById('auth-screen').classList.remove('active');
        document.getElementById('main-screen').classList.add('active');
        
        // Обновляем информацию о пользователе
        document.getElementById('user-info').innerHTML = `
            <strong>${user.username}</strong> (${user.roleName})
        `;
        
        // Переподключаем обработчик для кнопки выхода после показа экрана
        setTimeout(() => {
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    console.log('Кнопка выхода активна');
                    e.stopPropagation();
                    this.handleLogout();
                });
            }
        }, 100);
        
        // Показываем/скрываем админские пункты меню
        const adminItems = document.querySelectorAll('.admin-only');
        const isAdmin = DataManager.hasRole(['teacher', 'developer', 'support']);
        adminItems.forEach(item => {
            item.style.display = isAdmin ? 'flex' : 'none';
        });
        
        // Показываем/скрываем пункты меню для преподавателей
        const teacherItems = document.querySelectorAll('.teacher-only');
        const isTeacher = DataManager.hasRole('teacher');
        teacherItems.forEach(item => {
            item.style.display = isTeacher ? 'flex' : 'none';
        });
        
        // Загружаем контент
        this.navigate('dashboard');
    }
    
    // Навигация по секциям
    navigate(section) {
        // Обновляем активный пункт меню
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === section) {
                item.classList.add('active');
            }
        });
        
        // Скрываем все секции
        document.querySelectorAll('.content-section').forEach(sec => {
            sec.classList.remove('active');
        });
        
        // Показываем нужную секцию
        const targetSection = document.getElementById(`section-${section}`);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = section;
            
            // Загружаем контент секции
            this.loadSectionContent(section);
        }
    }
    
    // Загрузка контента секции
    loadSectionContent(section) {
        switch(section) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'courses':
                this.loadCourses();
                break;
            case 'learning':
                this.loadLearning();
                break;
            case 'tests':
                this.loadTests();
                break;
            case 'results':
                this.loadResults();
                break;
            case 'calculator':
                this.loadCalculator();
                break;
            case 'student-results':
                this.loadStudentResults();
                break;
            case 'users':
                this.loadUsers();
                break;
            case 'logs':
                this.loadLogs();
                break;
        }
    }
    
    // Загрузка дашборда
    loadDashboard() {
        const user = DataManager.getCurrentUser();
        if (!user) return;
        
        const stats = DataManager.getStats();
        
        document.getElementById('courses-count').textContent = stats.enrolledCourses + ' курсов';
        document.getElementById('tests-completed').textContent = stats.testsCompleted;
        document.getElementById('average-score').textContent = stats.averageScore + '%';
        document.getElementById('time-spent').textContent = 'В системе';
    }
    
    // Загрузка курсов
    loadCourses() {
        const coursesList = document.getElementById('courses-list');
        const courses = DataManager.getCourses();
        const user = DataManager.getCurrentUser();
        
        coursesList.innerHTML = courses.map(course => {
            const isEnrolled = user.enrolledCourses.includes(course.id);
            const statusClass = isEnrolled ? 'status-enrolled' : 'status-available';
            const statusText = isEnrolled ? 'Записан' : 'Доступен';
            
            return `
                <div class="course-card">
                    <span class="course-status ${statusClass}">${statusText}</span>
                    <h3>${course.title}</h3>
                    <p>${course.description}</p>
                    <p><strong>Преподаватель:</strong> ${course.instructor}</p>
                    <p><strong>Длительность:</strong> ${course.duration}</p>
                    <button class="btn btn-primary" onclick="app.enrollToCourse(${course.id})">
                        ${isEnrolled ? 'К изучению' : 'Записаться на курс'}
                    </button>
                </div>
            `;
        }).join('');
    }
    
    // Запись на курс
    async enrollToCourse(courseId) {
        const success = await DataManager.enrollCourse(courseId);
        if (success) {
            alert('Вы успешно записаны на курс!');
            this.loadCourses();
        } else {
            alert('Ошибка записи на курс');
        }
    }
        
    // Загрузка материала для изучения
    loadLearning() {
        const user = DataManager.getCurrentUser();
        
        // Проверяем записан ли пользователь на курс
        if (!user.enrolledCourses.includes(1)) {
            this.showModal(`
                <h3>Запись на курс обязательна</h3>
                <p>Сначала запишитесь на курс в разделе "Курсы"</p>
                <button class="btn btn-primary" onclick="app.navigate('courses'); app.closeModal();">
                    Перейти к курсам
                </button>
            `);
            return;
        }
        
        this.learningTopics = DataManager.getCourseTopics(1);
        this.currentTopicIndex = 0;
        
        // Находим первую незавершённую тему
        for (let i = 0; i < this.learningTopics.length; i++) {
            const topicId = this.learningTopics[i].id;
            if (!user.learningProgress[topicId]?.completed) {
                this.currentTopicIndex = i;
                break;
            }
        }
        
        this.showTopic();
    }
    
    // Показ текущей темы
    showTopic() {
        if (this.learningTopics.length === 0) return;
        
        const topic = this.learningTopics[this.currentTopicIndex];
        const progress = `${this.currentTopicIndex + 1}/${this.learningTopics.length}`;
        
        document.getElementById('topic-progress').textContent = progress;
        document.getElementById('learning-content').innerHTML = `
            <h3>${topic.title}</h3>
            <div class="learning-content">${topic.content}</div>
        `;
        
        // Обновляем кнопки навигации
        document.getElementById('prev-topic').disabled = this.currentTopicIndex === 0;
        document.getElementById('next-topic').disabled = this.currentTopicIndex === this.learningTopics.length - 1;
        
        // Показываем кнопку завершения на последней теме
        const completeBtn = document.getElementById('complete-learning-btn');
        if (this.currentTopicIndex === this.learningTopics.length - 1) {
            completeBtn.style.display = 'inline-block';
        } else {
            completeBtn.style.display = 'none';
        }
    }
        
    prevTopic() {
        if (this.currentTopicIndex > 0) {
            this.currentTopicIndex--;
            this.showTopic();
        }
    }
    
    nextTopic() {
        if (this.currentTopicIndex < this.learningTopics.length - 1) {
            this.currentTopicIndex++;
            this.showTopic();
        }
    }
    
    // Завершение изучения материала
    async completeLearning() {
        const user = DataManager.getCurrentUser();
        const topic = this.learningTopics[this.currentTopicIndex];
        
        // Отмечаем все темы как изученные
        for (const t of this.learningTopics) {
            await DataManager.updateTopicProgress(t.id, true, 60);
        }
        
        alert('Материал курса успешно изучен! Теперь вы можете пройти тестирование.');
        this.navigate('tests');
    }
    
    // Загрузка тестирования
    loadTests() {
        const user = DataManager.getCurrentUser();
        
        // Проверяем записан ли пользователь на курс
        if (!user.enrolledCourses.includes(1)) {
            this.showModal(`
                <h3>Запись на курс обязательна</h3>
                <p>Сначала запишитесь на курс в разделе "Курсы"</p>
                <button class="btn btn-primary" onclick="app.navigate('courses'); app.closeModal();">
                    Перейти к курсам
                </button>
            `);
            return;
        }
        
        // Проверяем изучил ли пользователь материал
        const allTopicsCompleted = this.learningTopics.length > 0 && 
            this.learningTopics.every(t => user.learningProgress[t.id]?.completed);
        
        if (!allTopicsCompleted) {
            this.showModal(`
                <h3>Изучение материала обязательно</h3>
                <p>Сначала изучите весь материал курса в разделе "Изучение материала"</p>
                <button class="btn btn-primary" onclick="app.navigate('learning'); app.closeModal();">
                    Перейти к изучению
                </button>
            `);
            return;
        }
        
        // Показываем экран тестирования
        document.getElementById('test-intro').style.display = 'block';
        document.getElementById('test-container').style.display = 'none';
        document.getElementById('test-results').style.display = 'none';
    }
    
    // Начало тестирования
    startTest() {
        const test = DataManager.getTest(1);
        if (!test) return;
        
        this.testAnswers = {};
        this.currentTestQuestion = 0;
        this.testStartTime = Date.now();
        
        document.getElementById('test-intro').style.display = 'none';
        document.getElementById('test-container').style.display = 'block';
        document.getElementById('test-results').style.display = 'none';
        
        this.showQuestion();
        this.startTimer();
    }
    
    // Таймер тестирования
    startTimer() {
        const duration = DataManager.data.settings.testDuration * 60; // в секундах
        const timerElement = document.getElementById('timer');
        
        const timer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.testStartTime) / 1000);
            const remaining = duration - elapsed;
            
            if (remaining <= 0) {
                clearInterval(timer);
                this.submitTest();
                return;
            }
            
            const minutes = Math.floor(remaining / 60);
            const seconds = remaining % 60;
            timerElement.textContent = `⏱️ ${minutes}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }
    
    // Показ вопроса
    showQuestion() {
        const test = DataManager.getTest(1);
        const question = test.questions[this.currentTestQuestion];
        
        document.getElementById('question-progress').textContent = 
            `Вопрос ${this.currentTestQuestion + 1} из ${test.questions.length}`;
        
        const optionsHtml = question.options.map((option, index) => `
            <li>
                <label>
                    <input type="radio" name="answer" value="${index}" 
                        ${this.testAnswers[this.currentTestQuestion] === index ? 'checked' : ''}>
                    <span>${option}</span>
                </label>
            </li>
        `).join('');
        
        document.getElementById('question-container').innerHTML = `
            <div class="question-text">${question.question}</div>
            <ul class="options-list">${optionsHtml}</ul>
        `;
        
        // Обновляем кнопки навигации
        document.getElementById('prev-question-btn').disabled = this.currentTestQuestion === 0;
        
        const nextBtn = document.getElementById('next-question-btn');
        const submitBtn = document.getElementById('submit-test-btn');
        
        if (this.currentTestQuestion === test.questions.length - 1) {
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'inline-block';
        } else {
            nextBtn.style.display = 'inline-block';
            submitBtn.style.display = 'none';
        }
        
        // Сохраняем ответ при выборе
        document.querySelectorAll('input[name="answer"]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.testAnswers[this.currentTestQuestion] = parseInt(e.target.value);
            });
        });
    }
        
    prevQuestion() {
        if (this.currentTestQuestion > 0) {
            this.currentTestQuestion--;
            this.showQuestion();
        }
    }
    
    nextQuestion() {
        const test = DataManager.getTest(1);
        if (this.currentTestQuestion < test.questions.length - 1) {
            this.currentTestQuestion++;
            this.showQuestion();
        }
    }
    
    // Завершение тестирования
    async submitTest() {
        const test = DataManager.getTest(1);
        let correctAnswers = 0;
        
        // Подсчитываем правильные ответы
        for (let i = 0; i < test.questions.length; i++) {
            if (this.testAnswers[i] === test.questions[i].correct) {
                correctAnswers++;
            }
        }
        
        const score = Math.round((correctAnswers / test.questions.length) * 100);
        
        // Сохраняем результат
        await DataManager.saveTestResult(test.id, score, correctAnswers, test.questions.length);
        
        // Показываем результаты
        document.getElementById('test-container').style.display = 'none';
        document.getElementById('test-results').style.display = 'block';
        
        const grade = score >= 80 ? 'Отлично!' : score >= 60 ? 'Хорошо' : score >= 40 ? 'Удовлетворительно' : 'Неудовлетворительно';
        const gradeColor = score >= 80 ? '#28a745' : score >= 60 ? '#17a2b8' : score >= 40 ? '#ffc107' : '#dc3545';
        
        document.querySelector('.results-summary').innerHTML = `
            <p>Вы ответили правильно на <strong>${correctAnswers} из ${test.questions.length}</strong> вопросов</p>
            <div class="score" style="color: ${gradeColor}">${score}%</div>
            <div class="grade" style="color: ${gradeColor}; font-weight: bold;">${grade}</div>
            <button class="btn btn-primary" onclick="app.navigate('results')">Посмотреть результаты</button>
            <button class="btn btn-secondary" onclick="app.navigate('dashboard')">На главную</button>
        `;
    }
    
    // Загрузка результатов
    loadResults() {
        const user = DataManager.getCurrentUser();
        const resultsContent = document.getElementById('results-content');
        
        if (user.testResults.length === 0) {
            resultsContent.innerHTML = `
                <p>Вы ещё не проходили тестирование.</p>
                <button class="btn btn-primary" onclick="app.navigate('tests')">Перейти к тестированию</button>
            `;
            return;
        }
        
        const tableHtml = `
            <table class="results-table">
                <thead>
                    <tr>
                        <th>Тест</th>
                        <th>Дата</th>
                        <th>Правильных ответов</th>
                        <th>Результат</th>
                    </tr>
                </thead>
                <tbody>
                    ${user.testResults.map(result => `
                        <tr>
                            <td>${result.testTitle}</td>
                            <td>${new Date(result.timestamp).toLocaleString('ru-RU')}</td>
                            <td>${result.correctAnswers}/${result.totalQuestions}</td>
                            <td>
                                <span style="color: ${result.percentage >= 60 ? '#28a745' : '#dc3545'}; font-weight: bold;">
                                    ${result.percentage}%
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        resultsContent.innerHTML = tableHtml;
    }
    
    // Загрузка пользователей (админ)
    loadUsers() {
        const usersList = document.getElementById('users-list');
        const users = DataManager.getAllUsers();
        
        usersList.innerHTML = `
            <table class="users-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Имя пользователя</th>
                        <th>Роль</th>
                        <th>Курсы</th>
                        <th>Тесты</th>
                        <th>Последний вход</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td>${user.id}</td>
                            <td>${user.username}</td>
                            <td><span class="user-role role-${user.role}">${user.roleName}</span></td>
                            <td>${user.enrolledCourses}</td>
                            <td>${user.testResults}</td>
                            <td>${user.lastLogin ? new Date(user.lastLogin).toLocaleString('ru-RU') : '—'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
    
    // Загрузка журналов событий (админ)
    loadLogs() {
        const logsContent = document.getElementById('logs-content');
        
        // Заполняем фильтр пользователей
        const userFilter = document.getElementById('log-user-filter');
        if (userFilter.options.length === 1) {
            const users = DataManager.getAllUsers();
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = user.username;
                userFilter.appendChild(option);
            });
        }
        
        const userId = document.getElementById('log-user-filter').value;
        const actionType = document.getElementById('log-type-filter').value;
        
        const filters = {};
        if (userId !== 'all') filters.userId = parseInt(userId);
        if (actionType !== 'all') filters.action = actionType;
        
        const logs = DataManager.getLogs(filters);
        
        if (logs.length === 0) {
            logsContent.innerHTML = '<p>Событий не найдено</p>';
            return;
        }
        
        const actionLabels = {
            login: 'Вход',
            logout: 'Выход',
            enroll: 'Запись на курс',
            learning: 'Изучение материала',
            test: 'Тестирование'
        };
        
        const tableHtml = `
            <table class="logs-table">
                <thead>
                    <tr>
                        <th>Время</th>
                        <th>Пользователь</th>
                        <th>Событие</th>
                        <th>Описание</th>
                    </tr>
                </thead>
                <tbody>
                    ${logs.map(log => `
                        <tr>
                            <td>${new Date(log.timestamp).toLocaleString('ru-RU')}</td>
                            <td>${log.username}</td>
                            <td><span class="log-type type-${log.action}">${actionLabels[log.action]}</span></td>
                            <td>${log.description}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        logsContent.innerHTML = tableHtml;
    }
    
    // Загрузка калькулятора
    loadCalculator() {
        // Очистка полей при загрузке
        document.getElementById('coef-a').value = '1';
        document.getElementById('coef-b').value = '-5';
        document.getElementById('coef-c').value = '6';
        document.getElementById('solution-result').style.display = 'none';
    }
    
    // Загрузка результатов учеников (для преподавателей)
    loadStudentResults() {
        const user = DataManager.getCurrentUser();
        const resultsContent = document.getElementById('student-results-content');
        const courseFilter = document.getElementById('course-filter');
        
        // Заполняем фильтр курсов
        if (courseFilter.options.length === 1) {
            const courses = DataManager.getCourses();
            courses.forEach(course => {
                const option = document.createElement('option');
                option.value = course.id;
                option.textContent = course.title;
                courseFilter.appendChild(option);
            });
        }
        
        const selectedCourseId = courseFilter.value === 'all' ? null : parseInt(courseFilter.value);
        
        // Получаем всех слушателей
        const allUsers = DataManager.getAllUsers();
        const listeners = allUsers.filter(u => u.role === 'listener');
        
        if (listeners.length === 0) {
            resultsContent.innerHTML = '<p>Нет зарегистрированных слушателей.</p>';
            return;
        }
        
        // Фильтруем по курсу если выбран
        const filteredListeners = selectedCourseId 
            ? listeners.filter(u => u.enrolledCourses.includes(selectedCourseId))
            : listeners;
        
        if (filteredListeners.length === 0) {
            resultsContent.innerHTML = '<p>Нет слушателей, записанных на этот курс.</p>';
            return;
        }
        
        // Показываем результаты
        const courses = DataManager.getCourses();
        
        const html = filteredListeners.map(listener => {
            // Находим полного пользователя с данными
            const fullUser = DataManager.data.users.find(u => u.id === listener.id);
            if (!fullUser || !fullUser.testResults || fullUser.testResults.length === 0) {
                return `
                    <div class="student-card">
                        <h4>${listener.username} <span style="font-size: 14px; color: #666;">(не проходил тестирование)</span></h4>
                        <div class="student-info">
                            <span>Роль: ${listener.roleName}</span>
                            <span>Курсов: ${listener.enrolledCourses}</span>
                        </div>
                    </div>
                `;
            }
            
            // Группируем результаты по курсам
            const resultsByCourse = {};
            fullUser.testResults.forEach(result => {
                // Находим курс по testId
                const course = courses.find(c => c.testId === result.testId);
                if (course) {
                    if (!resultsByCourse[course.id]) {
                        resultsByCourse[course.id] = [];
                    }
                    resultsByCourse[course.id].push(result);
                }
            });
            
            // Фильтруем по выбранному курсу
            let courseResults = [];
            if (selectedCourseId) {
                if (resultsByCourse[selectedCourseId]) {
                    courseResults = [{
                        courseId: selectedCourseId,
                        courseTitle: courses.find(c => c.id === selectedCourseId)?.title || 'Курс',
                        results: resultsByCourse[selectedCourseId]
                    }];
                }
            } else {
                courseResults = Object.keys(resultsByCourse).map(courseId => ({
                    courseId: parseInt(courseId),
                    courseTitle: courses.find(c => c.id === parseInt(courseId))?.title || 'Курс',
                    results: resultsByCourse[courseId]
                }));
            }
            
            // Считаем средний балл
            const allPercentages = fullUser.testResults.map(r => r.percentage);
            const avgScore = allPercentages.length > 0 
                ? Math.round(allPercentages.reduce((a, b) => a + b, 0) / allPercentages.length)
                : 0;
            
            // Определяем цвет среднего балла
            let avgColor = avgScore >= 80 ? '#28a745' : avgScore >= 60 ? '#17a2b8' : avgScore >= 40 ? '#ffc107' : '#dc3545';
            
            return `
                <div class="student-card">
                    <h4>${listener.username} <span style="font-size: 18px; color: ${avgColor};">Средний балл: ${avgScore}%</span></h4>
                    <div class="student-info">
                        <span>Роль: ${listener.roleName}</span>
                        <span>Записан на курсов: ${listener.enrolledCourses}</span>
                        <span>Пройдено тестов: ${fullUser.testResults.length}</span>
                    </div>
                    <div class="results-by-course">
            ` + courseResults.map(cr => `
                        <div class="course-result">
                            <h5>${cr.courseTitle}</h5>
                            ${cr.results.map(r => `
                                <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-top: 10px;">
                                    <div class="result-score" style="color: ${r.percentage >= 60 ? '#28a745' : '#dc3545'};">${r.percentage}%</div>
                                    <div class="result-details">
                                        <span>Правильных: ${r.correctAnswers}/${r.totalQuestions}</span>
                                        <span>Дата: ${new Date(r.timestamp).toLocaleDateString('ru-RU')}</span>
                                        <span>Время: ${new Date(r.timestamp).toLocaleTimeString('ru-RU')}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
            `).join('') + `
                    </div>
                </div>
            `;
        }).join('');
        
        resultsContent.innerHTML = html;
    }
    
    // Решение квадратного уравнения
    solveEquation() {
        const a = parseFloat(document.getElementById('coef-a').value);
        const b = parseFloat(document.getElementById('coef-b').value);
        const c = parseFloat(document.getElementById('coef-c').value);
        
        if (isNaN(a) || isNaN(b) || isNaN(c)) {
            alert('Пожалуйста, введите все коэффициенты!');
            return;
        }
        
        if (a === 0) {
            // Линейное уравнение
            const x = -c / b;
            this.displaySolution({
                type: 'linear',
                equation: `${b}x + ${c} = 0`,
                steps: [
                    `Коэффициент a = 0, это линейное уравнение`,
                    `bx + c = 0`,
                    `bx = -c`,
                    `x = -c/b = -${c}/${b} = ${x}`
                ],
                roots: [`x = ${x}`]
            });
            return;
        }
        
        // Квадратное уравнение
        const discriminant = b * b - 4 * a * c;
        
        let solution = {
            type: 'quadratic',
            a: a,
            b: b,
            c: c,
            equation: `${a}x² + ${b}x + ${c} = 0`,
            steps: [`D = b² - 4ac = ${b}² - 4·${a}·${c} = ${discriminant}`],
            roots: []
        };
        
        if (discriminant > 0) {
            const x1 = (-b + Math.sqrt(discriminant)) / (2 * a);
            const x2 = (-b - Math.sqrt(discriminant)) / (2 * a);
            
            solution.steps.push(
                `D > 0, уравнение имеет два различных корня`,
                `x₁ = (-b + √D) / (2a) = (${-b} + √${discriminant}) / (${2 * a}) = ${(-b + Math.sqrt(discriminant)).toFixed(4)} / ${2 * a} = ${x1}`,
                `x₂ = (-b - √D) / (2a) = (${-b} - √${discriminant}) / (${2 * a}) = ${(-b - Math.sqrt(discriminant)).toFixed(4)} / ${2 * a} = ${x2}`
            );
            solution.roots = [`x₁ = ${x1}`, `x₂ = ${x2}`];
            solution.discriminant = discriminant;
            solution.x1 = x1;
            solution.x2 = x2;
        } else if (discriminant === 0) {
            const x = -b / (2 * a);
            
            solution.steps.push(
                `D = 0, уравнение имеет один корень (два совпадающих)`,
                `x = -b / (2a) = ${-b} / (${2 * a}) = ${x}`
            );
            solution.roots = [`x = ${x}`];
            solution.discriminant = discriminant;
            solution.x1 = x;
        } else {
            solution.steps.push(
                `D < 0, уравнение не имеет действительных корней`,
                'Корни существуют только в комплексных числах'
            );
            solution.roots = ['Нет действительных корней'];
            solution.discriminant = discriminant;
        }
        
        this.displaySolution(solution);
    }
    
    // Отображение решения
    displaySolution(solution) {
        const resultDiv = document.getElementById('solution-result');
        const contentDiv = document.getElementById('solution-content');
        
        let html = `
            <div class="solution-steps">
                <p><strong>Уравнение:</strong> ${solution.equation}</p>
        `;
        
        if (solution.type === 'quadratic') {
            html += `
                <p><strong>Дискриминант:</strong> D = ${solution.discriminant}</p>
            `;
        }
        
        html += `<p><strong>Шаги решения:</strong></p>`;
        solution.steps.forEach((step, i) => {
            html += `<p>${i + 1}. ${step}</p>`;
        });
        
        html += `</div><div class="solution-roots"><p><strong>Ответ:</strong></p><div class="roots-display">`;
        solution.roots.forEach(root => {
            html += `<p>${root}</p>`;
        });
        html += `</div></div>`;
        
        contentDiv.innerHTML = html;
        resultDiv.style.display = 'block';
    }
    
    // Очистка калькулятора
    clearCalculator() {
        document.getElementById('coef-a').value = '';
        document.getElementById('coef-b').value = '';
        document.getElementById('coef-c').value = '';
        document.getElementById('solution-result').style.display = 'none';
    }
    
    // Модальное окно
    showModal(content) {
        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modal-body');
        modalBody.innerHTML = content;
        modal.classList.add('active');
    }
    
    closeModal() {
        const modal = document.getElementById('modal');
        modal.classList.remove('active');
    }
}

// Инициализация приложения
const app = new LearningApp();
