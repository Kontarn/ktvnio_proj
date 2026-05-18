/**
 * Модуль работы с данными через API
 * Работа с Node.js + SQLite бэкендом
 */

const DataManager = {
    currentUser: null,
    
    // Инициализация - проверка сессии
    async init() {
        // Проверка сессии при загрузке
        const storedUser = localStorage.getItem('ls_currentUser');
        
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                
                // Проверяем, что пользователь ещё в системе
                const response = await fetch(`/api/user/${parsedUser.id}`);
                if (response.ok) {
                    const user = await response.json();
                    this.currentUser = user;
                    console.log('Session restored for user:', user.username);
                }
            } catch (error) {
                console.error('Error restoring session:', error);
                localStorage.removeItem('ls_currentUser');
            }
        }
    },
    
    // API вызовы
    async fetchUser(userId) {
        try {
            const response = await fetch(`/api/user/${userId}`);
            if (response.ok) {
                const user = await response.json();
                // Обновляем currentUser
                this.currentUser = user;
                localStorage.setItem('ls_currentUser', JSON.stringify(user));
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
                body: JSON.stringify({ username, password })
            });
            
            if (!response.ok) {
                const error = await response.json();
                return null;
            }
            
            const user = await response.json();
            
            // Сохраняем пользователя в localStorage (без пароля)
            this.currentUser = user;
            localStorage.setItem('ls_currentUser', JSON.stringify(user));
            
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
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: this.currentUser.id })
                });
                
                await this.logAction(this.currentUser.id, this.currentUser.username, 'logout', 'Выход из системы');
            } catch (error) {
                console.error('Logout error:', error);
            }
            
            this.currentUser = null;
            localStorage.removeItem('ls_currentUser');
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
                body: JSON.stringify(updatedData)
            });
            
            if (!response.ok) {
                return null;
            }
            
            const user = await response.json();
            this.currentUser = user;
            localStorage.setItem('ls_currentUser', JSON.stringify(user));
            
            return user;
        } catch (error) {
            console.error('Update user error:', error);
            return null;
        }
    },
    
    // Логирование действий
    async logAction(userId, username, action, description) {
        try {
            await fetch('/api/logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, username, action, description })
            });
        } catch (error) {
            console.error('Log action error:', error);
        }
    },
    
    // Получение всех пользователей
    async getAllUsers() {
        try {
            const response = await fetch('/api/users');
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
        // Возвращаем тестовые данные для демонстрации
        return [
            {
                id: 1,
                courseId: 1,
                orderNum: 1,
                title: 'Введение в квадратные уравнения',
                content: `
                    <h3>Что такое квадратное уравнение?</h3>
                    <p><strong>Квадратное уравнение</strong> — это уравнение вида <strong>ax² + bx + c = 0</strong>, где a ≠ 0.</p>
                    
                    <h4>Коэффициенты квадратного уравнения:</h4>
                    <ul>
                        <li><strong>a</strong> — старший коэффициент (коэффициент при x²)</li>
                        <li><strong>b</strong> — средний коэффициент (коэффициент при x)</li>
                        <li><strong>c</strong> — свободный член (число без переменной)</li>
                    </ul>
                    
                    <h4>Примеры квадратных уравнений:</h4>
                    <table border="1" cellpadding="5" style="border-collapse: collapse; margin: 10px 0;">
                        <tr><th>Уравнение</th><th>a</th><th>b</th><th>c</th></tr>
                        <tr><td>x² - 5x + 6 = 0</td><td>1</td><td>-5</td><td>6</td></tr>
                        <tr><td>2x² + 7x - 4 = 0</td><td>2</td><td>7</td><td>-4</td></tr>
                        <tr><td>3x² - 12 = 0</td><td>3</td><td>0</td><td>-12</td></tr>
                    </table>
                    
                    <h4>Виды квадратных уравнений:</h4>
                    <p><strong>Приведённое</strong> — уравнение, где a = 1:</p>
                    <p>x² + px + q = 0</p>
                    
                    <p><strong>Неприведённое</strong> — уравнение, где a ≠ 1:</p>
                    <p>2x² + 3x - 5 = 0</p>
                    
                    <p><strong>Неполное</strong> — уравнение, где b = 0 или c = 0:</p>
                    <p>ax² + c = 0 или ax² + bx = 0</p>
                `
            },
            {
                id: 2,
                courseId: 1,
                orderNum: 2,
                title: 'Дискриминант',
                content: `
                    <h3>Формула дискриминанта</h3>
                    <p><strong>Дискриминант</strong> (обозначается D) — это величина, которая определяет количество корней квадратного уравнения.</p>
                    
                    <h4>Формула дискриминанта:</h4>
                    <p style="font-size: 18px; font-weight: bold; text-align: center; background: #f0f0f0; padding: 10px; border-radius: 5px;">
                        D = b² - 4ac
                    </p>
                    
                    <h4>Возможные случаи:</h4>
                    
                    <h5>1. D > 0 (дискриминант положителен)</h5>
                    <p>Уравнение имеет <strong>два различных действительных корня</strong>:</p>
                    <p>x₁ = (-b + √D) / 2a,  x₂ = (-b - √D) / 2a</p>
                    
                    <h5>2. D = 0 (дискриминант равен нулю)</h5>
                    <p>Уравнение имеет <strong>один действительный корень</strong> (два совпадающих):</p>
                    <p>x = -b / 2a</p>
                    
                    <h5>3. D < 0 (дискриминант отрицателен)</h5>
                    <p>Уравнение <strong>не имеет действительных корней</strong> (корни существуют только в комплексных числах).</p>
                    
                    <h4>Пример вычисления дискриминанта:</h4>
                    <p>Решим уравнение: 2x² + 5x - 3 = 0</p>
                    <ul>
                        <li>a = 2, b = 5, c = -3</li>
                        <li>D = 5² - 4·2·(-3) = 25 + 24 = 49</li>
                        <li>D > 0, значит уравнение имеет два корня</li>
                    </ul>
                `
            },
            {
                id: 3,
                courseId: 1,
                orderNum: 3,
                title: 'Формулы корней',
                content: `
                    <h3>Нахождение корней квадратного уравнения</h3>
                    
                    <h4>Общая формула корней:</h4>
                    <p style="font-size: 18px; text-align: center; background: #f0f0f0; padding: 10px; border-radius: 5px;">
                        x₁,₂ = (-b ± √D) / 2a
                    </p>
                    
                    <h4>Подробный алгоритм решения:</h4>
                    <ol>
                        <li>Определить коэффициенты a, b, c</li>
                        <li>Вычислить дискриминант: D = b² - 4ac</li>
                        <li>Определить количество корней по знаку D</li>
                        <li>Если D ≥ 0, вычислить корни по формуле</li>
                    </ol>
                    
                    <h4>Пример 1: D > 0</h4>
                    <p>Решим уравнение: x² - 5x + 6 = 0</p>
                    <ul>
                        <li>a = 1, b = -5, c = 6</li>
                        <li>D = (-5)² - 4·1·6 = 25 - 24 = 1</li>
                        <li>x₁ = (5 + 1) / 2 = 3</li>
                        <li>x₂ = (5 - 1) / 2 = 2</li>
                        <li><strong>Ответ: x₁ = 3, x₂ = 2</strong></li>
                    </ul>
                    
                    <h4>Пример 2: D = 0</h4>
                    <p>Решим уравнение: x² - 4x + 4 = 0</p>
                    <ul>
                        <li>a = 1, b = -4, c = 4</li>
                        <li>D = (-4)² - 4·1·4 = 16 - 16 = 0</li>
                        <li>x = 4 / 2 = 2</li>
                        <li><strong>Ответ: x = 2</strong></li>
                    </ul>
                    
                    <h4>Пример 3: D < 0</h4>
                    <p>Решим уравнение: x² + x + 1 = 0</p>
                    <ul>
                        <li>a = 1, b = 1, c = 1</li>
                        <li>D = 1² - 4·1·1 = 1 - 4 = -3</li>
                        <li><strong>Ответ: действительных корней нет</strong></li>
                    </ul>
                `
            },
            {
                id: 4,
                courseId: 1,
                orderNum: 4,
                title: 'Теорема Виета',
                content: `
                    <h3>Теорема Виета</h3>
                    <p><strong>Теорема Виета</strong> связывает корни приведённого квадратного уравнения с его коэффициентами.</p>
                    
                    <h4>Формулировка теоремы:</h4>
                    <p>Для приведённого квадратного уравнения <strong>x² + px + q = 0</strong>:</p>
                    <ul>
                        <li><strong>x₁ + x₂ = -p</strong> (сумма корней равна второму коэффициенту, взятому с противоположным знаком)</li>
                        <li><strong>x₁ · x₂ = q</strong> (произведение корней равно свободному члену)</li>
                    </ul>
                    
                    <h4>Пример применения:</h4>
                    <p>Дано уравнение: x² - 7x + 10 = 0</p>
                    <p>По теореме Виета:</p>
                    <ul>
                        <li>x₁ + x₂ = 7</li>
                        <li>x₁ · x₂ = 10</li>
                    </ul>
                    <p>Подбираем числа: x₁ = 2, x₂ = 5</p>
                    <p><strong>Ответ: x₁ = 2, x₂ = 5</strong></p>
                    
                    <h4>Обратная теорема Виета:</h4>
                    <p>Если числа x₁ и x₂ таковы, что x₁ + x₂ = -p и x₁ · x₂ = q, то они являются корнями уравнения x² + px + q = 0.</p>
                    
                    <h4>Разложение на множители:</h4>
                    <p>Если x₁ и x₂ — корни квадратного уравнения ax² + bx + c = 0, то:</p>
                    <p style="font-size: 16px; text-align: center; background: #f0f0f0; padding: 10px; border-radius: 5px;">
                        ax² + bx + c = a(x - x₁)(x - x₂)
                    </p>
                `
            },
            {
                id: 5,
                courseId: 1,
                orderNum: 5,
                title: 'Практика',
                content: `
                    <h3>Практические задания</h3>
                    <p>Решите следующие квадратные уравнения:</p>
                    
                    <h4>Уровень 1 (базовый):</h4>
                    <ol>
                        <li>x² - 5x + 6 = 0</li>
                        <li>x² - 7x + 12 = 0</li>
                        <li>x² + 3x - 10 = 0</li>
                    </ol>
                    
                    <h4>Уровень 2 (средний):</h4>
                    <ol>
                        <li>2x² + 7x - 4 = 0</li>
                        <li>3x² - 10x + 3 = 0</li>
                        <li>5x² - 8x + 3 = 0</li>
                    </ol>
                    
                    <h4>Уровень 3 (продвинутый):</h4>
                    <ol>
                        <li>x² - 4x + 4 = 0</li>
                        <li>x² + 6x + 9 = 0</li>
                        <li>4x² - 12x + 9 = 0</li>
                    </ol>
                    
                    <h4>Проверка ответов:</h4>
                    <details>
                        <summary>Нажмите, чтобы посмотреть ответы</summary>
                        <ul>
                            <li>Уровень 1: 1) x₁=2, x₂=3; 2) x₁=3, x₂=4; 3) x₁=-5, x₂=2</li>
                            <li>Уровень 2: 1) x₁=0.5, x₂=-4; 2) x₁=3, x₂=1/3; 3) x₁=1, x₂=0.6</li>
                            <li>Уровень 3: 1) x=2; 2) x=-3; 3) x=1.5</li>
                        </ul>
                    </details>
                    
                    <h4>Советы по решению:</h4>
                    <ul>
                        <li>Всегда сначала вычисляйте дискриминант</li>
                        <li>Для приведённых уравнений попробуйте теорему Виета</li>
                        <li>Проверяйте ответы подстановкой в исходное уравнение</li>
                    </ul>
                `
            }
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
        
        // Парсим enrolledCourses из строки
        const enrolledCourses = this.parseEnrolledCourses(this.currentUser.enrolledCourses);
        
        if (!enrolledCourses.includes(courseId)) {
            enrolledCourses.push(courseId);
            
            const user = await this.updateUser({ enrolledCourses });
            return !!user;
        }
        
        return true; // Уже записан
    },
    
    // Обновление прогресса темы
    async updateTopicProgress(topicId, completed = true, timeSpent = 0) {
        if (!this.currentUser) return;
        
        const learningProgress = this.parseLearningProgress(this.currentUser.learningProgress);
        learningProgress[topicId] = {
            completed,
            timeSpent,
            lastAccessed: new Date().toISOString()
        };
        
        await this.updateUser({ learningProgress });
        await this.logAction(this.currentUser.id, this.currentUser.username, 'learning', `Изучение темы: ${topicId}`);
    },
    
    // Сохранение результата теста
    async saveTestResult(testId, score, correctAnswers, totalQuestions) {
        if (!this.currentUser) return;
        
        const testResults = [...(this.currentUser.testResults || [])];
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
            
            const response = await fetch(`/api/logs?${params}`);
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
            const response = await fetch(`/api/user/${this.currentUser.id}/stats`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
        
        // Фолбэк на локальные данные
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
        if (Array.isArray(data)) {
            // Фильтруем только валидные записи
            return data.filter(r => 
                r && 
                typeof r === 'object' && 
                r.testId && 
                r.testTitle && 
                typeof r.correctAnswers === 'number' && 
                typeof r.totalQuestions === 'number' && 
                typeof r.percentage === 'number' && 
                r.timestamp
            );
        }
        if (typeof data === 'string') {
            try {
                const parsed = JSON.parse(data);
                if (Array.isArray(parsed)) {
                    // Фильтруем только валидные записи
                    return parsed.filter(r => 
                        r && 
                        typeof r === 'object' && 
                        r.testId && 
                        r.testTitle && 
                        typeof r.correctAnswers === 'number' && 
                        typeof r.totalQuestions === 'number' && 
                        typeof r.percentage === 'number' && 
                        r.timestamp
                    );
                }
                return [];
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
