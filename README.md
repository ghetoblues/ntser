# NTSer

A menubar player for [NTS Radio](https://www.nts.live) — both live channels and
the archive. Electron, macOS.

A fork of [romeovs/nts-desktop](https://github.com/romeovs/nts-desktop) by Romeo
Van Snick, same MIT licence. Unofficial, not affiliated with NTS.

## What this fork changes

- Live playback works again — NTS moved its streams and the content policy still
  named the old host ([#31](https://github.com/romeovs/nts-desktop/issues/31),
  [#32](https://github.com/romeovs/nts-desktop/issues/32))
- Tracklist entries open in Apple Music
- Favourites live in the window: save what is on air, pick an episode, play it
- Pause moved to the show header, out from under the fold
- Load an archive show by pasting its link, not by picking a `.webloc` file
- No keychain prompt on every launch
- Builds from a fresh clone — the Firebase config used to be encrypted
- Current stack: Electron 44, React 19, Vite 8, Biome 2

## Install

Take the `.dmg` from [releases](https://github.com/ghetoblues/ntser/releases)
and drag the app to Applications. It is unsigned, so the first launch is refused
— allow it under `System Settings > Privacy & Security`.

## Use

| | |
|---|---|
| `←` `→` | move between channels and the archive |
| `space` | play and pause |
| `1` `2` | play a channel |
| `-` `+` | volume |
| `?` | shortcuts |
| `ctrl + N` | open the app |

The heart saves the show on air to your NTS favourites; the archive screen lists
what you saved. Drop a show link on the menubar icon, or paste one under **Load
Archive Show…**. Click a track to copy it, or the note beside it to open it in
Apple Music.

The live tracklist needs an [NTS Supporter](https://www.nts.live/supporters)
account, signed in from the menu. Everything else works without one.

## Develop

```sh
make dev    # run it, renderer reloads on save
make check  # lint, format, types
make app    # bundle to bundle/mac-universal
make help   # every rule
```

`app/` is the main process, `client/` the renderer, `lib/` what they share.
Renderer changes take effect on save; main process changes need a restart.

`NTS_DEV_PORT` moves Vite off 5173. `NTS_OPEN_SHOW` loads an episode at startup.

The live tracklist reads from NTS's Firebase project. That config is public, so
`scripts/firebase-config.mjs` recovers it from their frontend into `.env`, which
the build does whenever `.env` is missing. Signing in needs `NTS_EMAIL` and
`NTS_PASSWORD` in `.env` — development builds run with a mock keychain, so the
stored credentials are not available. See `.env.example`.

## Thanks

To Romeo Van Snick for the app, and to
[tedigc](https://github.com/tedigc/nts-desktop-app) for the idea it came from.
