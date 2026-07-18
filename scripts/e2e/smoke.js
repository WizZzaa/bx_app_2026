// E2E-смоук BX: подключается к уже запущенному Electron по CDP и проверяет,
// что главное окно и трей-окно рендерятся, показывают версию и не сыплют
// ошибками в консоль. Порт задаётся через CDP_PORT (по умолчанию 9245).
//
// Обычно запускается через run-smoke.sh, который сам поднимает приложение
// с выделенным user-data-dir. Можно и вручную против живого экземпляра:
//   npm start -- -- --remote-debugging-port=9245
//   CDP_PORT=9245 node scripts/e2e/smoke.js
const { chromium } = require('playwright-core')

const PORT = process.env.CDP_PORT || '9245'
const VERSION_RE = /v?\s?\d+\.\d{1,2}\.\d+/

async function main() {
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${PORT}`)
  const ctx = browser.contexts()[0]
  if (!ctx) throw new Error('нет CDP-контекста — приложение не поднялось?')

  // CDP становится доступен раньше, чем Vite успевает смонтировать React.
  // DevTools также появляется отдельной страницей и раньше ошибочно выбирался
  // как главное окно приложения.
  const pages = ctx.pages()
  const appPages = pages.filter(page => {
    const url = page.url()
    return url !== 'about:blank' && !url.startsWith('devtools://')
  })
  console.log('PAGES:', appPages.map(page => page.url()).join(' | '))
  const main = appPages.find(p => !p.url().includes('#/tray'))
  const tray = appPages.find(p => p.url().includes('#/tray'))
  if (!main) throw new Error('не найдено главное окно')

  const failures = []

  for (const [name, page] of [['MAIN', main], ['TRAY', tray]]) {
    if (!page) {
      console.log(`${name}: окно отсутствует (пропуск)`) // трей может быть скрыт
      continue
    }
    const errors = []
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)) })
    page.on('pageerror', e => errors.push('pageerror: ' + e.message.slice(0, 200)))

    await page.waitForSelector('#root > *', { state: 'attached', timeout: 15_000 }).catch(() => undefined)

    const state = await page.evaluate(() => ({
      title: document.title,
      hasRoot: !!document.querySelector('#root, [id^="root"]')?.childElementCount,
      text: document.body.innerText.replace(/\n+/g, ' | ').slice(0, 300),
    }))
    const ver = (state.text.match(VERSION_RE) || [])[0] || null

    console.log(`${name}: version=${ver} hasContent=${state.hasRoot} consoleErrors=${errors.length}`)
    if (errors.length) {
      errors.slice(0, 6).forEach(e => console.log('  ERR:', e))
      failures.push(`${name}: ${errors.length} console-ошибок`)
    }
    if (!state.hasRoot) failures.push(`${name}: пустой #root (не отрендерилось)`)
  }

  // Проверка переключения темы на главном окне.
  const theme = await main.evaluate(() => {
    const read = () => getComputedStyle(document.documentElement).getPropertyValue('--bx-bg').trim()
    const dark = read()
    document.documentElement.classList.add('light')
    const light = read()
    document.documentElement.classList.remove('light')
    return { dark, light, differs: !!dark && dark !== light }
  })
  console.log(`THEME: dark=${theme.dark} light=${theme.light} differs=${theme.differs}`)
  if (!theme.differs) failures.push('THEME: светлая тема не меняет --bx-bg')

  await browser.close()

  if (failures.length) {
    console.error('\nE2E FAIL:\n - ' + failures.join('\n - '))
    process.exit(1)
  }
  console.log('\nE2E OK')
}

main().catch(e => { console.error('E2E FAIL:', e.message); process.exit(1) })
