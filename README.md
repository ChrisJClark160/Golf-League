# Friends Golf League

Self-hosted match play league for ~6-8 mates. Runs on a NAS, served at `golf.pibooks.me`. PocketBase + Caddy + a static frontend in Docker.

## Current status

**Phase 1 — Foundation.** The Docker stack, reverse proxy, HTTPS, database schema and a placeholder landing page. Everything is in place to bring up the infrastructure and confirm it works end-to-end. The actual app pages come in Phase 2.

## What's in this repo

```
golf-league/
├── docker-compose.yml          # 4 services: caddy, pocketbase, frontend, backup
├── Caddyfile                   # Reverse proxy + HTTPS config
├── .env.example                # Template for secrets — copy to .env
├── .gitignore                  # Keeps secrets, data, backups out of git
├── pocketbase/
│   ├── pb_data/                # Database, uploads (gitignored)
│   ├── pb_migrations/          # 10 collection definitions
│   └── pb_hooks/               # Reserved for Phase 4 rules engine
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── public/index.html       # Phase 1 placeholder landing
├── scripts/
│   ├── backup.sh               # Daily SQLite + uploads tar
│   └── restore.sh              # Drill this before launch
├── backups/                    # Backup tarballs (gitignored)
└── docs/
    └── deployment.md           # Step-by-step NAS deployment
```

## Quick start (on the NAS)

1. **Copy this folder to the NAS.** Two options:
   - Direct copy via SMB / SFTP to e.g. `/volume1/docker/golf-league/`
   - Push to GitHub from your laptop, then `git clone` on the NAS

2. **Configure secrets.** Copy `.env.example` to `.env` and fill in:
   - `DOMAIN` — your public domain (e.g. `golf.pibooks.me`)
   - `ADMIN_BASIC_AUTH` — generate with `docker run --rm caddy:2-alpine caddy hash-password`

3. **Set up DNS.** Point `golf.pibooks.me` (or whatever you chose) at your home public IP. Use a dynamic DNS updater if your IP changes.

4. **Port forward.** Open 443 (and 80 for Let's Encrypt) on your router to the NAS.

5. **Bring it up.**
   ```bash
   docker compose up -d
   ```

6. **First-time PocketBase setup.** Browse to `https://golf.pibooks.me/_/` — Caddy basic-auth prompts first (use the username you set in Caddyfile and the password you hashed). Then PocketBase admin sign-up. Create the admin account.

7. **Verify the migrations ran.** In PocketBase admin, you should see 10 collections: `users` (extended), `seasons`, `season_players`, `courses`, `rounds`, `matches`, `match_points`, `handicap_history`, `disputes`, `awards`.

8. **Smoke-test the frontend.** Browse to `https://golf.pibooks.me/` — you should see the Phase 1 landing page with green dots indicating both Caddy and PocketBase API are reachable.

## Phase 1 acceptance checklist

- [ ] Stack boots without errors (`docker compose ps` shows all 4 services healthy)
- [ ] `https://golf.pibooks.me/` loads with valid HTTPS (no cert warnings)
- [ ] `https://golf.pibooks.me/_/` prompts for Caddy basic-auth, then PocketBase admin
- [ ] All 10 collections visible in PocketBase admin
- [ ] You can manually create a season, a user, a course (data entry test)
- [ ] Backup script runs without error: `docker compose exec backup /usr/local/bin/backup.sh`
- [ ] Restore drill works: run `restore.sh` against a backup file

Once those are all green, you're ready for Phase 2.

## GitHub workflow

Repo: `git@github.com:ChrisJClark160/Golf-League.git`

**On your laptop (one-time setup):**

```bash
cd "C:\Users\chris\OneDrive\Documents\Code\golf-league"
git init
git branch -M main
git add .
git commit -m "Phase 1 foundation"
git remote add origin git@github.com:ChrisJClark160/Golf-League.git
git push -u origin main
```

**On the NAS (one-time setup):**

```bash
cd /volume1/docker
git clone git@github.com:ChrisJClark160/Golf-League.git golf-league
cd golf-league
# Continue with the deployment steps below
```

**Ongoing workflow:**

- Edit on your laptop → `git add . && git commit -m "..." && git push`
- On the NAS: `git pull && docker compose up -d --build`

The `.gitignore` is already set up to keep secrets, the database, and backups out of git. The `.env` file stays local on each machine and is never committed.

**SSH key setup:** Both your laptop and the NAS need SSH keys registered on GitHub for the `git@github.com:...` URL to work. On the NAS: `ssh-keygen -t ed25519 -C "nas"`, then add `~/.ssh/id_ed25519.pub` to your GitHub keys at https://github.com/settings/keys. If you'd rather use HTTPS (no SSH key needed but you'll be prompted for a personal access token), the URL is `https://github.com/ChrisJClark160/Golf-League.git`.

## What's next

| Phase | Effort | What it adds |
|-------|--------|--------------|
| 2 — Read-only league | 1 weekend | Login page, league table page, server-rendered HTML pulling from PocketBase |
| 3a — 1v1 submission | 2 weekends | Players submit and confirm their own matches |
| 3b — Group rounds | 1-1.5 weekends | 3-ball and 4-ball support with multiple matches per round |
| 4 — Rules engine + course API | 2-3 weekends | Auto handicap movement, bonuses, UK Golf Course API integration |
| 5 — Awards + launch | 1 weekend | Six awards, season lock, Season 0 starts |

See `docs/deployment.md` for the detailed NAS-specific instructions, and the parent build plan for the full design context.

## Tech stack

- **PocketBase** — Go binary, SQLite, REST API, auth, file storage, admin UI all in one
- **Caddy** — reverse proxy, automatic HTTPS via Let's Encrypt
- **Nginx** — serves the static frontend (will continue serving HTMX templates in later phases)
- **Alpine + cron** — daily backups
- **Docker Compose** — orchestrates the lot
