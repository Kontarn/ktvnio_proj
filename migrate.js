/**
 * Скрипт миграции базы данных
 * Добавляет поле session_id для поддержки cookie-сессий
 */

const Database = require('better-sqlite3');
const db = new Database('school.db');

console.log('=== Migration: Adding session_id field ===');

try {
  // Проверяем, существует ли поле session_id
  const tableInfo = db.prepare("PRAGMA table_info(users)").all();
  const hasSessionId = tableInfo.some(col => col.name === 'session_id');
  
  if (hasSessionId) {
    console.log('✅ Field session_id already exists');
  } else {
    // Добавляем поле session_id
    db.exec('ALTER TABLE users ADD COLUMN session_id TEXT');
    console.log('✅ Field session_id added successfully');
  }
  
  // Показываем текущую структуру таблицы
  console.log('\nCurrent users table structure:');
  tableInfo.forEach(col => {
    console.log(`  - ${col.name}: ${col.type}`);
  });
  
  console.log('\n✅ Migration completed successfully!');
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
} finally {
  db.close();
}
