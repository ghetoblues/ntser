import { app, shell } from "electron"

export type Track = {
	artist: string
	title: string
}

const SEARCH = "https://itunes.apple.com/search"
const TIMEOUT = 8000

// How much of the artist and title we insist on recognising before we trust a
// search hit. NTS tracklists are hand-typed and full of edits and bootlegs, so
// an exact match is too strict, but opening a track nobody asked for is worse
// than opening a search - hence a middle ground.
const THRESHOLD = 0.5

type SearchResult = {
	artistName: string
	trackName: string
	trackViewUrl: string
}

function storefront(): string {
	return (app.getLocaleCountryCode() || "US").toLowerCase()
}

// Two readings of a name. The loose one keeps everything but punctuation and is
// what we compare against; the core one drops the parenthetical noise NTS
// tracklists are full of - "(Dub Mix)", "[Mixed]", "feat. X" - and is what we
// ask for.
function words(value: string): string[] {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, " ")
		.trim()
		.split(" ")
		.filter(Boolean)
}

function core(value: string): string[] {
	return words(
		value
			.replace(/\(.*?\)|\[.*?\]/g, " ")
			.replace(/\b(feat|ft|featuring|with|vs)\b\.?/gi, " "),
	)
}

// Placeholders, not names. DJ sets are full of tracks nobody has identified,
// and searching for them lands on whatever unrelated record shares the word.
const PLACEHOLDERS = new Set(["id", "unknown", "unknown artist", "untitled", ""])

function isPlaceholder(value: string): boolean {
	return PLACEHOLDERS.has(core(value).join(" "))
}

// The fraction of what we asked for that the candidate contains.
function recall(wanted: string[], found: string[]): number {
	if (wanted.length === 0) {
		return 0
	}

	const have = new Set(found)
	return wanted.filter((word) => have.has(word)).length / wanted.length
}

function rank(track: Track, result: SearchResult): number {
	const artist = recall(core(track.artist), words(result.artistName))
	const title = recall(core(track.title), words(result.trackName))

	if (artist < THRESHOLD || title < THRESHOLD) {
		return 0
	}

	// Everything the candidate carries that we did not ask for is a sign of a
	// remix, an edit or a "Mixed" compilation cut. Prefer the plain version.
	const asked = new Set(words(track.title))
	const extra = words(result.trackName).filter((word) => !asked.has(word)).length

	return artist + title - extra / 10
}

async function search(track: Track): Promise<SearchResult | null> {
	const url = new URL(SEARCH)
	url.searchParams.set(
		"term",
		[...core(track.artist), ...core(track.title)].join(" "),
	)
	url.searchParams.set("entity", "song")
	url.searchParams.set("limit", "25")
	url.searchParams.set("country", storefront())

	const resp = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) })
	if (!resp.ok) {
		throw new Error(`iTunes search responded ${resp.status}`)
	}

	const content = await resp.json()
	const results: SearchResult[] = content.results ?? []

	let best: SearchResult | null = null
	let score = 0
	for (const result of results) {
		const current = rank(track, result)
		if (current > score) {
			best = result
			score = current
		}
	}

	return best
}

function searchURL(track: Track): string {
	const url = new URL(`https://music.apple.com/${storefront()}/search`)
	url.searchParams.set("term", `${track.artist} ${track.title}`)
	return url.href
}

// music:// hands the link to the Music app instead of bouncing it through the
// browser. Only macOS registers that scheme, so leave other platforms on https.
function deeplink(url: string): string {
	if (process.platform !== "darwin") {
		return url
	}

	return url.replace(/^https:\/\//, "music://")
}

export type Opened = "track" | "search"

export async function open(track: Track): Promise<Opened> {
	if (!track.artist && !track.title) {
		throw new Error("track has neither an artist nor a title")
	}

	let found: SearchResult | null = null
	try {
		// An unidentified track has nothing to look up, so go straight to a
		// search the listener can take over.
		if (!isPlaceholder(track.artist) && !isPlaceholder(track.title)) {
			found = await search(track)
		}
	} catch (err) {
		// A failed lookup is not a reason to do nothing: fall back to a search
		// inside the Music app.
		console.warn("apple music lookup failed:", err)
	}

	if (found) {
		await shell.openExternal(deeplink(found.trackViewUrl))
		return "track"
	}

	await shell.openExternal(deeplink(searchURL(track)))
	return "search"
}
