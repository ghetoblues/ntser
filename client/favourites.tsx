import { useCallback, useEffect, useState } from "react"

import { electron } from "./electron"
import css from "./favourites.module.css"
import { useEvent } from "./lib/use-event"

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

	// A favourite is a show, and its latest episode is only the likeliest guess at
	// which one you want, so opening one offers its recent episodes by date.
	const [picking, setPicking] = useState<Episode | null>(null)
	const [episodes, setEpisodes] = useState<Episode[] | null>(null)

	const handlePick = useCallback(function (episode: Episode) {
		setPicking(episode)
		setEpisodes(null)

		electron
			.invoke("episodes", episode.show)
			.then(setEpisodes)
			.catch(() => setEpisodes([episode]))
	}, [])

	const handleOpen = useCallback(function (url: string) {
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

	if (picking) {
		return (
			<div className={css.favourites}>
				<button type="button" className={css.back} onClick={() => setPicking(null)}>
					← {picking.name}
				</button>
				{!episodes && <div className={css.notice}>Loading episodes…</div>}
				{episodes && (
					<ul className={css.list}>
						{episodes.map(function (episode) {
							return (
								<li key={episode.episode} className={css.item}>
									<button
										type="button"
										className={css.button}
										onClick={() => handleOpen(episode.url)}
									>
										<span className={css.info}>
											<span className={css.date}>{formatDate(episode.date)}</span>
											<span className={css.name}>{episode.name}</span>
										</span>
									</button>
								</li>
							)
						})}
					</ul>
				)}
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
								onClick={() => handlePick(episode)}
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
