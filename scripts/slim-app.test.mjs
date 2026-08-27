import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { test } from "node:test"

import { slimApp } from "./slim-app.mjs"

test("slimApp keeps English locales and drops the rest plus SwiftShader", () => {
	const root = mkdtempSync(path.join(os.tmpdir(), "ntser-slim-"))
	const app = path.join(root, "NTSer.app")
	const fw = path.join(
		app,
		"Contents/Frameworks/Electron Framework.framework/Versions/A",
	)
	const res = path.join(fw, "Resources")
	const lib = path.join(fw, "Libraries")
	mkdirSync(path.join(res, "en.lproj"), { recursive: true })
	mkdirSync(path.join(res, "de.lproj"), { recursive: true })
	mkdirSync(path.join(res, "fr.lproj"), { recursive: true })
	mkdirSync(path.join(app, "Contents/Resources/ru.lproj"), { recursive: true })
	mkdirSync(path.join(app, "Contents/Resources/Base.lproj"), { recursive: true })
	mkdirSync(lib, { recursive: true })
	writeFileSync(path.join(res, "en.lproj", "locale.pak"), "en")
	writeFileSync(path.join(res, "de.lproj", "locale.pak"), "de")
	writeFileSync(path.join(lib, "libvk_swiftshader.dylib"), "x")
	writeFileSync(path.join(lib, "vk_swiftshader_icd.json"), "{}")
	writeFileSync(path.join(lib, "libffmpeg.dylib"), "keep")
	writeFileSync(path.join(res, "chrome_100_percent.pak"), "keep")

	try {
		slimApp(app)

		assert.ok(existsSync(path.join(res, "en.lproj")))
		assert.ok(existsSync(path.join(app, "Contents/Resources/Base.lproj")))
		assert.equal(existsSync(path.join(res, "de.lproj")), false)
		assert.equal(existsSync(path.join(res, "fr.lproj")), false)
		assert.equal(existsSync(path.join(app, "Contents/Resources/ru.lproj")), false)
		assert.equal(existsSync(path.join(lib, "libvk_swiftshader.dylib")), false)
		assert.equal(existsSync(path.join(lib, "vk_swiftshader_icd.json")), false)
		assert.ok(existsSync(path.join(lib, "libffmpeg.dylib")))
		assert.ok(existsSync(path.join(res, "chrome_100_percent.pak")))
	} finally {
		rmSync(root, { recursive: true, force: true })
	}
})
