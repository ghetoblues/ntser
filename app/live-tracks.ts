import { type IpcMainInvokeEvent, type WebContents, ipcMain } from "electron"
import { type UserCredential, signInWithEmailAndPassword } from "firebase/auth"
import {
	type DocumentData,
	type QuerySnapshot,
	collection,
	limit,
	onSnapshot,
	orderBy,
	query,
	where,
} from "firebase/firestore"

import { type Stream, pathnameToStream, streamToPathname } from "~/lib/stream"

import * as credentials from "./credentials"
import { auth, store } from "./firebase"

const LIMIT = 15

export type LiveTrack = {
	title: string
	stream: Stream | null
	artists: string[]
	startTime: Date
}

type Handler = (err: Error | null, res: LiveTrack[] | null) => void

async function liveTracks(stream: 1 | 2, fn: Handler): Promise<() => void> {
	if (!store) {
		return function () {}
	}

	const qry = query(
		collection(store, "live_tracks"),
		where("stream_pathname", "==", streamToPathname(stream)),
		orderBy("start_time", "desc"),
		limit(LIMIT),
	)

	function handleSnapshot(snapshot: QuerySnapshot<DocumentData, DocumentData>) {
		const res: LiveTrack[] = []
		// biome-ignore lint/complexity/noForEach: we can't use for of here
		snapshot.forEach(function (doc) {
			const data = doc.data()
			res.push({
				title: data.song_title,
				artists: data.artist_names,
				stream: pathnameToStream(data.stream_pathname),
				startTime: data.start_time.toDate(),
			})
		})
		fn(null, res)
	}

	function handleError(err: Error) {
		fn(err, null)
	}

	return onSnapshot(qry, handleSnapshot, handleError)
}

export class NTSLiveTracks {
	webContents: WebContents

	promises: { [creds: string]: Promise<UserCredential> } = {}
	unsubscribe: null | (() => void)
	previous: {
		stream1: LiveTrack[]
		stream2: LiveTrack[]
	}

	creds: any | null
	ready: Promise<boolean> | null

	constructor(webContents: WebContents) {
		this.webContents = webContents
		this.unsubscribe = null
		this.ready = null
		this.previous = {
			stream1: [],
			stream2: [],
		}

		ipcMain.handle("login-credentials", this._handleLogin.bind(this))
	}

	// Authenticating means reading the stored credentials, which prompts for
	// keychain access on macOS. Hold that off until the tracklist is actually
	// wanted, so opening the app does not greet everyone with a dialog - and
	// people who never signed in never see one at all.
	async ensureAuth(): Promise<boolean> {
		if (!this.ready) {
			this.ready = this._readAndAuth()
		}

		const ok = await this.ready
		if (!ok) {
			// Signing in fails for reasons that pass: no network yet at launch, a
			// timeout, nobody signed in so far. Forget the attempt so the next one
			// tries again instead of staying broken until the app restarts.
			this.ready = null
		}

		return ok
	}

	async _readAndAuth(): Promise<boolean> {
		this.creds = await credentials.read()
		if (!this.creds) {
			return false
		}

		try {
			await this._auth()
			return true
		} catch (err) {
			console.warn("could not sign in to NTS:", err)
			return false
		}
	}

	async logout() {
		this.unsubscribe?.()
		this.creds = null
		this.ready = null
		await credentials.clear()
	}

	async subscribe() {
		if (!(await this.ensureAuth())) {
			return
		}

		const strm1 = await liveTracks(1, (err, res) => {
			if (err) {
				console.warn(err)
				return
			}
			if (!res) {
				return
			}

			this.webContents.send("live-tracks-1", res)
			this.previous.stream1 = res
		})

		const strm2 = await liveTracks(2, (err, res) => {
			if (err) {
				console.warn(err)
				return
			}
			if (!res) {
				return
			}

			this.previous.stream2 = res
			this.webContents.send("live-tracks-2", res)
		})

		this.unsubscribe = () => {
			this.unsubscribe = null
			strm1()
			strm2()
		}
	}

	async sync() {
		this.webContents.send("live-tracks-1", this.previous.stream1)
		this.webContents.send("live-tracks-2", this.previous.stream2)
	}

	async _auth() {
		await this._login(this.creds.email, this.creds.password)
	}

	async _login(email: string, password: string) {
		if (!auth) {
			throw new Error("live tracklist is unavailable in this build")
		}

		const key = `${email}:${password}`
		if (!this.promises[key]) {
			this.promises[key] = signInWithEmailAndPassword(auth, email, password)
		}

		return this.promises[key]
	}

	async _handleLogin(
		_evt: IpcMainInvokeEvent,
		data: { email: string; password: string },
	) {
		const { email, password } = data

		try {
			await this._login(email, password)
			await credentials.write({ email, password })
			this.ready = Promise.resolve(true)
			this.subscribe()
			return true
		} catch (err) {
			if (err instanceof Error) {
				throw err
			}
			throw new Error("could not log in")
		}
	}
}
