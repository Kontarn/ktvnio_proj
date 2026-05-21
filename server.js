const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
  exposedHeaders: ['Set-Cookie']
}));
app.use(express.json());
app.use(express.static('public'));
app.use(cookieParser());

// Инициализация базы данных
const db = new Database('school.db');
db.pragma('journal_mode = WAL');

// Создание таблиц
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    roleName TEXT NOT NULL,
    enrolledCourses TEXT DEFAULT '[]',
    testResults TEXT DEFAULT '[]',
    learningProgress TEXT DEFAULT '{}',
    lastLogin TEXT,
    lastLogout TEXT,
    session_id TEXT
  );

  CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    instructor TEXT,
    duration TEXT,
    testId INTEGER
  );

  CREATE TABLE IF NOT EXISTS topics (
    id INTEGER PRIMARY KEY,
    courseId INTEGER NOT NULL,
    orderNum INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    FOREIGN KEY (courseId) REFERENCES courses(id)
  );

  CREATE TABLE IF NOT EXISTS tests (
    id INTEGER PRIMARY KEY,
    courseId INTEGER NOT NULL,
    questions TEXT NOT NULL,
    duration INTEGER DEFAULT 60,
    FOREIGN KEY (courseId) REFERENCES courses(id)
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    username TEXT NOT NULL,
    action TEXT NOT NULL,
    description TEXT,
    timestamp TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id)
  );
`);

// Инициализация данных (если пустая БД)
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (userCount.count === 0) {
  console.log('Инициализация пользователей...');
  
  // Хэширование паролей
  const hash1 = bcrypt.hashSync('listener123', 10);
  const hash2 = bcrypt.hashSync('teacher123', 10);
  const hash3 = bcrypt.hashSync('developer123', 10);
  const hash4 = bcrypt.hashSync('support123', 10);
  
  db.prepare(`
    INSERT INTO users (id, username, password, role, roleName, enrolledCourses, testResults, learningProgress)
    VALUES (1, 'listener', ?, 'listener', 'Слушатель', '[]', '[]', '{}')
  `).run(hash1);
  
  db.prepare(`
    INSERT INTO users (id, username, password, role, roleName, enrolledCourses, testResults, learningProgress)
    VALUES (2, 'teacher', ?, 'teacher', 'Преподаватель', '[1]', '[]', '{}')
  `).run(hash2);
  
  db.prepare(`
    INSERT INTO users (id, username, password, role, roleName, enrolledCourses, testResults, learningProgress)
    VALUES (3, 'developer', ?, 'developer', 'Разработчик', '[]', '[]', '{}')
  `).run(hash3);
  
  db.prepare(`
    INSERT INTO users (id, username, password, role, roleName, enrolledCourses, testResults, learningProgress)
    VALUES (4, 'support', ?, 'support', 'Техническая поддержка', '[]', '[]', '{}')
  `).run(hash4);
  
  console.log('Пользователи созданы');
}

// Курсов пока нет, добавим если нужно
const courseCount = db.prepare('SELECT COUNT(*) as count FROM courses').get();
if (courseCount.count === 0) {
  console.log('Инициализация курсов...');
  
  // Добавляем курс
  db.prepare(`
    INSERT INTO courses (id, title, description, instructor, duration, testId)
    VALUES (1, 'Решение квадратных уравнений', 'Полный курс по решению квадратных уравнений в общем виде. Изучите теорию, формулы и методы решения.', 'Преподаватель математики', '2 часа', 1)
  `).run();
  
  // Добавляем темы курса
  db.prepare(`
    INSERT INTO topics (id, courseId, orderNum, title, content)
    VALUES 
    (1, 1, 1, 'Введение в квадратные уравнения', '<h3>Что такое квадратное уравнение?</h3><p><strong>Квадратное уравнение</strong> — это уравнение вида <strong>ax² + bx + c = 0</strong>, где a ≠ 0.</p>'),
    (2, 1, 2, 'Дискриминант', '<h3>Формула дискриминанта</h3><p><strong>Дискриминант</strong> (обозначается D) — это величина, которая определяет количество корней квадратного уравнения.</p><p style="font-size: 18px; font-weight: bold; text-align: center; background: #f0f0f0; padding: 10px; border-radius: 5px;">D = b² - 4ac</p>'),
    (3, 1, 3, 'Формулы корней', '<h3>Нахождение корней квадратного уравнения</h3><p style="font-size: 18px; text-align: center; background: #f0f0f0; padding: 10px; border-radius: 5px;">x₁,₂ = (-b ± √D) / 2a</p>'),
    (4, 1, 4, 'Теорема Виета', '<h3>Теорема Виета</h3><p>Для приведённого квадратного уравнения <strong>x² + px + q = 0</strong>: x₁ + x₂ = -p, x₁ · x₂ = q</p>'),
    (5, 1, 5, 'Практика', '<h3>Практические задания</h3><p>Решите следующие квадратные уравнения:</p><ol><li>x² - 5x + 6 = 0</li><li>x² - 7x + 12 = 0</li><li>2x² + 7x - 4 = 0</li></ol>')
  `).run();
  
  // Добавляем тест
  db.prepare(`
    INSERT INTO tests (id, courseId, duration)
    VALUES (1, 1, 60)
  `).run();
  
  // Привязываем курс к преподавателю
  db.prepare(`
    UPDATE users SET enrolledCourses = '[1]' WHERE role = 'teacher'
  `).run();
  
  console.log('Курс, темы и тест созданы');
  
  // Привязываем курс к преподавателю
  const teacher = db.prepare('SELECT * FROM users WHERE role = ?').get('teacher');
  if (teacher) {
    db.prepare('UPDATE users SET enrolledCourses = ? WHERE id = ?')
      .run(JSON.stringify([1]), teacher.id);
    console.log('Курс привязан к преподавателю');
  }
}
  
// Привязываем курсы к преподавателю (выполняется всегда)
const courses = db.prepare('SELECT id FROM courses').all();
const teacher = db.prepare('SELECT * FROM users WHERE role = ?').get('teacher');
if (teacher && courses.length > 0) {
  const teacherCourses = JSON.parse(teacher.enrolledCourses || '[]');
  if (!Array.isArray(teacherCourses) || teacherCourses.length === 0) {
    const courseIds = courses.map(c => c.id);
    db.prepare('UPDATE users SET enrolledCourses = ? WHERE id = ?')
      .run(JSON.stringify(courseIds), teacher.id);
    console.log('Курсы привязаны к преподавателю');
  }
}
  
// ==================== API ROUTES ====================

// Аутентификация
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  
  if (!user) {
    return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
  }
  
  const validPassword = bcrypt.compareSync(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
  }
  
  // Обновляем lastLogin
  db.prepare('UPDATE users SET lastLogin = ? WHERE id = ?')
    .run(new Date().toISOString(), user.id);
  
  // Устанавливаем session_id в cookie (HTTP-only для безопасности)
  const sessionId = `sess_${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  res.cookie('session_id', sessionId, {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 часа
    sameSite: 'lax'
  });
  
  // Сохраняем session_id в БД для отслеживания
  db.prepare('UPDATE users SET session_id = ? WHERE id = ?')
    .run(sessionId, user.id);
  
  // Возвращаем пользователя без пароля
  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

app.post('/api/logout', (req, res) => {
  const sessionId = req.cookies?.session_id;
  
  if (sessionId) {
    // Очищаем session_id в БД
    db.prepare('UPDATE users SET session_id = NULL WHERE session_id = ?')
      .run(sessionId);
  }
  
  // Очищаем cookie
  res.clearCookie('session_id');
  
  res.json({ success: true });
});

// Получение текущего пользователя из сессии
app.get('/api/session', (req, res) => {
  const sessionId = req.cookies?.session_id;
  
  if (!sessionId) {
    return res.status(401).json({ error: 'Сессия не найдена' });
  }
  
  const user = db.prepare('SELECT * FROM users WHERE session_id = ?').get(sessionId);
  
  if (!user) {
    return res.status(401).json({ error: 'Сессия не найдена' });
  }
  
  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// Получение текущего пользователя
app.get('/api/user/:id', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  
  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }
  
  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// Обновление пользователя
app.put('/api/user/:id', (req, res) => {
  const { enrolledCourses, testResults, learningProgress } = req.body;
  
  const updates = [];
  const values = [];
  
  if (enrolledCourses !== undefined) {
    updates.push('enrolledCourses = ?');
    values.push(JSON.stringify(enrolledCourses));
  }
  
  if (testResults !== undefined) {
    updates.push('testResults = ?');
    values.push(JSON.stringify(testResults));
  }
  
  if (learningProgress !== undefined) {
    updates.push('learningProgress = ?');
    values.push(JSON.stringify(learningProgress));
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'Нет данных для обновления' });
  }
  
  values.push(req.params.id);
  
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  const { password: _, ...userWithoutPassword } = user;
  
  res.json(userWithoutPassword);
});

// Смена пароля пользователя
app.put('/api/user/:id/password', (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = parseInt(req.params.id);
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Требуются текущий и новый пароли' });
  }
  
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  
  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }
  
  // Проверяем текущий пароль
  const validPassword = bcrypt.compareSync(currentPassword, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: 'Неверный текущий пароль' });
  }
  
  // Хешируем новый пароль
  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  
  // Обновляем пароль
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, userId);
  
  res.json({ success: true, message: 'Пароль успешно изменён' });
});

// Запись на курс (для developer)
app.post('/api/user/:userId/enrollment/:courseId', (req, res) => {
  const { userId, courseId } = req.params;
  
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  
  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }
  
  let enrolledCourses = JSON.parse(user.enrolledCourses || '[]');
  
  if (!Array.isArray(enrolledCourses)) {
    enrolledCourses = [];
  }
  
  if (!enrolledCourses.includes(parseInt(courseId))) {
    enrolledCourses.push(parseInt(courseId));
    
    db.prepare('UPDATE users SET enrolledCourses = ? WHERE id = ?')
      .run(JSON.stringify(enrolledCourses), userId);
  }
  
  const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const { password: _, ...userWithoutPassword } = updatedUser;
  
  res.json(userWithoutPassword);
});

// Отписка от курса (для developer)
app.delete('/api/user/:userId/enrollment/:courseId', (req, res) => {
  const { userId, courseId } = req.params;
  
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  
  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }
  
  let enrolledCourses = JSON.parse(user.enrolledCourses || '[]');
  
  if (!Array.isArray(enrolledCourses)) {
    return res.status(400).json({ error: 'Неверный формат данных' });
  }
  
  const index = enrolledCourses.indexOf(parseInt(courseId));
  
  if (index === -1) {
    return res.status(400).json({ error: 'Пользователь не записан на этот курс' });
  }
  
  enrolledCourses.splice(index, 1);
  
  db.prepare('UPDATE users SET enrolledCourses = ? WHERE id = ?')
    .run(JSON.stringify(enrolledCourses), userId);
  
  const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const { password: _, ...userWithoutPassword } = updatedUser;
  
  res.json(userWithoutPassword);
});

// Очистка данных активности (для developer)
app.delete('/api/user/:userId/activity/:courseId', (req, res) => {
  const { userId, courseId } = req.params;
  
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  
  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }
  
  let testResults = JSON.parse(user.testResults || '[]');
  let learningProgress = JSON.parse(user.learningProgress || '{}');
  
  if (!Array.isArray(testResults)) {
    testResults = [];
  }
  
  if (typeof learningProgress !== 'object' || learningProgress === null) {
    learningProgress = {};
  }
  
  // Получаем все тесты для курса
  const courses = db.prepare('SELECT * FROM courses').all();
  const course = courses.find(c => c.id === parseInt(courseId));
  
  if (course && course.testId) {
    // Удаляем результаты тестов этого курса
    testResults = testResults.filter(r => r.testId !== course.testId);
  }
  
  // Удаляем прогресс изучения тем этого курса
  const topics = db.prepare('SELECT id FROM topics WHERE courseId = ?').all(courseId);
  const topicIds = topics.map(t => t.id);
  
  topicIds.forEach(topicId => {
    delete learningProgress[topicId];
  });
  
  db.prepare('UPDATE users SET testResults = ?, learningProgress = ? WHERE id = ?')
    .run(JSON.stringify(testResults), JSON.stringify(learningProgress), userId);
  
  const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const { password: _, ...userWithoutPassword } = updatedUser;
  
  res.json(userWithoutPassword);
});

// Полный сброс данных пользователя (для developer)
app.delete('/api/user/:userId/reset/:courseId', (req, res) => {
  const { userId, courseId } = req.params;
  
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  
  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }
  
  // Отписываем от курса
  let enrolledCourses = JSON.parse(user.enrolledCourses || '[]');
  
  if (Array.isArray(enrolledCourses)) {
    const index = enrolledCourses.indexOf(parseInt(courseId));
    if (index !== -1) {
      enrolledCourses.splice(index, 1);
      db.prepare('UPDATE users SET enrolledCourses = ? WHERE id = ?')
        .run(JSON.stringify(enrolledCourses), userId);
    }
  }
  
  // Очищаем результаты тестов этого курса
  let testResults = JSON.parse(user.testResults || '[]');
  
  if (!Array.isArray(testResults)) {
    testResults = [];
  }
  
  const courses = db.prepare('SELECT * FROM courses').all();
  const course = courses.find(c => c.id === parseInt(courseId));
  
  if (course && course.testId) {
    testResults = testResults.filter(r => r.testId !== course.testId);
  }
  
  // Очищаем прогресс изучения тем этого курса
  let learningProgress = JSON.parse(user.learningProgress || '{}');
  
  if (typeof learningProgress !== 'object' || learningProgress === null) {
    learningProgress = {};
  }
  
  const topics = db.prepare('SELECT id FROM topics WHERE courseId = ?').all(courseId);
  const topicIds = topics.map(t => t.id);
  
  topicIds.forEach(topicId => {
    delete learningProgress[topicId];
  });
  
  db.prepare('UPDATE users SET testResults = ?, learningProgress = ? WHERE id = ?')
    .run(JSON.stringify(testResults), JSON.stringify(learningProgress), userId);
  
  const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const { password: _, ...userWithoutPassword } = updatedUser;
  
  res.json(userWithoutPassword);
});

// Логирование действий
app.post('/api/logs', (req, res) => {
  const { userId, username, action, description } = req.body;
  
  db.prepare(`
    INSERT INTO activity_logs (userId, username, action, description, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, username, action, description, new Date().toISOString());
  
  res.json({ success: true });
});

// Получение логов
app.get('/api/logs', (req, res) => {
  const { userId, action } = req.query;
  
  let query = 'SELECT * FROM activity_logs ORDER BY timestamp DESC';
  const params = [];
  
  if (userId && userId !== 'all') {
    query += ' WHERE userId = ?';
    params.push(parseInt(userId));
  }
  
  if (action && action !== 'all') {
    if (query.includes('WHERE')) {
      query += ' AND action = ?';
    } else {
      query += ' WHERE action = ?';
    }
    params.push(action);
  }
  
  const logs = db.prepare(query).all(...params);
  res.json(logs);
});

// Получение всех пользователей (для админов)
app.get('/api/users', (req, res) => {
  const users = db.prepare('SELECT * FROM users').all();
  
  const usersWithoutPassword = users.map(user => {
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  });
  
  res.json(usersWithoutPassword);
});

// Регистрация нового пользователя (для developer и support)
app.post('/api/user/register', (req, res) => {
  const { username, password, role } = req.body;
  
  // Валидация
  if (!username || username.length < 3) {
    return res.status(400).json({ error: 'Имя пользователя должно быть не менее 3 символов' });
  }
  
  if (!password || password.length < 4) {
    return res.status(400).json({ error: 'Пароль должен быть не менее 4 символов' });
  }
  
  if (!role || !['listener', 'teacher', 'support', 'developer'].includes(role)) {
    return res.status(400).json({ error: 'Недопустимая роль' });
  }
  
  // Проверяем существование пользователя
  const existingUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (existingUser) {
    return res.status(409).json({ error: 'Пользователь с таким именем уже существует' });
  }
  
  // Определяем roleName
  const roleNames = {
    'listener': 'Слушатель',
    'teacher': 'Преподаватель',
    'support': 'Техническая поддержка',
    'developer': 'Разработчик'
  };
  
  // Получаем следующий ID
  const maxId = db.prepare('SELECT MAX(id) as maxId FROM users').get();
  const newId = (maxId.maxId || 0) + 1;
  
  // Хешируем пароль
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  // Создаём пользователя
  db.prepare(`
    INSERT INTO users (id, username, password, role, roleName, enrolledCourses, testResults, learningProgress)
    VALUES (?, ?, ?, ?, ?, '[]', '[]', '{}')
  `).run(newId, username, hashedPassword, role, roleNames[role]);
  
  const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(newId);
  const { password: _, ...userWithoutPassword } = newUser;
  
  res.status(201).json(userWithoutPassword);
});

// Удаление пользователя (для developer и support)
app.delete('/api/user/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  
  // Проверяем, что пользователь существует
  const userToDelete = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  
  if (!userToDelete) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }
  
  // Нельзя удалить системных пользователей с id <= 2 (listener, teacher)
  // developer и support могут быть созданы повторно и их можно удалять
  if (userToDelete.id <= 2) {
    return res.status(403).json({ error: 'Нельзя удалить системных пользователей' });
  }
  
  // Удаляем пользователя
  db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  
  res.json({ success: true, message: 'Пользователь успешно удалён' });
});

// Получение курсов
app.get('/api/courses', (req, res) => {
  const courses = db.prepare('SELECT * FROM courses').all();
  res.json(courses);
});

// Получение тем курса
app.get('/api/courses/:id/topics', (req, res) => {
  const topics = db.prepare('SELECT * FROM topics WHERE courseId = ? ORDER BY orderNum')
    .all(req.params.id);
  res.json(topics);
});

// Получение теста
app.get('/api/courses/:id/test', (req, res) => {
  const test = db.prepare('SELECT * FROM tests WHERE courseId = ?').get(req.params.id);
  
  if (!test) {
    return res.status(404).json({ error: 'Тест не найден' });
  }
  
  res.json(test);
});

// Статистика пользователя
app.get('/api/user/:id/stats', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  
  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }
  
  const enrolledCourses = JSON.parse(user.enrolledCourses || '[]');
  const testResults = JSON.parse(user.testResults || '[]');
  
  const avgScore = testResults.length > 0
    ? Math.round(testResults.reduce((sum, r) => sum + r.percentage, 0) / testResults.length)
    : 0;
  
  res.json({
    enrolledCourses: enrolledCourses.length,
    testsCompleted: testResults.length,
    averageScore: avgScore
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
  console.log(`База данных: school.db`);
});
