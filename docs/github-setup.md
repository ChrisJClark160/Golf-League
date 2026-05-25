# GitHub Setup Cheat Sheet

Quick reference for the first push and ongoing workflow. Full context is in `README.md` and `docs/deployment.md`.

## First push (run on your laptop, once)

```powershell
# From PowerShell or Command Prompt:
cd "C:\Users\chris\OneDrive\Documents\Code\golf-league"

# Initialise the repo
git init
git branch -M main

# Stage and commit
git add .
git commit -m "Phase 1: foundation (docker compose, caddy, pocketbase schema, frontend placeholder)"

# Link to GitHub
git remote add origin git@github.com:ChrisJClark160/Golf-League.git

# Push
git push -u origin main
```

If `git push` fails with an authentication error, see the SSH key section in `docs/deployment.md`, or switch to HTTPS:

```powershell
git remote set-url origin https://github.com/ChrisJClark160/Golf-League.git
git push -u origin main
```

## First clone on the NAS

```bash
ssh chris@nas-local-ip
cd /volume1/docker
git clone git@github.com:ChrisJClark160/Golf-League.git golf-league
cd golf-league
```

## Ongoing — edit on laptop, deploy on NAS

**Laptop:**
```powershell
# Make changes in VS Code or wherever
git add .
git commit -m "Phase 2: login page and league table"
git push
```

**NAS:**
```bash
cd /volume1/docker/golf-league
git pull
docker compose up -d --build
```

## What's tracked vs gitignored

| Tracked (committed) | Gitignored (local only) |
|---------------------|------------------------|
| `docker-compose.yml` | `.env` (secrets) |
| `Caddyfile` | `pocketbase/pb_data/` (database, uploads) |
| `pocketbase/pb_migrations/` | `backups/` (backup tarballs) |
| `pocketbase/pb_hooks/` (when added in Phase 4) | `caddy_data/`, `caddy_config/` |
| `frontend/` | `node_modules/`, `dist/`, etc. |
| `scripts/` | OS junk (`.DS_Store`, `Thumbs.db`) |
| `docs/`, `README.md` | Editor folders (`.idea`, `.vscode`) |

The `.env` file stays local on each machine. The hash in there is what proves you're the admin, so don't commit it.

## Branching strategy (suggestion)

For a 6-person friend project this is over-engineered, but worth mentioning:

- `main` — what's running on the NAS
- `dev` — what you're working on
- Merge `dev` → `main` when ready to deploy

For Season 0 just commit to `main` directly. Adopt branches later if it starts getting messy.

## Useful one-liners

```bash
# See what's changed
git status

# See unpushed commits
git log origin/main..main

# Undo last commit but keep changes
git reset --soft HEAD~1

# Discard local changes (CAREFUL)
git checkout -- .

# Pull and rebuild on NAS in one command
git pull && docker compose up -d --build
```

## If you accidentally commit a secret

Nuke it from history. The `.env` file should never be committed but mistakes happen.

```bash
# Remove file from current commit
git rm --cached .env
git commit -m "Remove accidentally-committed .env"

# If it's already in remote history, use git-filter-repo or BFG to scrub it
# Then rotate the secrets — assume they're compromised
```
