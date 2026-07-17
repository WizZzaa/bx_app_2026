import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const images = [16, 32, 48, 64, 128, 256].map(size => ({
  size,
  path: path.join(root, 'resources', 'icon-ico', `${size}.png`),
}))

const entries = images.map(image => ({ ...image, data: fs.readFileSync(image.path) }))
const headerSize = 6 + entries.length * 16
let offset = headerSize
const header = Buffer.alloc(headerSize)
header.writeUInt16LE(0, 0)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(entries.length, 4)

entries.forEach((entry, index) => {
  const position = 6 + index * 16
  header.writeUInt8(entry.size === 256 ? 0 : entry.size, position)
  header.writeUInt8(entry.size === 256 ? 0 : entry.size, position + 1)
  header.writeUInt8(0, position + 2)
  header.writeUInt8(0, position + 3)
  header.writeUInt16LE(1, position + 4)
  header.writeUInt16LE(32, position + 6)
  header.writeUInt32LE(entry.data.length, position + 8)
  header.writeUInt32LE(offset, position + 12)
  offset += entry.data.length
})

const output = path.join(root, 'resources', 'icon.ico')
fs.writeFileSync(output, Buffer.concat([header, ...entries.map(entry => entry.data)]))
console.log(`Created ${output} with ${entries.length} PNG sizes`)
