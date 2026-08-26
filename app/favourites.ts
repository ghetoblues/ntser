import {
	type DocumentData,
	addDoc,
	collection,
	getDocs,
	limit,
	query,
	serverTimestamp,
	where,
} from "firebase/firestore"

import { auth, store } from "./firebase"

export type Favourite = {
	show: string
	episode: string
}

// NTS keeps favourites in a Firestore collection rather than behind an API, and
// its own frontend writes documents of this shape. The reader on nts.live looks
// them up by device_id, which for a signed-in listener is the Firebase uid, so
// that field decides whether a favourite shows up in My NTS at all.
const COLLECTION = "favourites"

function document(fav: Favourite, uid: string): DocumentData {
	return {
		device_id: uid,
		client: "web",
		url: "https://www.nts.live/",
		version: "2.0.0",
		session: {
			campaign_id: null,
			campaign_type: null,
			campaign_source: null,
			ga_client_id: null,
			firebase_user_uid: uid,
			installation_id: null,
			user_agent: "NTS Desktop",
			referrer: null,
			country: null,
			country_code2: null,
			subscription_status: null,
		},
		created_at: serverTimestamp(),
		show_alias: fav.show,
		episode_alias: fav.episode ?? "",
	}
}

function uid(): string {
	if (!store || !auth) {
		throw new Error("favourites are unavailable in this build")
	}

	const user = auth.currentUser
	if (!user) {
		throw new Error("sign in to NTS to save favourites")
	}

	return user.uid
}

export async function add(fav: Favourite): Promise<void> {
	if (!fav.show) {
		throw new Error("nothing to favourite yet")
	}

	const user = uid()
	if (!store) {
		throw new Error("favourites are unavailable in this build")
	}

	await addDoc(collection(store, COLLECTION), document(fav, user))
}

// Used to show whether the current show is already saved, and to confirm after
// writing that the favourite really landed in the account.
export async function has(fav: Favourite): Promise<boolean> {
	if (!fav.show || !store || !auth?.currentUser) {
		return false
	}

	const qry = query(
		collection(store, COLLECTION),
		where("device_id", "==", auth.currentUser.uid),
		where("show_alias", "==", fav.show),
		limit(1),
	)

	const snapshot = await getDocs(qry)
	return !snapshot.empty
}
