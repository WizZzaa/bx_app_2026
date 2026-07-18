import { existsSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const ROOT = resolve('src/renderer/assets/mascot')
const FRAME_ROOT = join(ROOT, 'frames')
const IMAGEGEN_SCRIPT = process.env.BX_IMAGEGEN_SCRIPT
  || join(homedir(), '.codex/skills/.system/imagegen/scripts/image_gen.py')
const VARIANTS = ['base', 'business', 'analyst', 'night']
const CYCLES = ['idle', 'thinking', 'working', 'success', 'error', 'sleep', 'greeting', 'ai-wait', 'translation', 'task-done', 'reminder', 'feeding', 'playing']
const FRAME_COUNT = 24

const references = {
  base: join(FRAME_ROOT, 'idle/image_1_5.png'),
  business: join(ROOT, 'bix-business.png'),
  analyst: join(ROOT, 'bix-analyst.png'),
  night: join(ROOT, 'bix-night.png'),
}

const outfitPrompts = {
  base: 'Keep the original black BX hoodie with lime drawstrings exactly unchanged.',
  business: 'Keep the exact business outfit from the reference unchanged in every frame.',
  analyst: 'Keep the exact analyst outfit from the reference unchanged in every frame.',
  night: 'Keep the exact night outfit from the reference unchanged in every frame.',
}

const cyclePrompts = {
  idle: 'Calm idle breathing. Friendly neutral face, tiny natural ear and whisker movement.',
  thinking: 'Thinking: both lime-green irises and dark pupils clearly visible and looking upward; curious eyebrows, tiny head tilt.',
  working: 'Working: focused gentle squint, pupils still clearly visible, attentive expression, subtle forward concentration.',
  success: 'Success: warm unmistakable smile, bright open lime-green eyes with visible dark pupils, small happy ear movement.',
  error: 'Error: clearly furrowed brows and mildly dissatisfied professional expression, lime irises and pupils fully visible.',
  sleep: 'Sleeping loop: eyes naturally closed, slow inhale–snore–exhale rhythm, relaxed ears. No letters or sleep symbols over the face.',
  greeting: 'Friendly greeting: opens eyes, smiles and gives one small welcoming paw gesture while remaining behind the taskbar edge.',
  'ai-wait': 'Waiting for AI: attentive thinking expression, brief upward glance and subtle focused blink; no text, icons or loading symbols.',
  translation: 'Translation event: focused reading glance from left to right and a small satisfied nod; no text or document props.',
  'task-done': 'Task completed: confident happy smile and one restrained celebratory paw gesture, then settles.',
  reminder: 'Reminder: alert friendly expression, ears perk up, one gentle attention gesture; never angry or alarming.',
  feeding: 'Feeding reaction: pleased anticipatory look, tiny happy chew motion and content smile; no food object covering the face.',
  playing: 'Play reaction: lively curious eyes, playful ear movement and small paw bounce while preserving the anchored pose.',
}

const phasePrompts = [
  'neutral key pose', 'begin movement very slightly', 'continue movement', 'movement at one quarter',
  'movement approaching midpoint', 'midpoint anticipation', 'main expression begins', 'main expression strengthens',
  'main expression near peak', 'peak pose preparation', 'peak pose', 'hold peak with tiny secondary motion',
  'hold peak with a different tiny secondary motion', 'begin easing away from peak', 'ease back gradually', 'return past midpoint',
  'small natural blink or breathing beat', 'continue return', 'almost neutral', 'neutral with subtle follow-through',
  'tiny ear or whisker settle', 'breathing settle', 'match the opening pose closely', 'seamless loop closing pose',
]

function argument(name, fallback) {
  const index = process.argv.indexOf(`--${name}`)
  return index === -1 ? fallback : process.argv[index + 1]
}

function flag(name) {
  return process.argv.includes(`--${name}`)
}

function fail(message) {
  console.error(message)
  process.exit(1)
}

const variant = argument('variant')
const cycle = argument('cycle')
const start = Number(argument('start', '1'))
const end = Number(argument('end', String(FRAME_COUNT)))
const force = flag('force')
const dryRun = flag('dry-run')

if (!VARIANTS.includes(variant)) fail(`Укажите --variant: ${VARIANTS.join(', ')}`)
if (!CYCLES.includes(cycle)) fail(`Укажите --cycle: ${CYCLES.join(', ')}`)
if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end > FRAME_COUNT || start > end) {
  fail(`Диапазон должен быть в пределах 1–${FRAME_COUNT}`)
}
if (!existsSync(IMAGEGEN_SCRIPT)) fail(`Не найден imagegen CLI: ${IMAGEGEN_SCRIPT}`)
if (!existsSync(references[variant])) fail(`Не найден референс: ${references[variant]}`)
if (!dryRun && !process.env.OPENAI_API_KEY) fail('OPENAI_API_KEY не задан')

const outputDirectory = variant === 'base'
  ? join(FRAME_ROOT, cycle)
  : join(FRAME_ROOT, 'outfits', variant, cycle)
mkdirSync(outputDirectory, { recursive: true })

for (let frame = start; frame <= end; frame += 1) {
  const output = join(outputDirectory, `frame_${String(frame).padStart(3, '0')}.png`)
  if (existsSync(output) && !force) {
    console.log(`Пропуск существующего ${basename(output)}`)
    continue
  }

  const prompt = [
    'Create exactly one standalone animation frame, not a sprite sheet and not a collage.',
    'Preserve the exact BX cat identity, facial markings, fur texture, head proportions, ears, paws, hoodie silhouette and camera angle from the reference.',
    outfitPrompts[variant], cyclePrompts[cycle],
    `This is frame ${frame} of ${FRAME_COUNT}: ${phasePrompts[frame - 1]}.`,
    'The head and both paws must be fully inside the 1024x1024 canvas with at least 32 pixels of transparent padding on every side. Never crop ears, whiskers or paws.',
    'Both eyes must be anatomically aligned. When open, each eye must have a saturated lime-green iris, a clearly visible dark pupil and a small natural catchlight. Never produce empty, all-black, displaced or overlay eyes.',
    'Keep the mascot anchored at the same scale and center as the reference. No camera motion, no extra limbs, no accessories not present in the reference, no text, no logo changes, no props, no glow and no colored shapes over the face.',
    'Use native transparent RGBA background. Outside the mascot alpha must be exactly zero; the fur and clothing must be opaque except for natural antialiased edges.',
    'The closing frames must connect smoothly to frame 1 for a calm seamless loop.',
  ].join(' ')

  const command = [
    IMAGEGEN_SCRIPT, 'edit', '--model', 'gpt-image-1.5', '--image', references[variant],
    '--prompt', prompt, '--background', 'transparent', '--output-format', 'png',
    '--quality', 'high', '--input-fidelity', 'high', '--size', '1024x1024', '--out', output,
  ]

  if (dryRun) {
    console.log(`[dry-run] ${basename(output)} ← ${basename(references[variant])}: ${phasePrompts[frame - 1]}`)
    continue
  }

  console.log(`Генерация ${variant}/${cycle} ${frame}/${FRAME_COUNT}`)
  const result = spawnSync('python3', command, { stdio: 'inherit' })
  if (result.status !== 0) fail(`Генерация остановлена на ${variant}/${cycle}/${basename(output)}. Уже созданные кадры сохранены; повторный запуск продолжит цикл.`)
}

if (!dryRun && start === 1 && end === FRAME_COUNT) {
  const validation = spawnSync('node', ['scripts/validate-bix-frames.mjs', '--variant', variant, '--cycle', cycle], { stdio: 'inherit' })
  if (validation.status !== 0) process.exit(validation.status ?? 1)
}

console.log(`Готово: ${variant}/${cycle}, кадры ${start}–${end}.`)
