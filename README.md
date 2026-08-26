<img src="./logos/logo.png" width="120" height="120" alt="" />

# NTS Desktop

[![CI/CD](https://github.com/ghetoblues/nts-desktop/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/ghetoblues/nts-desktop/actions/workflows/ci-cd.yml)

A menubar player for [NTS Radio](https://www.nts.live) — the two live channels
and the archive — built in Electron.

> **This is a fork** of [romeovs/nts-desktop](https://github.com/romeovs/nts-desktop)
> by Romeo Van Snick, kept under the same MIT licence. It is not affiliated with
> or endorsed by NTS Radio.

## What this fork changes

- **Live playback works again.** NTS moved its streams to radiomast, and the
  app's content policy still named the old host, so every channel failed the
  moment you pressed play ([#31](https://github.com/romeovs/nts-desktop/issues/31),
  [#32](https://github.com/romeovs/nts-desktop/issues/32)).
- **Tracklist entries open in Apple Music.** Each track gets a button that
  resolves it against the store and opens the Music app, falling back to a
  search when a set lists a track as `ID` or the record is not there.
- **Favourites live in the window.** Save whatever is on air with the heart on a
  live channel, and browse what you saved from the archive screen — the app
  loads the latest episode in place instead of sending you to a browser.
- **Pause is where you can reach it.** The archive screen's play button sat
  below a full-height image; it now lives in the header, like the channels.
- **Paste a link to load a show,** rather than picking a `.webloc` file almost
  nobody keeps on disk. The clipboard is offered when it already holds one.
- **No keychain prompt on every launch.** Credentials are read when the
  tracklist needs them, not at boot.
- **It builds from a fresh clone.** The Firebase config for the live tracklist
  was encrypted in the repository, so only the maintainer could build the app.
- Buttons that only led out of the app — the Discord link, the live tracklist
  link — are gone.

## Usage

- Click the NTS logo in the menubar to open the player.
- Left and right buttons, or the arrow keys, move between the channels and the
  archive.
- Click the channel number, or press space, to play and pause. `1` and `2` play
  the corresponding channel.
- The heart saves the show on air to your NTS favourites; press it again to
  remove it. The archive screen lists what you saved.
- Drop a link to an archive show on the menubar icon, or use **Load Archive
  Show…** from the menu and paste it. `.webloc` files work too.
- On the archive screen, scroll down for the seek bar and the tracklist.
- Click a track to copy it, or the note beside it to open it in Apple Music.
- `-` and `+`, or the up and down arrows, control the volume.
- `?` shows the shortcuts, `⌘R` reloads, `⌘Q` quits, `ctrl + N` opens the app.

The live tracklist is only available to [NTS Supporters](https://www.nts.live/supporters)
and needs you to sign in from the menu; everything else works without an account.

## Installation

Grab the `.dmg` from the [releases page](https://github.com/ghetoblues/nts-desktop/releases),
open it, and drag **NTS Desktop** to Applications.

The app is not signed — that needs a paid Apple Developer account — so the first
launch is refused. Open it anyway with:

```
System Settings > Privacy & Security > Open Anyway
```

Only macOS is tested. The app should mostly work elsewhere, and patches to make
it properly work are welcome.

## Development

```
make dev        # run it, with the renderer reloading on save
make check      # lint, formatting and types
make build app  # bundle to bundle/mac-universal/NTS Desktop.app
make help       # every rule
```

The tree is laid out as:

```
./
  app/        # electron main process
    main.ts   # entry point
    preload.js
  client/     # renderer
    main.tsx
  lib/        # shared between the two
  scripts/    # build-time helpers
```

Changes under `client/` take effect on save. Changes to the main process need a
restart.

The renderer is served by Vite on port 5173; set `NTS_DEV_PORT` if that is
taken, and both sides will follow. `NTS_OPEN_SHOW` loads an episode at startup,
which saves dragging a link in every time you touch the archive screen.

### The Firebase config

The live tracklist reads from the Firebase project behind NTS. That config is
public — NTS serves it to every visitor of nts.live — so `scripts/firebase-config.mjs`
recovers it from their frontend bundle into `.env`, which the build does for you
whenever `.env` is missing. `make env` refreshes it. Without it everything works
except the live tracklist.

### Signing in while developing

Reading the tracklist and writing favourites need an NTS Supporter account. A
packaged build keeps those credentials in the keychain, but development builds
are unsigned, so macOS would ask to authorise the keychain on every rebuild.
`make dev` therefore runs with a mock keychain — put `NTS_EMAIL` and
`NTS_PASSWORD` in `.env` instead. See `.env.example`.

## Acknowledgement

Everything here rests on [nts-desktop](https://github.com/romeovs/nts-desktop)
by Romeo Van Snick, which in turn credits
[nts-desktop-app](https://github.com/tedigc/nts-desktop-app) by tedigc for the
original idea.
