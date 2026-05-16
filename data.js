/**
 * Модуль работы с данными
 * Имитация работы с JSON-базой данных через localStorage
 */

const DataManager = {
    data: null,
    currentUser: null,
    
    // Загрузка данных из JSON
    async loadData() {
        console.log('=== loadData called ===');
        console.log('Before loadData, this.currentUser:', this.currentUser);
        
        try {
            // Сначала проверяем, есть ли сохранённые данные в localStorage
            const storedData = localStorage.getItem('ls_data');
            const storedUser = localStorage.getItem('ls_currentUser');
            
            console.log('storedData exists:', !!storedData);
            console.log('storedUser exists:', !!storedUser);
            if (storedUser) {
                console.log('storedUser content:', JSON.parse(storedUser));
            }
            
            if (storedData) {
                console.log('Loading from localStorage...');
                const parsed = JSON.parse(storedData);
                this.data = parsed;
                console.log('Loaded users from localStorage:', this.data.users.map(u => ({username: u.username, enrolledCourses: u.enrolledCourses})));
                
                // Если есть сохранённая сессия, синхронизируем currentUser с загруженными данными
                if (storedUser) {
                    try {
                        const parsedUser = JSON.parse(storedUser);
                        console.log('Found stored user in localStorage:', parsedUser.username);
                        console.log('storedUser enrolledCourses:', parsedUser.enrolledCourses);
                        // Находим пользователя в загруженных данных и обновляем currentUser
                        const currentUserFromData = this.data.users.find(u => u.id === parsedUser.id);
                        if (currentUserFromData) {
                            console.log('currentUserFromData enrolledCourses:', currentUserFromData.enrolledCourses);
                            // Объединяем данные: приоритет у данных из ls_currentUser (они актуальнее)
                            this.currentUser = { ...currentUserFromData, ...parsedUser };
                            console.log('Synced currentUser:', this.currentUser.username);
                            console.log('Final enrolledCourses:', this.currentUser.enrolledCourses);
                        }
                    } catch (e) {
                        console.error('Error parsing stored user:', e);
                    }
                }
            } else {
                console.log('No localStorage data, loading from data.json...');
                const response = await fetch('data.json');
                this.data = await response.json();
                console.log('Loaded users from data.json:', this.data.users.map(u => u.username));
            }
            
            console.log('=== loadData completed ===');
            console.log('After loadData, this.currentUser:', this.currentUser ? this.currentUser.username : 'null');
            if (this.currentUser) {
                console.log('currentUser enrolledCourses:', this.currentUser.enrolledCourses);
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
        const dataToSave = {
            users: this.data.users,
            courses: this.data.courses,
            topics: this.data.topics,
            tests: this.data.tests,
            logs: this.data.logs,
            settings: this.data.settings
        };
        console.log('saveData: saving data with users:', dataToSave.users.map(u => ({username: u.username, enrolledCourses: u.enrolledCourses})));
        localStorage.setItem('ls_data', JSON.stringify(dataToSave));
        console.log('saveData: data saved to localStorage');
        
        // Проверка: читаем обратно и выводим
        const saved = localStorage.getItem('ls_data');
        if (saved) {
            const parsed = JSON.parse(saved);
            console.log('saveData: verified saved data, users:', parsed.users.map(u => ({username: u.username, enrolledCourses: u.enrolledCourses})));
        }
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
        // Полностью сбрасываем текущую сессию перед новой аутентификацией
        console.log('authenticate: resetting session');
        this.currentUser = null;
        localStorage.removeItem('ls_currentUser');
        
        console.log('authenticate called with username:', username);
        
        const user = this.data.users.find(u => u.username === username && u.password === password);
        console.log('Found user:', user ? user.username : null);
        
        if (user) {
            // Делаем глубокую копию пользователя из текущих данных
            this.currentUser = JSON.parse(JSON.stringify(user));
            console.log('currentUser set to:', this.currentUser.username, 'Role:', this.currentUser.role);
            console.log('currentUser before save:', this.currentUser);
            
            // Сохраняем сессию в localStorage
            localStorage.setItem('ls_currentUser', JSON.stringify(this.currentUser));
            console.log('Session saved to localStorage');
            console.log('ls_currentUser after save:', JSON.parse(localStorage.getItem('ls_currentUser')));
            
            await this.logAction('login', 'Вход в систему');
            return this.currentUser;
        }
        return null;
    },
    
    // Выход пользователя
    async logout() {
        if (this.currentUser) {
            console.log('logout: currentUser =', this.currentUser.username);
            await this.logAction('logout', 'Выход из системы');
        }
        this.currentUser = null;
        // Удаляем сессию из localStorage
        localStorage.removeItem('ls_currentUser');
        console.log('logout: session cleared');
    },
    
    // Регистрация нового действия в логе
    async logAction(action, description) {
        if (!this.currentUser) {
            console.error('logAction: currentUser is null!');
            return;
        }
        
        console.log('logAction: currentUser.id =', this.currentUser.id, 'username =', this.currentUser.username);
        
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
        if (!this.currentUser) {
            console.error('updateUser: currentUser is null!');
            return;
        }
        
        console.log('updateUser called for user:', this.currentUser.username, 'updating:', updatedData);
        console.log('Before update, currentUser.enrolledCourses:', this.currentUser.enrolledCourses);
        
        const index = this.data.users.findIndex(u => u.id === this.currentUser.id);
        if (index !== -1) {
            this.data.users[index] = { ...this.data.users[index], ...updatedData };
            this.currentUser = { ...this.currentUser, ...updatedData };
            // Обновляем сессию в localStorage
            localStorage.setItem('ls_currentUser', JSON.stringify(this.currentUser));
            console.log('After updateUser, currentUser.enrolledCourses:', this.currentUser.enrolledCourses);
            console.log('Saved ls_currentUser:', JSON.parse(localStorage.getItem('ls_currentUser')));
            this.saveData();
            console.log('updateUser completed, currentUser:', this.currentUser);
        } else {
            console.error('updateUser: user not found in data!');
        }
    },
    
    // Запись на курс
    async enrollCourse(courseId) {
        if (!this.currentUser) {
            console.error('enrollCourse: currentUser is null!');
            return false;
        }
        
        console.log('enrollCourse called for user:', this.currentUser.username, 'courseId:', courseId);
        console.log('Current enrolledCourses:', this.currentUser.enrolledCourses);
        
        const course = this.data.courses.find(c => c.id === courseId);
        if (!course) {
            console.error('enrollCourse: course not found!');
            return false;
        }
        
        if (!this.currentUser.enrolledCourses.includes(courseId)) {
            this.currentUser.enrolledCourses.push(courseId);
            console.log('Added course to enrolledCourses:', this.currentUser.enrolledCourses);
            await this.logAction('enroll', `Запись на курс: ${course.title}`);
            this.updateUser({ enrolledCourses: this.currentUser.enrolledCourses });
            return true;
        }
        
        console.log('User already enrolled in this course');
        return true; // Уже записан
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
