/**
 * Модуль работы с данными
 * Имитация работы с JSON-базой данных через localStorage
 */

const DataManager = {
    data: null,
    currentUser: null,
    
    // Загрузка данных из JSON
    async loadData() {
        try {
            const response = await fetch('data.json');
            this.data = await response.json();
            
            // Восстановление данных из localStorage если есть
            const storedData = localStorage.getItem('ls_data');
            if (storedData) {
                const parsed = JSON.parse(storedData);
                this.data.users = parsed.users || this.data.users;
                this.data.logs = parsed.logs || this.data.logs;
            }
            
            // Восстановление текущей сессии
            const storedUser = localStorage.getItem('ls_currentUser');
            if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                // Находим пользователя в обновлённом списке
                const currentUserFromData = this.data.users.find(u => u.id === parsedUser.id);
                if (currentUserFromData) {
                    this.currentUser = currentUserFromData;
                }
            }
            
            return this.data;
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            // Возвращаем данные по умолчанию если файл не найден
            this.data = this.getDefaultData();
            return this.data;
        }
    },
    
    // Сохранение данных в localStorage
    saveData() {
        localStorage.setItem('ls_data', JSON.stringify({
            users: this.data.users,
            logs: this.data.logs
        }));
    },
    
    // Получение данных по умолчанию
    getDefaultData() {
        return {
            users: [
                {
                    id: 1,
                    username: 'listener',
                    password: 'listener123',
                    role: 'listener',
                    roleName: 'Слушатель',
                    enrolledCourses: [],
                    testResults: [],
                    learningProgress: {},
                    lastLogin: null,
                    lastLogout: null
                },
                {
                    id: 2,
                    username: 'teacher',
                    password: 'teacher123',
                    role: 'teacher',
                    roleName: 'Преподаватель',
                    enrolledCourses: [],
                    testResults: [],
                    learningProgress: {},
                    lastLogin: null,
                    lastLogout: null
                },
                {
                    id: 3,
                    username: 'developer',
                    password: 'developer123',
                    role: 'developer',
                    roleName: 'Разработчик',
                    enrolledCourses: [],
                    testResults: [],
                    learningProgress: {},
                    lastLogin: null,
                    lastLogout: null
                },
                {
                    id: 4,
                    username: 'support',
                    password: 'support123',
                    role: 'support',
                    roleName: 'Техническая поддержка',
                    enrolledCourses: [],
                    testResults: [],
                    learningProgress: {},
                    lastLogin: null,
                    lastLogout: null
                }
            ],
            logs: []
        };
    },
    
    // Аутентификация пользователя
    async authenticate(username, password) {
        const user = this.data.users.find(u => u.username === username && u.password === password);
        
        if (user) {
            this.currentUser = user;
            // Сохраняем сессию в localStorage
            localStorage.setItem('ls_currentUser', JSON.stringify(user));
            await this.logAction('login', 'Вход в систему');
            return user;
        }
        return null;
    },
    
    // Выход пользователя
    async logout() {
        if (this.currentUser) {
            await this.logAction('logout', 'Выход из системы');
            this.currentUser = null;
            // Удаляем сессию из localStorage
            localStorage.removeItem('ls_currentUser');
        }
    },
    
    // Регистрация нового действия в логе
    async logAction(action, description) {
        if (!this.currentUser) return;
        
        const logEntry = {
            id: this.data.logs.length + 1,
            userId: this.currentUser.id,
            username: this.currentUser.username,
            action: action,
            description: description,
            timestamp: new Date().toISOString()
        };
        
        this.data.logs.unshift(logEntry);
        this.saveData();
        return logEntry;
    },
    
    // Обновление информации о пользователе
    updateUser(updatedData) {
        const index = this.data.users.findIndex(u => u.id === this.currentUser.id);
        if (index !== -1) {
            this.data.users[index] = { ...this.data.users[index], ...updatedData };
            this.currentUser = this.data.users[index];
            // Обновляем сессию в localStorage
            localStorage.setItem('ls_currentUser', JSON.stringify(this.currentUser));
            this.saveData();
        }
    },
    
    // Запись на курс
    async enrollCourse(courseId) {
        if (!this.currentUser) return false;
        
        const course = this.data.courses.find(c => c.id === courseId);
        if (!course) return false;
        
        if (!this.currentUser.enrolledCourses.includes(courseId)) {
            this.currentUser.enrolledCourses.push(courseId);
            await this.logAction('enroll', `Запись на курс: ${course.title}`);
            this.updateUser({ enrolledCourses: this.currentUser.enrolledCourses });
        }
        
        return true;
    },
    
    // Обновление прогресса изучения темы
    async updateTopicProgress(topicId, completed = true, timeSpent = 0) {
        if (!this.currentUser) return;
        
        const progress = this.currentUser.learningProgress[topicId] || { completed: false, startTime: null, endTime: null };
        progress.completed = completed;
        progress.startTime = progress.startTime || new Date().toISOString();
        progress.endTime = new Date().toISOString();
        progress.timeSpent = (progress.timeSpent || 0) + timeSpent;
        
        this.currentUser.learningProgress[topicId] = progress;
        await this.logAction('learning', `Изучение материала: ${this.getTopicTitle(topicId)}`);
        this.updateUser({ learningProgress: this.currentUser.learningProgress });
    },
    
    // Сохранение результата теста
    async saveTestResult(testId, score, correctAnswers, totalQuestions) {
        if (!this.currentUser) return;
        
        const test = this.data.tests.find(t => t.id === testId);
        const result = {
            testId: testId,
            testTitle: test ? test.title : '',
            score: score,
            correctAnswers: correctAnswers,
            totalQuestions: totalQuestions,
            percentage: Math.round((correctAnswers / totalQuestions) * 100),
            timestamp: new Date().toISOString()
        };
        
        // Проверка на дубликат
        const existingIndex = this.currentUser.testResults.findIndex(r => r.testId === testId);
        if (existingIndex !== -1) {
            this.currentUser.testResults[existingIndex] = result;
        } else {
            this.currentUser.testResults.push(result);
        }
        
        await this.logAction('test', `Прохождение теста: ${test.title}. Результат: ${correctAnswers}/${totalQuestions}`);
        this.updateUser({ testResults: this.currentUser.testResults });
        
        return result;
    },
    
    // Получение темы по ID
    getTopicTitle(topicId) {
        const topic = this.data.topics.find(t => t.id === topicId);
        return topic ? topic.title : 'Неизвестная тема';
    },
    
    // Получение текущего пользователя
    getCurrentUser() {
        return this.currentUser;
    },
    
    // Проверка роли пользователя
    hasRole(roles) {
        if (!this.currentUser) return false;
        return Array.isArray(roles) ? roles.includes(this.currentUser.role) : this.currentUser.role === roles;
    },
    
    // Получение всех пользователей (для админов)
    getAllUsers() {
        return this.data.users.map(u => ({
            id: u.id,
            username: u.username,
            role: u.role,
            roleName: u.roleName,
            lastLogin: u.lastLogin,
            lastLogout: u.lastLogout,
            enrolledCourses: u.enrolledCourses.length,
            testResults: u.testResults.length
        }));
    },
    
    // Получение журналов событий
    getLogs(filters = {}) {
        let logs = [...this.data.logs];
        
        if (filters.userId) {
            logs = logs.filter(l => l.userId === filters.userId);
        }
        
        if (filters.action) {
            logs = logs.filter(l => l.action === filters.action);
        }
        
        if (filters.from) {
            logs = logs.filter(l => new Date(l.timestamp) >= new Date(filters.from));
        }
        
        if (filters.to) {
            logs = logs.filter(l => new Date(l.timestamp) <= new Date(filters.to));
        }
        
        return logs;
    },
    
    // Получение курсов
    getCourses() {
        return this.data.courses;
    },
    
    // Получение темы
    getTopic(topicId) {
        return this.data.topics.find(t => t.id === topicId);
    },
    
    // Получение всех тем курса
    getCourseTopics(courseId) {
        const course = this.data.courses.find(c => c.id === courseId);
        if (!course) return [];
        return course.topics.map(topicId => this.getTopic(topicId));
    },
    
    // Получение теста
    getTest(testId) {
        return this.data.tests.find(t => t.id === testId);
    },
    
    // Получение статистики пользователя
    getStats() {
        if (!this.currentUser) return null;
        
        const totalTests = this.currentUser.testResults.length;
        const avgScore = totalTests > 0 
            ? Math.round(this.currentUser.testResults.reduce((sum, r) => sum + r.percentage, 0) / totalTests)
            : 0;
        
        const completedTopics = Object.values(this.currentUser.learningProgress).filter(p => p.completed).length;
        const totalTopics = this.data.topics.length;
        
        return {
            enrolledCourses: this.currentUser.enrolledCourses.length,
            completedCourses: this.currentUser.enrolledCourses.filter(id => {
                const course = this.data.courses.find(c => c.id === id);
                if (!course) return false;
                return course.topics.every(topicId => this.currentUser.learningProgress[topicId]?.completed);
            }).length,
            testsCompleted: totalTests,
            averageScore: avgScore,
            topicsCompleted: completedTopics,
            totalTopics: totalTopics
        };
    }
};
