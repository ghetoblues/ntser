import { promises as fs } from "node:fs"
import path from "node:path"
import { app, safeStorage } from "electron"

export type Credentials = {
	email: string
	password: string
}

const filename = path.join(app.getPath("userData"), "credentials.json")

// Reading the stored credentials decrypts them through safeStorage, which on
// macOS reaches into the keychain and, for an unsigned build, asks the user to
// authorise it. Development builds are unsigned and rebuilt constantly, so that
// prompt would show up on every run: let NTS_EMAIL and NTS_PASSWORD (from the
// gitignored .env) stand in for the keychain instead.
function fromEnvironment(): Credentials | null {
	const { NTS_EMAIL: email, NTS_PASSWORD: password } = process.env
	if (!email || !password) {
		return null
	}

	return { email, password }
}

export async function read(): Promise<Credentials | null> {
	const env = fromEnvironment()
	if (env) {
		return env
	}

	try {
		const buf = await fs.readFile(filename)
		const content = safeStorage.decryptString(buf)
		const creds = JSON.parse(content)
		if (creds.email && creds.password) {
			return creds
		}
		return null
	} catch (err) {
		return null
	}
}

export async function write(credentials: Credentials): Promise<void> {
	const content = JSON.stringify(credentials)
	const buf = safeStorage.encryptString(content)
	await fs.writeFile(filename, buf)
}

export async function clear(): Promise<void> {
	await fs.unlink(filename)
}

export async function has() {
	const creds = await read()
	return creds !== null
}
