import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// CSP только для продакшн-сборки: dev-серверу Vite нужны inline-скрипты и eval для HMR.
// connect-src: Supabase (API/edge functions), госсервисы РУз, погода, локальная Ollama.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https: http://localhost:11434",
].join('; ');

const cspPlugin = (): Plugin => ({
  name: 'inject-csp',
  apply: 'build',
  transformIndexHtml(html) {
    return html.replace(
      '<meta charset="UTF-8" />',
      `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`,
    );
  },
});

export default defineConfig({
  plugins: [react(), cspPlugin()],
  css: {
    postcss: './postcss.config.js',
  },
  server: {
    host: true,
    port: 5173,
  },
});
