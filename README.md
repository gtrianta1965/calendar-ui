# Calendar UI (public)

The static front end of the calendar app: `index.html`, `css/styles.css` and `src/` (plain scripts and JSX, no
bundler; React, ReactDOM and Babel load from cdnjs — see [index.html](index.html)). `calendar.html` is the same
app as one generated file, for a host where a single file is easier to serve (open it or `index.html`, both work
the same way).

`src/config.js` holds the API's address (`API_BASE_URL`) and a couple of small UI choices (`HOUR_OPTIONS`,
`DEFAULT_HOURS`). Sign in with an account of that API.

This repo is public **on purpose**, so it can be served by GitHub Pages (Pages needs a public repo, unless your
GitHub plan allows private-repo Pages). It is a copy of the UI files from a separate, private repository that also
holds the backend, the database and the Oracle/ORDS code; that repo's history and everything backend-related stay
out of this one.

## Serving it

Opening a file directly (`file://`) does not work: the browser blocks both the in-browser Babel (for `index.html`)
and the API sign-in (for either file) from a `file://` page. Serve the folder instead:
- locally, with any static server, e.g. `python -m http.server`;
- on GitHub, with **Pages**: repo **Settings → Pages → Build and deployment → Source: Deploy from a branch →
  Branch: `main`, folder `/ (root)` → Save**. GitHub then serves this repo at
  `https://gtrianta1965.github.io/calendar-ui/index.html` (and `.../calendar.html`).

## Committing and pushing

This folder is its own git repository, separate from the private one the files were copied from — it does not
share history with it, so nothing from the private repo (including old commits) can leak through here.

**First time only** (already done once, kept here for reference):
```bash
cd C:\g30\python\calendar-ui
git init
git branch -M main
git remote add origin https://github.com/gtrianta1965/calendar-ui.git
```

**Whenever the UI changes** in the private repo and you want the published copy updated:

1. Copy the current files over (from `C:\g30\python\calendar`):
   ```bash
   cp C:\g30\python\calendar\index.html C:\g30\python\calendar\calendar.html C:\g30\python\calendar-ui\
   cp -r C:\g30\python\calendar\css C:\g30\python\calendar-ui\
   cp -r C:\g30\python\calendar\src C:\g30\python\calendar-ui\
   ```
2. Commit and push from this folder:
   ```bash
   cd C:\g30\python\calendar-ui
   git add -A
   git status          # check only UI files changed, nothing unexpected
   git commit -m "describe the UI change"
   git push
   ```

If `git remote -v` ever shows the wrong URL (for example after recreating the GitHub repo), fix it with
`git remote set-url origin https://github.com/gtrianta1965/calendar-ui.git` instead of `git remote add` (which
fails when `origin` already exists).

Pushing over HTTPS asks for GitHub credentials: use a
[personal access token](https://github.com/settings/tokens) as the password (GitHub no longer accepts your account
password), or sign in once with the [GitHub CLI](https://cli.github.com/) (`gh auth login`). Git Credential Manager
then remembers it, so later pushes don't ask again.

## What never goes in this repo

No backend code, no database file, no ORDS/Oracle scripts, and no password of any kind — `src/config.js` only
holds an API address and a couple of UI settings. If a future change to the private repo adds something sensitive
to these same files, check `git diff` in this folder before committing here.
