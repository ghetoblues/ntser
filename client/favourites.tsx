import { useCallback, useEffect, useState } from "react"

import { electron } from "./electron"
import { useEvent } from "./lib/use-event"

import css from "./favourites.module.css"

type Episode = {
	show: string
	episode: string
	name: string
	image: string
	date: string
	url: string
}

type State = {
	loading: boolean
	data: Episode[]
	error: string | null
}

export function Favourites() {
	const [state, setState] = useState<State>({
		loading: true,
		data: [],
		error: null,
	})

	const load = useCallback(function () {
		setState((state) => ({ ...state, loading: true }))

		electron
			.invoke("favourites")
			.then(function (data: Episode[]) {
				setState({ loading: false, data, error: null })
			})
			.catch(function (err: Error) {
				setState({ loading: false, data: [], error: message(err) })
			})
	}, [])

	useEffect(
		function () {
			load()
		},
		[load],
	)

	// The schedule moves and favourites get added elsewhere, so refresh whenever
	// the window comes back rather than trusting what was loaded at boot.
	useEvent("open", load)

	const handleClick = useCallback(function (url: string) {
		electron.send("open-show-url", url)
	}, [])

	if (state.loading) {
		return <div className={css.notice}>Loading favourites…</div>
	}

	if (state.error) {
		return <div className={css.notice}>{state.error}</div>
	}

	if (state.data.length === 0) {
		return (
			<div className={css.notice}>
				Nothing saved yet. Hit the heart on a live channel, or drop a link on the
				menu icon.
			</div>
		)
	}

	return (
		<div className={css.favourites}>
			<div className={css.heading}>Favourites</div>
			<ul className={css.list}>
				{state.data.map(function (episode) {
					return (
						<li key={episode.show} className={css.item}>
							<button
								type="button"
								className={css.button}
								onClick={() => handleClick(episode.url)}
							>
								<img src={episode.image} className={css.image} alt="" />
								<span className={css.info}>
									<span className={css.name}>{episode.name}</span>
									<span className={css.date}>{formatDate(episode.date)}</span>
								</span>
							</button>
						</li>
					)
				})}
			</ul>
		</div>
	)
}

function message(err: Error): string {
	// Electron prefixes errors thrown in a handler with the channel name.
	return err.message.replace(/^Error invoking remote method '[^']+': Error: /, "")
}

function formatDate(date: string): string {
	return new Date(date)
		.toLocaleDateString("en-GB", {
			day: "2-digit",
			month: "short",
			year: "numeric",
		})
		.toUpperCase()
}
