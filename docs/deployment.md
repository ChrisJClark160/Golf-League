# Deployment Guide — NAS Setup

Step-by-step for getting Phase 1 running on a Synology / QNAP / Unraid / any Docker-capable NAS, and pointing `golf.pibooks.me` at it.

## Prerequisites

- A NAS with Docker and Docker Compose installed
- Root or admin SSH access to the NAS
- Control over the DNS for `pibooks.me` (or whatever domain you're using)
- A home router you can configure port forwarding on
- A public IP address (most home broadband; check yours by visiting whatismyip.com)

If your public IP changes (most consumer broadband), you'll also need a way to update DNS dynamically. Cloudflare DNS + a script is the smoothest, but DuckDNS / No-IP also work.

---

## Step 1 — Get the files onto the NAS

**Option A — Direct copy.**

From your laptop's `C:\Users\chris\OneDrive\Documents\Code\golf-league`:
- Open File Explorer
- Connect to your NAS as a network drive (e.g. `\\NAS\docker\`)
- Copy the `golf-league` folder into the `docker` share

**Option B — GitHub.** Repo: `git@github.com:ChrisJClark160/Golf-League.git`

```bash
# On your laptop, from the golf-league folder
cd "C:\Users\chris\OneDrive\Documents\Code\golf-league"
git init
git branch -M main
git add .
git commit -m "Phase 1 foundation"
git remote add origin git@github.com:ChrisJClark160/Golf-League.git
git push -u origin main

# On the NAS, via SSH:
cd /volume1/docker
git clone git@github.com:ChrisJClark160/Golf-League.git golf-league
cd golf-league
```

**SSH key setup**: Both your laptop and the NAS need SSH keys registered on GitHub for `git@github.com:...` URLs to work.

On the NAS:
```bash
ssh-keygen -t ed25519 -C "nas"
cat ~/.ssh/id_ed25519.pub
```
Copy the output and add it at https://github.com/settings/keys.

On your laptop, if you don't already have an SSH key on GitHub, the laptop equivalent is:
```powershell
ssh-keygen -t ed25519 -C "laptop"
type %USERPROFILE%\.ssh\id_ed25519.pub
```

Or skip SSH entirely and use HTTPS:
```bash
git remote add origin https://github.com/ChrisJClark160/Golf-League.git
```
You'll be prompted for a personal access token instead of a password. Generate at https://github.com/settings/tokens — give it `repo` scope, save somewhere safe.

---

## Step 2 — DNS

Pick where you want this to live. Easiest is a subdomain of an existing domain you own.

For `golf.pibooks.me`:

1. Log into the DNS provider for `pibooks.me` (Cloudflare, Namecheap, Squarespace, etc.)
2. Add an A record:
   - Name: `golf`
   - Type: `A`
   - Value: your public IP (from whatismyip.com)
   - TTL: 5 minutes (low while testing, raise later)
3. Wait 1-2 minutes, then test: `nslookup golf.pibooks.me` from your laptop. Should return your home IP.

**If your IP is dynamic**, you'll want either:
- Cloudflare with a small script using their API to update the A record nightly (or whenever IP changes)
- A dynamic DNS service like DuckDNS or No-IP, then a CNAME from `golf.pibooks.me` to your DuckDNS hostname
- A NAS with built-in dynamic DNS (Synology supports several)

---

## Step 3 — Router port forwarding

You need ports 80 and 443 forwarded from the public internet to your NAS.

1. Log into your router (usually `192.168.1.1` or `192.168.0.1`)
2. Find the Port Forwarding / NAT section
3. Add two forwards to your NAS's local IP:
   - External port 80 → NAS IP port 80 (needed for Let's Encrypt's HTTP challenge)
   - External port 443 → NAS IP port 443 (HTTPS traffic)

Some routers call these "Virtual Server" or "NAT Rules". Same idea.

**Security note**: opening port 80 is fine since Caddy will only respond to HTTP-01 cert challenges; everything else is redirected to HTTPS.

---

## Step 4 — Configure secrets

On the NAS, from the project folder:

```bash
cp .env.example .env
```

Edit `.env` (use `nano`, `vim`, or your NAS's file editor):

```env
DOMAIN=golf.pibooks.me
TZ=Europe/London
```

For `ADMIN_BASIC_AUTH`, generate a password hash:

```bash
docker run --rm caddy:2-alpine caddy hash-password
# Type your password twice
# Copy the resulting hash (starts with $2a$)
```

Paste into `.env`. **Important**: when used inside docker-compose, dollar signs must be doubled. So if Caddy gave you `$2a$14$abcdef...`, paste it as `$$2a$$14$$abcdef...`. Caddy then sees the original single-dollar string.

---

## Step 5 — First boot

```bash
cd /volume1/docker/golf-league
docker compose pull
docker compose up -d
```

Watch the logs to verify Caddy gets its cert (this takes 30-60 seconds the first time):

```bash
docker compose logs -f caddy
```

You should see lines like:
```
{"level":"info","msg":"certificate obtained successfully"}
```

If Caddy complains about port 80 / port 443 being unreachable, your port forwarding isn't right yet. Test from outside your network (use your phone on cellular data, not WiFi) by visiting `http://golf.pibooks.me/` — should redirect to HTTPS.

---

## Step 6 — Set up the PocketBase admin

1. Browse to `https://golf.pibooks.me/_/`
2. Caddy basic-auth prompts first. Username = `chris`, password = whatever you hashed in Step 4.
3. PocketBase shows its first-time setup screen. Create the superuser/admin account. Use a strong password and save it in your password manager.
4. After login, you should see the 10 collections listed:
   - `users`
   - `seasons`
   - `season_players`
   - `courses`
   - `rounds`
   - `matches`
   - `match_points`
   - `handicap_history`
   - `disputes`
   - `awards`

If any are missing, check `docker compose logs pocketbase` for migration errors.

---

## Step 7 — Smoke test

Browse to `https://golf.pibooks.me/`. You should see the Phase 1 placeholder landing page. After ~1 second, the second status dot should turn green ("PocketBase API: Healthy").

If both are green, the stack is alive end-to-end. Phase 1 acceptance criteria met.

---

## Step 8 — Backup drill

Don't skip this. Future-you will be grateful.

```bash
# Trigger a backup manually
docker compose exec backup /usr/local/bin/backup.sh

# Check the backup files exist
ls -lh backups/daily/
# Should see:  db-YYYY-MM-DD.sqlite.gz  and  uploads-YYYY-MM-DD.tar.gz

# Simulate restore (this WILL temporarily take the site down)
./scripts/restore.sh YYYY-MM-DD
# Follow the prompts, type RESTORE when asked

# Confirm site comes back up
curl -k https://golf.pibooks.me/api/health
```

If restore works, you're done with Phase 1.

---

## Troubleshooting

**Caddy can't get a cert.** Most common cause is port forwarding. Confirm your router forwards 80 AND 443. Confirm your public IP matches the DNS A record. Try `caddy reload` after fixes.

**Migrations didn't run.** Check `docker compose logs pocketbase`. Migration files should be auto-detected from `pocketbase/pb_migrations/`. If the volume mount didn't pick them up, restart the container after confirming the files are in the right place.

**PocketBase admin signup doesn't appear.** PocketBase requires the first admin to be created via the setup wizard on first boot. If you missed that, you can create one with:
```bash
docker compose exec pocketbase /usr/local/bin/pocketbase superuser create your@email.com yourpassword
```

**Domain doesn't resolve.** Check `nslookup golf.pibooks.me`. If it returns nothing or the wrong IP, DNS isn't right yet. DNS propagation usually takes minutes but can take up to an hour.

**Frontend shows but API status red.** Caddy is fine, PocketBase is the issue. Check `docker compose logs pocketbase`.

---

## Updating later

When you make changes locally (or pull new code):

```bash
# On NAS:
cd /volume1/docker/golf-league
git pull   # if using GitHub
# OR copy new files from laptop

docker compose up -d --build   # rebuilds frontend if Dockerfile changed
docker compose restart caddy   # if Caddyfile changed
```

PocketBase migrations run automatically on container start, so new collections will appear automatically next boot.

---

## What you're ready for next

Phase 2 — read-only league. This involves writing the actual frontend pages that pull data from the PocketBase API and render the league table, player list, and match history. The placeholder landing page gets replaced with the real app, but everything else stays the same.
