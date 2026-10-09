import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Cada microservicio FastAPI se expone como /api/<servicio> en el servidor de
// desarrollo; el proxy evita problemas de CORS sin modificar el backend.
const SERVICIOS = {
  auth: ['VITE_AUTH_URL', 'http://localhost:8081'],
  catalogo: ['VITE_CATALOGO_URL', 'http://localhost:8082'],
  pedidos: ['VITE_PEDIDOS_URL', 'http://localhost:8083'],
  pagos: ['VITE_PAGOS_URL', 'http://localhost:8084'],
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const proxy = Object.fromEntries(
    Object.entries(SERVICIOS).map(([servicio, [variable, defecto]]) => [
      `/api/${servicio}`,
      {
        target: env[variable] || defecto,
        changeOrigin: true,
        rewrite: (p) => p.replace(new RegExp(`^/api/${servicio}`), ''),
      },
    ])
  )

  return {
    plugins: [react()],
    esbuild: {
      jsxFactory: 'h',
      jsxFragment: 'Fragment',
    },
    resolve: {
      alias: {
        '~bootstrap': path.resolve(__dirname, 'node_modules/bootstrap'),
        'bootstrap': path.resolve(__dirname, 'node_modules/bootstrap'),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          quietDeps: true,
          api: 'modern-compiler',
          loadPaths: [path.resolve(__dirname, 'node_modules')],
          silenceDeprecations: ['import', 'global-builtin', 'color-functions'],
        },
      },
    },
    server: { port: 5173, proxy },
    preview: { port: 4173, proxy },
  }
})
