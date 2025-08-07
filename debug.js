/**
 * Debug startup script
 */

console.log('Starting bot in debug mode...');

try {
  // Test database initialization separately
  const { initializeDatabase } = await import('./services/database.js');
  console.log('Testing database initialization...');
  await initializeDatabase();
  console.log('Database initialized successfully');

  // Test connection initialization separately
  const { initializeConnection } = await import('./core/connection.js');
  console.log('Testing connection initialization...');
  await initializeConnection({ usePairingCode: false });
  console.log('Connection initialized successfully');

} catch (error) {
  console.error('Error details:', {
    message: error.message,
    stack: error.stack,
    code: error.code,
    cause: error.cause
  });
  process.exit(1);
}