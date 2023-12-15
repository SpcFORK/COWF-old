import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/'],
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    'body-parser',
    'compression',
    'cookie-parser',
    'cookie-session',
    'cors',
    'express',
    'helmet',
    'morgan',
    'passport',
    'passport-local',
    'tsup'
  ],
  outDir: 'dist',
  dts: true,
  format: ['cjs', 'esm', 'iife']
})
