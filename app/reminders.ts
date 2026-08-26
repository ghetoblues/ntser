import { promises as fs } from "node:fs"
import path from "node:path"
import { app, Notification, type WebContents } from "electron"

export type Reminder = {
	channel: 1 | 2
	name: string
	starts: string
}

const filename = path.join(app.getPath("userData"), "reminders.json")

// setTimeout tops out here, a little under 25 days. A schedule never reaches
// that far, but a bad timestamp should not silently fire straight away.
const LIMIT = 2147483647

const timers = new Map<string, NodeJS.Timeout>()
const pending = new Map<string, Reminder>()

let target: WebContents | null = null

export function attach(webContents: WebContents) {
	target = webContents
}

function key(reminder: Reminder): string {
	return `${reminder.channel}:${reminder.starts}`
}

export function list(): string[] {
	return Array.from(pending.keys())
}

async function save(): Promise<void> {
	try {
		await fs.writeFile(filename, JSON.stringify(Array.from(pending.values())))
	} catch (err) {
		console.warn("could not save reminders:", err)
	}
}

// Reminders are timers, and timers die with the process. A show marked in
// tomorrow's schedule is very likely to outlive the run it was set in, so they
// are written down and re-armed on the next launch.
export async function restore(): Promise<void> {
	let stored: Reminder[] = []
	try {
		stored = JSON.parse(await fs.readFile(filename, "utf-8"))
	} catch {
		return
	}

	for (const reminder of stored) {
		arm(reminder)
	}

	// Anything that came due while the app was closed is dropped by arm().
	await save()
}

function arm(reminder: Reminder): boolean {
	const delay = new Date(reminder.starts).getTime() - Date.now()
	if (delay <= 0 || delay > LIMIT) {
		return false
	}

	const id = key(reminder)
	pending.set(id, reminder)
	timers.set(
		id,
		setTimeout(() => fire(reminder), delay),
	)

	return true
}

function fire(reminder: Reminder) {
	const id = key(reminder)
	timers.delete(id)
	pending.delete(id)
	save()

	new Notification({
		title: `NTS ${reminder.channel} is on`,
		body: reminder.name,
	}).show()

	target?.send("reminders", list())
}

// Returns whether a reminder is set afterwards.
export async function toggle(reminder: Reminder): Promise<boolean> {
	const id = key(reminder)

	const existing = timers.get(id)
	if (existing) {
		clearTimeout(existing)
		timers.delete(id)
		pending.delete(id)
		await save()
		return false
	}

	const delay = new Date(reminder.starts).getTime() - Date.now()
	if (delay <= 0) {
		throw new Error("that show has already started")
	}

	if (!arm(reminder)) {
		throw new Error("that show is too far off")
	}

	await save()
	return true
}
