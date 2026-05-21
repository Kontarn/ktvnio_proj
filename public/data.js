/**
 * Модуль работы с данными через API
 * Работа с Node.js + SQLite бэкендом
 */

const DataManager = {
    currentUser: null,
    
    // Инициализация - проверка сессии через sessionStorage
    async init() {
        // Проверяем сессию из sessionStorage (изолирован по вкладкам!)
        const storedUser = sessionStorage.getItem('current_user');
        
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                
                // Проверяем, что пользователь ещё в системе через API
                const response = await fetch(`/api/user/${parsedUser.id}`, {
                    credentials: 'include'
                });
                
                if (response.ok) {
                    const user = await response.json();
                    this.currentUser = user;
                    console.log('Session restored for user:', user.username, '(tab isolated)');
                } else {
                    // Сессия истекла - очищаем
                    sessionStorage.removeItem('current_user');
                    this.currentUser = null;
                    console.log('Session expired, cleared');
                }
            } catch (error) {
                console.error('Error restoring session:', error);
                sessionStorage.removeItem('current_user');
                this.currentUser = null;
            }
        } else {
            console.log('No session in sessionStorage');
        }
    },
    
    // API вызовы
    async fetchUser(userId) {
        try {
            const response = await fetch(`/api/user/${userId}`, {
                credentials: 'same-origin'
            });
            if (response.ok) {
                const user = await response.json();
                // Обновляем currentUser
                this.currentUser = user;
                return user;
            }
            return null;
        } catch (error) {
            console.error('Error fetching user:', error);
            return null;
        }
    },
    
    // Аутентификация
    async authenticate(username, password) {
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username, password })
            });
            
            if (!response.ok) {
                const error = await response.json();
                return null;
            }
            
            const user = await response.json();
            
            // Сохраняем в sessionStorage (ИЗОЛИРОВАНО ПО ВКЛАДКАМ!)
            this.currentUser = user;
            sessionStorage.setItem('current_user', JSON.stringify(user));
            
            console.log('Login successful for user:', user.username, '(saved to sessionStorage)');
            
            // Логируем вход
            await this.logAction(user.id, user.username, 'login', 'Вход в систему');
            
            return user;
        } catch (error) {
            console.error('Login error:', error);
            return null;
        }
    },

    // Выход
    async logout() {
        if (this.currentUser) {
            try {
                await fetch('/api/logout', {
                    method: 'POST',
                    credentials: 'include'
                });
                
                await this.logAction(this.currentUser.id, this.currentUser.username, 'logout', 'Выход из системы');
            } catch (error) {
                console.error('Logout error:', error);
            }
            
            // Очищаем sessionStorage ТОЛЬКО для этой вкладки
            sessionStorage.removeItem('current_user');
            this.currentUser = null;
            console.log('Logged out (sessionStorage cleared for this tab)');
        }
    },
    
    // Обновление пользователя
    async updateUser(updatedData) {
        if (!this.currentUser) {
            return null;
        }
        
        try {
            const response = await fetch(`/api/user/${this.currentUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(updatedData)
            });
            
            if (!response.ok) {
                return null;
            }
            
            const user = await response.json();
            this.currentUser = user;
            // Обновляем sessionStorage
            sessionStorage.setItem('current_user', JSON.stringify(user));
            
            return user;
        } catch (error) {
            console.error('Update user error:', error);
            return null;
        }
    },
    
    // API вызовы
    async fetchUser(userId) {
        try {
            const response = await fetch(`/api/user/${userId}`, {
                credentials: 'include'
            });
            if (response.ok) {
                const user = await response.json();
                // Обновляем currentUser и sessionStorage
                this.currentUser = user;
                sessionStorage.setItem('current_user', JSON.stringify(user));
                return user;
            }
            return null;
        } catch (error) {
            console.error('Error fetching user:', error);
            return null;
        }
    },
    
    // Логирование действий
    async logAction(userId, username, action, description) {
        try {
            await fetch('/api/logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ userId, username, action, description })
            });
        } catch (error) {
            console.error('Log action error:', error);
        }
    },
    
    // Получение всех пользователей
    async getAllUsers() {
        try {
            const response = await fetch('/api/users', {
                credentials: 'include'
            });
            if (response.ok) {
                const users = await response.json();
                return users;
            }
            return [];
        } catch (error) {
            console.error('Error fetching users:', error);
            return [];
        }
    },
    
    // Получение курсов
    getCourses() {
        return [
            {
                id: 1,
                title: 'Решение квадратных уравнений',
                description: 'Полный курс по решению квадратных уравнений в общем виде. Изучите теорию, формулы и методы решения.',
                instructor: 'Преподаватель математики',
                duration: '2 часа',
                testId: 1
            }
        ];
    },
    
    // Получение тем курса
    async getCourseTopics(courseId) {
        return [
            { id: 1, courseId: 1, orderNum: 1, title: 'Введение в квадратные уравнения', content: '<h3>Что такое квадратное уравнение?</h3><p>ax² + bx + c = 0</p>' },
            { id: 2, courseId: 1, orderNum: 2, title: 'Дискриминант', content: '<h3>Формула дискриминанта</h3><p>D = b² - 4ac</p>' },
            { id: 3, courseId: 1, orderNum: 3, title: 'Формулы корней', content: '<h3>Формула корней</h3><p>x₁,₂ = (-b ± √D) / 2a</p>' },
            { id: 4, courseId: 1, orderNum: 4, title: 'Теорема Виета', content: '<h3>Теорема Виета</h3><p>x₁ + x₂ = -p, x₁ · x₂ = q</p>' },
            { id: 5, courseId: 1, orderNum: 5, title: 'Практика', content: '<h3>Практические задания</h3>' }
        ];
    },
    
    // Парсинг enrolledCourses из строки в массив
    parseEnrolledCourses(data) {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (typeof data === 'string') {
            try {
                const parsed = JSON.parse(data);
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                return [];
            }
        }
        return [];
    },
    
    // Получение теста
    async getTest(courseId) {
        return {
            id: 1,
            courseId: 1,
            duration: 60,
            questions: [
                {
                    question: 'Какого вида квадратное уравнение?',
                    options: ['ax + b = 0', 'ax² + bx + c = 0', 'ax³ + bx² + cx + d = 0', 'a/x + b = 0'],
                    correct: 1
                },
                {
                    question: 'Формула дискриминанта:',
                    options: ['D = b² + 4ac', 'D = b² - 4ac', 'D = 2b - a', 'D = √b² - 4ac'],
                    correct: 1
                },
                {
                    question: 'Если D > 0, то уравнение имеет:',
                    options: ['Один корень', 'Два различных корня', 'Нет корней', 'Бесконечно много корней'],
                    correct: 1
                },
                {
                    question: 'Сколько корней у уравнения x² - 4x + 4 = 0?',
                    options: ['0', '1', '2', '3'],
                    correct: 1
                },
                {
                    question: 'Корни уравнения x² - 5x + 6 = 0:',
                    options: ['x₁=2, x₂=3', 'x₁=1, x₂=6', 'x₁=-2, x₂=-3', 'x₁=5, x₂=6'],
                    correct: 0
                },
                {
                    question: 'Что такое приведённое квадратное уравнение?',
                    options: ['a = 0', 'a = 1', 'b = 0', 'c = 0'],
                    correct: 1
                },
                {
                    question: 'По теореме Виета: x₁ + x₂ =',
                    options: ['-p', 'p', 'q', '-q'],
                    correct: 0
                },
                {
                    question: 'По теореме Виета: x₁ · x₂ =',
                    options: ['-p', 'p', '-q', 'q'],
                    correct: 3
                },
                {
                    question: 'Если D = 0, то:',
                    options: ['Два различных корня', 'Один корень (два совпадающих)', 'Нет корней', 'Три корня'],
                    correct: 1
                },
                {
                    question: 'Коэффициент a в уравнении 3x² + 2x - 1 = 0 равен:',
                    options: ['3', '2', '-1', '0'],
                    correct: 0
                }
            ]
        };
    },
    
    // Запись на курс
    async enrollCourse(courseId) {
        if (!this.currentUser) return false;
        const enrolledCourses = this.parseEnrolledCourses(this.currentUser.enrolledCourses);
        if (!enrolledCourses.includes(courseId)) {
            enrolledCourses.push(courseId);
            const user = await this.updateUser({ enrolledCourses });
            return !!user;
        }
        return true;
    },
    
    // Сохранение результата теста
    async saveTestResult(testId, score, correctAnswers, totalQuestions) {
        if (!this.currentUser) return;
        const freshUser = await this.fetchUser(this.currentUser.id);
        if (!freshUser) return;
        const testResults = this.parseTestResults(freshUser.testResults);
        testResults.push({
            testId,
            testTitle: 'Квадратные уравнения',
            score,
            correctAnswers,
            totalQuestions,
            percentage: Math.round((correctAnswers / totalQuestions) * 100),
            timestamp: new Date().toISOString()
        });
        await this.updateUser({ testResults });
        await this.logAction(this.currentUser.id, this.currentUser.username, 'test', `Прохождение теста: ${testId}`);
    },
    
    // Получение логов
    async getLogs(filters = {}) {
        try {
            const params = new URLSearchParams();
            if (filters.userId) params.append('userId', filters.userId);
            if (filters.action) params.append('action', filters.action);
            const response = await fetch(`/api/logs?${params}`, { credentials: 'include' });
            if (response.ok) {
                return await response.json();
            }
            return [];
        } catch (error) {
            console.error('Error fetching logs:', error);
            return [];
        }
    },
    
    // Получение статистики
    async getStats() {
        if (!this.currentUser) {
            return { enrolledCourses: 0, testsCompleted: 0, averageScore: 0 };
        }
        try {
            const response = await fetch(`/api/user/${this.currentUser.id}/stats`, { credentials: 'include' });
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
        const enrolledCourses = this.parseEnrolledCourses(this.currentUser.enrolledCourses);
        const testResults = this.parseTestResults(this.currentUser.testResults);
        return {
            enrolledCourses: enrolledCourses.length,
            testsCompleted: testResults.length,
            averageScore: this.calculateAverageScore(testResults)
        };
    },
    
    // Парсинг testResults из строки
    parseTestResults(data) {
        if (!data) return [];
        if (Array.isArray(data)) return data.filter(r => r && r.testId && r.timestamp);
        if (typeof data === 'string') {
            try {
                const parsed = JSON.parse(data);
                return Array.isArray(parsed) ? parsed.filter(r => r && r.testId && r.timestamp) : [];
            } catch (e) {
                return [];
            }
        }
        return [];
    },
    
    // Парсинг learningProgress из строки
    parseLearningProgress(data) {
        if (!data) return {};
        if (typeof data === 'object' && !Array.isArray(data)) return data;
        if (typeof data === 'string') {
            try {
                const parsed = JSON.parse(data);
                return typeof parsed === 'object' && parsed !== null ? parsed : {};
            } catch (e) {
                return {};
            }
        }
        return {};
    },
    
    calculateAverageScore(testResults) {
        if (!testResults || testResults.length === 0) return 0;
        return Math.round(testResults.reduce((sum, r) => sum + r.percentage, 0) / testResults.length);
    },
    
    // Получение текущего пользователя
    getCurrentUser() {
        return this.currentUser;
    },
    
    // Проверка роли
    hasRole(roles) {
        if (!this.currentUser) return false;
        const roleArray = Array.isArray(roles) ? roles : [roles];
        return roleArray.includes(this.currentUser.role);
    }
};
    
