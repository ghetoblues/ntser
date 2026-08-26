import classnames from "classnames"
import { useCallback, useEffect, useState } from "react"

import { electron } from "./electron"
import { Logo } from "./logo"

import css from "./about.module.css"

const SOURCE = "https://github.com/romeovs/nts-desktop"
const FORK = "https://github.com/ghetoblues/nts-desktop"

type Props = {
	hide: boolean
	onHide: () => void
}

export function About(props: Props) {
	const { hide, onHide } = props

	const [version, setVersion] = useState("")

	useEffect(function () {
		electron
			.invoke("version")
			.then(setVersion)
			.catch(() => setVersion(""))
	}, [])

	const handleLink = useCallback(function (evt: React.MouseEvent, url: string) {
		// The click would otherwise close the panel out from under the link.
		evt.stopPropagation()
		electron.send("open-link", url)
	}, [])

	return (
		<div
			className={classnames(css.about, hide && css.hide)}
			onClick={onHide}
			aria-hidden={hide}
		>
			<div className={css.inner}>
				<Logo className={css.logo} />
				<div className={css.name}>NTS Desktop</div>
				{version && <div className={css.version}>Version {version}</div>}

				<p className={css.blurb}>
					An unofficial player for NTS Radio.
					<br />
					Not affiliated with or endorsed by NTS.
				</p>

				<p className={css.credit}>
					Original app by Romeo Van Snick
					<br />
					<button
						type="button"
						className={css.link}
						onClick={(evt) => handleLink(evt, SOURCE)}
					>
						github.com/romeovs/nts-desktop
					</button>
				</p>

				<p className={css.credit}>
					This build is a modified fork
					<br />
					<button
						type="button"
						className={css.link}
						onClick={(evt) => handleLink(evt, FORK)}
					>
						github.com/ghetoblues/nts-desktop
					</button>
				</p>

				<div className={css.licence}>MIT licensed · © 2022 Romeo Van Snick</div>
			</div>
		</div>
	)
}
