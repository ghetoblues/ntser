<img src="./screens/icon.png" width="144" height="144" />

# NTS Desktop

[![CI/CD](https://github.com/romeovs/nts-desktop/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/romeovs/nts-desktop/actions/workflows/ci-cd.yml)

An unofficial desktop app for NTS built in Electron.

## Usage

- Click the NTS logo in the menubar to open the player.
- Use the left and right buttons on the player to navigate between channels. You
  can also use the arrow keys.
- Click the play/stop button on the live streams to play them. Spacebar works
  too.
- On the live streams click the tracklist button in to top right corner to open
  the live tracklist in the browser. (This will only work if you are an [NTS
  Supporter](https://www.nts.live/supporters)).
- Drop the link from the browser to an archive show on the menubar icon to play
  it, `.webloc` files work too.
- On the archive screen, you can scroll down to reveal the controls and
  tracklist.
- Click on a tracklist item to copy the information.
- Press `⌘Q` when the window is open.
- You can refresh the app with `⌘R`
- `ctrl + N` will open NTS Desktop
- Pressing `T` when the window is open will open the tracklist
- Pressing `C` when the window is open will open the chat window for that
  channel
- Pressing `1` or `2` when the window is open will start playing the
  corresponding channel
- Pressing `-` and `+` will control the volume of the player

<img src="./screens/rec1.gif" width="400" />
<img src="./screens/rec2.gif" width="400" />
<img src="./screens/rec3.gif" width="400" />

## Installation

Go to the [Releases Page](https://github.com/romeovs/nts-desktop/releases) and
fetch the `.dmg` file from the latest release.

Open the disk image and drag the `NTS Desktop` app to `Applications` and open
it.

The first time you open the app, it will show an erro because the app isn't
signed. I do not have a Mac Developer license.

To open the app anyway, you can:

```
System Preferences > Security & Privacy > General > Open Anyway
```

I have only tested this app on macOS, so I can't guarantee it works on Linux or
Windows. If people want to help me port it over, shoot me a message, PR's are welcome!

## Local Development

The project is structured as follows:

```
./
  app/          # The electron main process
    main.ts     # Entry point
    preload.js  # A setup file for the browser context
  client/       # The electron renderer files
    main.tsx
    ...
  lib/          # Code shared between the two
```

To start the app in developement mode, run:

```
make dev
```

The renderer is served by Vite on port 5173. Set `NTS_DEV_PORT` if that port is
taken; both Vite and Electron read it.

The live tracklist talks to the Firebase project behind NTS. Its config is
public — NTS serves it to every visitor of nts.live — so `make env` recovers it
straight from their frontend bundle into `.env`, which the build does for you
when `.env` is missing. Without it everything works except the live tracklist.

Reading the tracklist itself needs an NTS Supporter account. A packaged build
keeps those credentials in the keychain, but development builds are unsigned, so
macOS would ask to authorise the keychain on every rebuild. `make dev` therefore
runs with a mock keychain; put `NTS_EMAIL` and `NTS_PASSWORD` in `.env` if you
want the live tracklist while developing.

You can now start editing the renderer files, changes will automatically
take effect on save.

Note that changes to the main process (`app/main.ts` and `app/preload.js`)
require a restart to take effect.

To build the application run:

```
make build app
```

The app will now be in `bundle/mac-universal/NTS Desktop.app`.

## Acknowledgement

The main idea for the app came from the excellent
[nts-desktop-app](https://github.com/tedigc/nts-desktop-app), the implementation
of which is way simpler and more elegant, but lacks some of the features I
wanted.
