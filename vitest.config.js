import { defineConfig } from 'vite'
// import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
	plugins: [],
	test: {
		globals: true,
		environment: 'jsdom',
		coverage: {
			reporter: ['text', 'lcov'],
			all: false,
			include: ['src']
		}
	}
})
