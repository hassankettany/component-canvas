import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'
import fs from 'fs'

const CANVAS_STATE_FILE = path.resolve(__dirname, '.canvas/state.json');

function canvasSyncPlugin() {
  return {
    name: 'canvas-sync',
    configureServer(server) {
      const dir = path.resolve(__dirname, '.canvas');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      server.middlewares.use((req, res, next) => {
        if (req.url !== '/__canvas/state') return next();

        if (req.method === 'GET') {
          try {
            const data = fs.existsSync(CANVAS_STATE_FILE)
              ? fs.readFileSync(CANVAS_STATE_FILE, 'utf-8')
              : '{}';
            res.setHeader('Content-Type', 'application/json');
            res.end(data);
          } catch {
            res.end('{}');
          }
        } else if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', () => {
            try {
              fs.writeFileSync(CANVAS_STATE_FILE, body, 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.end('{"ok":true}');
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        } else {
          next();
        }
      });
    },
  };
}

export default defineConfig({
  base: '/component-canvas/',
  plugins: [canvasSyncPlugin(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
