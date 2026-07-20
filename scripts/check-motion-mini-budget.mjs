import { gzipSync } from 'node:zlib'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import react from '@vitejs/plugin-react'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const appRoot = resolve(scriptDirectory, '..')
const adapterPath = resolve(appRoot, 'src/renderer/lib/ui/BxMotion.tsx')
const limitBytes = 25 * 1024

const virtualBuild = async (withMotion) => {
  const virtualId = withMotion ? 'virtual:bx-motion-budget' : 'virtual:bx-motion-control'
  const resolvedId = `\0${virtualId}`
  const result = await build({
    root: appRoot,
    configFile: false,
    logLevel: 'silent',
    plugins: [
      {
        name: 'bx-motion-budget-entry',
        resolveId(id) {
          return id === virtualId ? resolvedId : null
        },
        load(id) {
          if (id !== resolvedId) return null
          return withMotion
            ? `export { BxMotion } from ${JSON.stringify(adapterPath)}`
            : 'export const bxMotionModules = 0'
        },
      },
      react(),
    ],
    build: {
      write: false,
      target: 'es2020',
      minify: 'esbuild',
      rollupOptions: {
        input: virtualId,
        external: ['react', 'react/jsx-runtime'],
        output: {
          format: 'es',
          entryFileNames: 'bundle.js',
        },
      },
    },
  })

  const builds = Array.isArray(result) ? result : [result]
  const chunks = builds.flatMap(item => item.output).filter(item => item.type === 'chunk')
  const code = chunks.map(chunk => chunk.code).join('\n')
  const moduleIds = chunks.flatMap(chunk => Object.keys(chunk.modules))
  const motionModuleIds = moduleIds.filter(id =>
    /node_modules\/(motion|framer-motion|motion-dom|motion-utils)\//.test(id),
  )

  return {
    gzipBytes: gzipSync(code).byteLength,
    motionModules: new Set(motionModuleIds),
  }
}

const [control, active] = await Promise.all([
  virtualBuild(false),
  virtualBuild(true),
])
const incrementalBytes = Math.max(0, active.gzipBytes - control.gzipBytes)

if (control.motionModules.size !== 0) {
  throw new Error(`Motion leaked into the control route: ${Array.from(control.motionModules).join(', ')}`)
}
if (active.motionModules.size === 0) {
  throw new Error('Motion Mini adapter fixture did not include Motion modules')
}
if (incrementalBytes > limitBytes) {
  throw new Error(
    `Motion Mini route impact is ${(incrementalBytes / 1024).toFixed(1)} KiB gzip; limit is 25 KiB`,
  )
}

console.log(
  `PASS Motion Mini route impact: ${(incrementalBytes / 1024).toFixed(1)} KiB gzip (limit 25); control route: 0 Motion modules`,
)
