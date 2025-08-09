/**
 * HTTP Server for Replit Compatibility
 * Provides health check endpoint and basic status information
 */
import http from 'http';
import { logger } from './services/logger.js';

let serverInstance = null;

export function startHTTPServer(port = 5000) {
  return new Promise((resolve, reject) => {
    if (serverInstance) {
      logger.warn('HTTP server already running');
      resolve(serverInstance);
      return;
    }

  const server = http.createServer((req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    const url = req.url;
    const method = req.method;

    // Health check endpoint
    if (url === '/' || url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'healthy',
        service: 'WhatsApp Bot',
        name: 'MoJiTo-MD',
        version: '2.0.0',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        connected: global.conn ? global.conn.user ? true : false : false,
        plugins: global.plugins ? Object.keys(global.plugins).length : 0
      }));
      return;
    }

    // Status endpoint
    if (url === '/status') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      const stats = {
        bot: {
          name: global.botname || 'MoJiTo-MD',
          version: global.vs || '2.0.0',
          connected: global.conn ? global.conn.user ? true : false : false,
          user: global.conn?.user || null
        },
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          platform: process.platform,
          nodeVersion: process.version
        },
        plugins: global.plugins ? Object.keys(global.plugins).length : 0,
        database: {
          connected: global.db ? true : false,
          users: global.db?.data?.users ? Object.keys(global.db.data.users).length : 0
        }
      };
      res.end(JSON.stringify(stats, null, 2));
      return;
    }

    // Basic info page
    if (url === '/info') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>MoJiTo WhatsApp Bot</title>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
                .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                h1 { color: #333; text-align: center; }
                .status { padding: 15px; margin: 10px 0; border-radius: 5px; }
                .online { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
                .offline { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
                .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
                a { color: #007bff; text-decoration: none; }
                a:hover { text-decoration: underline; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🤖 MoJiTo WhatsApp Bot</h1>
                <div class="status ${global.conn?.user ? 'online' : 'offline'}">
                    Status: ${global.conn?.user ? '✅ Connected' : '❌ Disconnected'}
                </div>
                <div class="info">
                    <strong>Version:</strong> ${global.vs || '2.0.0'}<br>
                    <strong>Uptime:</strong> ${Math.floor(process.uptime())} seconds<br>
                    <strong>Plugins:</strong> ${global.plugins ? Object.keys(global.plugins).length : 0} loaded
                </div>
                <p><strong>Endpoints:</strong></p>
                <ul>
                    <li><a href="/health">/health</a> - Health check (JSON)</li>
                    <li><a href="/status">/status</a> - Detailed status (JSON)</li>
                    <li><a href="/info">/info</a> - This page</li>
                </ul>
            </div>
        </body>
        </html>
      `);
      return;
    }

    // 404 for other routes
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found', available: ['/health', '/status', '/info'] }));
  });

    server.listen(port, '0.0.0.0', () => {
      logger.info(`HTTP server running on port ${port}`);
      console.log(`Server is now listening on http://0.0.0.0:${port}`);
      serverInstance = server;
      resolve(server);
    });

    server.on('error', (error) => {
      logger.error('HTTP server error:', error);
      reject(error);
    });
  });
}

export function stopHTTPServer() {
  if (serverInstance) {
    serverInstance.close();
    serverInstance = null;
    logger.info('HTTP server stopped');
  }
}