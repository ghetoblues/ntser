import classnames from "classnames"

import type { InfoState, ShowInfo } from "./lib/live"

import css from "./schedule.module.css"

type Props = {
	hide: boolean
	live: InfoState
	onHide: () => void
}

export function Schedule(props: Props) {
	const { hide, live, onHide } = props

	const channels: [1 | 2, ShowInfo[]][] = [
		[1, live.data?.channel1.upcoming ?? []],
		[2, live.data?.channel2.upcoming ?? []],
	]

	return (
		<div
			className={classnames(css.schedule, hide && css.hide)}
			onClick={onHide}
			aria-hidden={hide}
		>
			<div className={css.heading}>Up next</div>
			<div className={css.columns}>
				{channels.map(function ([channel, shows]) {
					return (
						<div key={channel} className={css.column}>
							<div className={css.channel}>Channel {channel}</div>
							{shows.length === 0 && <div className={css.empty}>—</div>}
							<ul className={css.list}>
								{shows.map(function (show) {
									return (
										<li key={show.episode || show.starts.toISOString()}>
											<span className={css.time}>{formatTime(show.starts)}</span>
											<span className={css.name}>{show.name}</span>
										</li>
									)
								})}
							</ul>
						</div>
					)
				})}
			</div>
		</div>
	)
}

function formatTime(date: Date): string {
	return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
}
