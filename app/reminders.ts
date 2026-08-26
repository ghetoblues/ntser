import { Notification, type WebContents } from "electron"

export type Reminder = {
	channel: 1 | 2
	name: string
	starts: string
}

// Timers live in the process, so a reminder lasts as long as the app runs.
// That is enough for what this is for - being told a show you spotted in
// today's schedule has started - and avoids pretending to a persistence the
// app cannot honour once it quits.
const timers = new Map<string, NodeJS.Timeout>()

let target: WebContents | null = null

export function attach(webContents: WebContents) {
	target = webContents
}

function key(reminder: Reminder): string {
	return `${reminder.channel}:${reminder.starts}`
}

export function list(): string[] {
	return Array.from(timers.keys())
}

function fire(reminder: Reminder) {
	timers.delete(key(reminder))

	new Notification({
		title: `NTS ${reminder.channel} is on`,
		body: reminder.name,
	}).show()

	target?.send("reminders", list())
}

// Returns whether a reminder is set afterwards.
export function toggle(reminder: Reminder): boolean {
	const id = key(reminder)

	const existing = timers.get(id)
	if (existing) {
		clearTimeout(existing)
		timers.delete(id)
		return false
	}

	const delay = new Date(reminder.starts).getTime() - Date.now()
	if (delay <= 0) {
		throw new Error("that show has already started")
	}

	// setTimeout tops out around 24 days; a schedule never reaches that far, but
	// a bad timestamp should not silently fire straight away.
	if (delay > 2147483647) {
		throw new Error("that show is too far off")
	}

	timers.set(
		id,
		setTimeout(() => fire(reminder), delay),
	)

	return true
}

export function clear() {
	for (const timer of timers.values()) {
		clearTimeout(timer)
	}
	timers.clear()
}
