# portname

> Local dev proxy that turns `localhost:3000` into `myapp.localhost:1999`

No config. No port juggling. Just named URLs for every dev server you run.

---

## What it does

```bash
# instead of this
npm run dev  →  http://localhost:3000

# you get this
portname run dev  →  http://myapp.localhost:1999
```

portname auto-detects your framework, auto-configures it, and gives every project a stable named URL. Multiple projects run at the same time without port conflicts — if your default port is taken, portname finds the next free one automatically.

---

## Install

Download a binary from [Releases](https://github.com/hirendhola/portname/releases) — no Node or Bun required.

**Mac / Linux:**
```bash
curl -fsSL https://raw.githubusercontent.com/hirendhola/portname/main/install.sh | sh
```

**Windows:** download `portname-windows.exe` from Releases and add it to your PATH.

---

## Usage

```bash
# Run your dev server through portname (auto-detects everything)
portname run dev

# Custom name
portname run dev --name myapp

# Custom port
portname run dev --name myapp --port 3000

# Manage the proxy daemon
portname start     # start proxy in background
portname stop      # stop proxy
portname status    # check if running

# Manage apps manually
portname register myapp 3000    # point myapp.localhost:1999 → localhost:3000
portname unregister myapp       # remove
portname list                   # show all registered apps
portname open myapp             # open in browser
```

---

## Framework support

| Framework  | Auto-detected | Auto-configured | Default port |
|------------|:-------------:|:---------------:|:------------:|
| Vite       | ✓             | ✓               | 5173         |
| Next.js    | ✓             | ✓               | 3000         |
| Nuxt       | ✓             | -               | 3000         |
| SvelteKit  | ✓             | ✓               | 5173         |
| Remix      | ✓             | -               | 3000         |
| Angular    | ✓             | -               | 4200         |
| Any other  | -             | -               | 3000         |

Auto-configured means portname patches the framework config to allow the portname hostname. It cleans up after itself when you stop.

---

## How it works

```
Browser → myapp.localhost:1999
  → portname proxy reads Host header → "myapp"
  → looks up port in ~/.portname/routes.json → 3000
  → forwards request to localhost:3000
  → returns response
Browser renders your app
```

WebSocket (HMR) is proxied too — live reload works normally.

---

## Why not just use localhost:PORT

- Two projects clash on the same port — portname auto-assigns a free one
- Cookies set on `localhost` bleed across every app — named subdomains fix this
- Browser history is a mess of ports
- Named URLs are easier to remember

---

## License

MIT — free to use in personal and commercial projects. No permission needed.

---

## Contributing

PRs welcome. Open an issue first for big changes.

```bash
git clone https://github.com/hirendhola/portname
cd portname
bun install
bun index.ts --help
```