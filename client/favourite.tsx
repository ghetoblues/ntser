import classnames from "classnames"
import { useCallback, useEffect, useState } from "react"

import { electron } from "./electron"
import { notify } from "./notifications"

import css from "./favourite.module.css"

type Props = {
	show: string
	episode: string
}

export function Favourite(props: Props) {
	const { show, episode } = props

	const [saved, setSaved] = useState(false)
	const [busy, setBusy] = useState(false)

	// The show on a live channel changes under us as the schedule moves on, so
	// re-check rather than assuming the last answer still holds.
	useEffect(
		function () {
			let current = true
			setSaved(false)

			if (!show) {
				return
			}

			electron
				.invoke("is-favourite", { show, episode })
				.then(function (result: boolean) {
					if (current) {
						setSaved(result)
					}
				})
				.catch(function () {
					// Not being able to tell is not worth bothering anyone about.
				})

			return function () {
				current = false
			}
		},
		[show, episode],
	)

	const handleClick = useCallback(
		async function () {
			if (busy || saved || !show) {
				return
			}

			setBusy(true)
			try {
				await electron.invoke("favourite", { show, episode })
				setSaved(true)
				notify({ message: "Saved to NTS favourites", ttl: 2000 })
			} catch (err) {
				const message = err instanceof Error ? err.message : "could not save"
				notify({ message, ttl: 3000 })
			} finally {
				setBusy(false)
			}
		},
		[busy, saved, show, episode],
	)

	return (
		<button
			type="button"
			className={classnames(css.favourite, saved && css.saved)}
			onClick={handleClick}
			disabled={!show}
			title={saved ? "In your NTS favourites" : "Save to NTS favourites"}
		>
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
				<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
			</svg>
		</button>
	)
}
