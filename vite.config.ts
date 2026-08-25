import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import tspaths from "vite-tsconfig-paths"

const port = Number(process.env.NTS_DEV_PORT ?? 5173)

export default defineConfig({
	build: {
		manifest: true,
		outDir: "./dist/client",
	},
	server: {
		port,
		strictPort: true,
	},
	plugins: [react(), tspaths()],
})
