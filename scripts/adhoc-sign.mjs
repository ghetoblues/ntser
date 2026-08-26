#!/usr/bin/env node
// Seals the packaged app with an ad-hoc signature.
//
// Without a Developer ID electron-builder skips signing altogether, and what
// comes out is an app whose Mach-O slices carry only the signature the linker
// left behind: no _CodeSignature, nothing sealed. Once the disk image has been
// downloaded and quarantined, macOS reads that as a broken bundle rather than
// an unsigned one, and offers the Trash instead of the "open anyway" the README
// promises.
//
// An ad-hoc signature vouches for nobody, but it does seal the bundle, so
// Gatekeeper falls back to the unidentified-developer path.

import { execFileSync } from "node:child_process"
import path from "node:path"

export default async function adhocSign(context) {
	if (context.electronPlatformName !== "darwin") {
		return
	}

	// A universal build is packed once per architecture into <out>-<arch>-temp
	// directories and then merged. Signing those makes their CodeResources
	// differ, and the merge refuses to combine files whose hashes disagree, so
	// wait for the merged app: electron-builder runs this again on it, before it
	// builds the disk image.
	if (path.basename(context.appOutDir).endsWith("-temp")) {
		return
	}

	const app = path.join(
		context.appOutDir,
		`${context.packager.appInfo.productFilename}.app`,
	)

	try {
		execFileSync("codesign", ["--force", "--deep", "--sign", "-", app])
	} catch (err) {
		const details = err.stderr ? `: ${err.stderr.toString().trim()}` : ""
		throw new Error(`could not ad-hoc sign ${app}${details}`)
	}
}
