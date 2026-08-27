#!/usr/bin/env node
// Drops Chromium bits this player never uses from a packaged .app.
//
// Electron ships dozens of UI locales and a software Vulkan renderer. Together
// they are tens of megabytes, and a menubar radio that speaks English and
// never draws WebGL does not need them. Called from afterPack, before the
// ad-hoc signature, so the seal covers the slimmer tree.

import { existsSync, readdirSync, rmSync } from "node:fs"
import path from "node:path"

const KEEP_LPROJ = new Set(["en.lproj", "English.lproj", "Base.lproj"])

const SWIFTSHADER = [
	"Libraries/libvk_swiftshader.dylib",
	"Libraries/vk_swiftshader_icd.json",
	"Resources/vk_swiftshader_icd.json",
]

export function slimApp(appPath) {
	for (const resources of localeDirs(appPath)) {
		stripLocales(resources)
	}
	for (const root of frameworkRoots(appPath)) {
		stripSwiftshader(root)
	}
}

function localeDirs(appPath) {
	return [
		path.join(appPath, "Contents/Resources"),
		...frameworkRoots(appPath).map((root) => path.join(root, "Resources")),
	]
}

function frameworkRoots(appPath) {
	const framework = path.join(
		appPath,
		"Contents/Frameworks/Electron Framework.framework",
	)
	return [
		framework,
		path.join(framework, "Versions/A"),
		path.join(framework, "Versions/Current"),
	]
}

function stripLocales(resourcesDir) {
	if (!existsSync(resourcesDir)) {
		return
	}

	for (const name of readdirSync(resourcesDir)) {
		if (!name.endsWith(".lproj") || KEEP_LPROJ.has(name)) {
			continue
		}
		rmSync(path.join(resourcesDir, name), { recursive: true, force: true })
	}
}

function stripSwiftshader(frameworkRoot) {
	for (const rel of SWIFTSHADER) {
		const file = path.join(frameworkRoot, rel)
		if (existsSync(file)) {
			rmSync(file)
		}
	}
}
