import { inflateSync } from 'node:zlib'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('../src/renderer/assets/mascot/frames/', import.meta.url)
const CYCLES = ['idle', 'thinking', 'working', 'success', 'error', 'sleep', 'greeting', 'ai-wait', 'translation', 'task-done', 'reminder', 'feeding', 'playing']
const EXPECTED_FRAMES = 24
const EXPECTED_SIZE = 1024
const PNG_SIGNATURE = '89504e470d0a1a0a'

function paeth(a, b, c) {
  const p = a + b - c
  const pa = Math.abs(p - a)
  const pb = Math.abs(p - b)
  const pc = Math.abs(p - c)
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c
}

function decodeRgbaPng(path) {
  const input = readFileSync(path)
  if (input.subarray(0, 8).toString('hex') !== PNG_SIGNATURE) throw new Error('не PNG')
  let offset = 8
  let width = 0
  let height = 0
  let bitDepth = 0
  let colorType = 0
  const idat = []
  while (offset < input.length) {
    const length = input.readUInt32BE(offset)
    const type = input.subarray(offset + 4, offset + 8).toString('ascii')
    const data = input.subarray(offset + 8, offset + 8 + length)
    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      bitDepth = data[8]
      colorType = data[9]
    }
    if (type === 'IDAT') idat.push(data)
    offset += length + 12
    if (type === 'IEND') break
  }
  if (bitDepth !== 8 || colorType !== 6) throw new Error(`нужен 8-bit RGBA, получено bitDepth=${bitDepth}, colorType=${colorType}`)
  const packed = inflateSync(Buffer.concat(idat))
  const stride = width * 4
  const pixels = Buffer.alloc(stride * height)
  let source = 0
  for (let y = 0; y < height; y += 1) {
    const filter = packed[source]
    source += 1
    const row = pixels.subarray(y * stride, (y + 1) * stride)
    const previous = y ? pixels.subarray((y - 1) * stride, y * stride) : null
    for (let x = 0; x < stride; x += 1) {
      const raw = packed[source + x]
      const left = x >= 4 ? row[x - 4] : 0
      const above = previous ? previous[x] : 0
      const upperLeft = previous && x >= 4 ? previous[x - 4] : 0
      if (filter === 0) row[x] = raw
      else if (filter === 1) row[x] = (raw + left) & 255
      else if (filter === 2) row[x] = (raw + above) & 255
      else if (filter === 3) row[x] = (raw + Math.floor((left + above) / 2)) & 255
      else if (filter === 4) row[x] = (raw + paeth(left, above, upperLeft)) & 255
      else throw new Error(`неподдерживаемый PNG-фильтр ${filter}`)
    }
    source += stride
  }
  return { width, height, pixels }
}

function analyseFrame(path) {
  const { width, height, pixels } = decodeRgbaPng(path)
  if (width !== EXPECTED_SIZE || height !== EXPECTED_SIZE) throw new Error(`размер ${width}×${height}, ожидается ${EXPECTED_SIZE}×${EXPECTED_SIZE}`)
  let visible = 0
  let partial = 0
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = pixels[(y * width + x) * 4 + 3]
      if (!alpha) continue
      visible += 1
      if (alpha < 240) partial += 1
      minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y)
    }
  }
  if (visible < width * height * 0.1) throw new Error('персонаж занимает меньше 10% холста')
  if (partial / visible > 0.14) throw new Error(`слишком много полупрозрачных пикселей: ${Math.round(partial / visible * 100)}%`)
  const corners = [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]]
  if (corners.some(([x, y]) => pixels[(y * width + x) * 4 + 3] !== 0)) throw new Error('углы холста непрозрачны')
  const padding = Math.min(minX, minY, width - 1 - maxX, height - 1 - maxY)
  if (padding < 16) throw new Error(`слишком маленький прозрачный отступ: ${padding}px`)
  return { centerX: (minX + maxX) / 2, centerY: (minY + maxY) / 2, width: maxX - minX + 1, height: maxY - minY + 1 }
}

const errors = []
for (const cycle of CYCLES) {
  const directory = join(ROOT.pathname, cycle)
  let files = []
  try {
    files = readdirSync(directory).filter(name => /^frame_\d{3}\.png$/.test(name)).sort()
  } catch {
    errors.push(`${cycle}: каталог отсутствует`)
    continue
  }
  if (files.length !== EXPECTED_FRAMES) {
    errors.push(`${cycle}: ${files.length} кадров вместо ${EXPECTED_FRAMES}`)
    continue
  }
  const metrics = []
  files.forEach(file => {
    try { metrics.push(analyseFrame(join(directory, file))) }
    catch (error) { errors.push(`${cycle}/${file}: ${error.message}`) }
  })
  metrics.forEach((metric, index) => {
    if (!index) return
    const previous = metrics[index - 1]
    const jump = Math.max(Math.abs(metric.centerX - previous.centerX), Math.abs(metric.centerY - previous.centerY), Math.abs(metric.width - previous.width), Math.abs(metric.height - previous.height))
    if (jump > 96) errors.push(`${cycle}/${files[index]}: скачок геометрии ${Math.round(jump)}px`)
  })
}

if (errors.length) {
  console.error(`Проверка кадров Бикса не пройдена (${errors.length}):`)
  errors.forEach(error => console.error(`- ${error}`))
  process.exitCode = 1
} else {
  console.log(`Готово: ${CYCLES.length * EXPECTED_FRAMES} кадров прошли проверку RGBA, прозрачности, отступов и геометрии.`)
}
