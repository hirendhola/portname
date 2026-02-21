# Contributing to portname

## Setup

```bash
git clone https://github.com/hirendhola/portname
cd portname
bun install
bun index.ts --help
```

## Project structure

```
portname/
├── index.ts          # CLI entrypoint — all commands
├── src/
│   ├── proxy.ts      # HTTP + WebSocket reverse proxy
│   ├── registry.ts   # name→port mapping (~/.portname/routes.json)
│   ├── daemon.ts     # background process management
│   ├── detect.ts     # framework + package manager detection
│   ├── patcher.ts    # auto-configure framework configs
│   └── run.ts        # portname run — connects everything
├── .github/
│   └── workflows/
│       └── release.yml
├── README.md
└── LICENSE
```

## How to add a new framework

1. Add it to the `Framework` type in `src/detect.ts`
2. Add detection logic in `detect()` — check for the framework's package name in deps
3. Add default port
4. Add a patch function in `src/patcher.ts` if the framework blocks unknown hosts
5. Wire it into the `patch()` switch statement

## Releasing

Push a tag — GitHub Actions handles the rest:

```bash
git tag v0.1.0
git push origin v0.1.0
```

This builds binaries for all platforms and creates a GitHub release automatically.
