process.on('uncaughtException', (err) => {
  console.warn('[SERVER SAFEGUARD] Uncaught Exception:', err && err.message ? err.message : err);
});

process.on('unhandledRejection', (reason) => {
  console.warn('[SERVER SAFEGUARD] Unhandled Rejection:', reason && reason.message ? reason.message : reason);
});

import { startServer } from './src/server/appServer';

startServer().catch((err) => {
  console.error('Fatal Server Error:', err);
});




