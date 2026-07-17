import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fetchBankExchangeRates } from './src/main/services/currency';

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

const bankRatesPreviewPlugin = (): Plugin => ({
  name: 'bx-bank-rates-preview',
  configureServer(server) {
    server.middlewares.use('/__bx/bank-rates', async (request, response) => {
      try {
        const url = new URL(request.url ?? '', 'http://localhost');
        const codes = (url.searchParams.get('codes') ?? 'USD,EUR,RUB').split(',').filter(Boolean);
        const rates = await fetchBankExchangeRates(codes);
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.setHeader('Cache-Control', 'no-store');
        response.end(JSON.stringify(rates));
      } catch (error) {
        response.statusCode = 502;
        response.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Bank rates unavailable' }));
      }
    });
  },
});

export default defineConfig({
  plugins: [react(), bankRatesPreviewPlugin(), cspPlugin()],
  css: {
    postcss: './postcss.config.js',
  },
  server: {
    host: true,
    port: 5173,
  },
});
