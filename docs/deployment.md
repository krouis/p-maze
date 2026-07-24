# Deployment & Publication Guide

This document explains how to deploy and publish **Pixel Maze (p-maze)** to GitHub Pages.

## Continuous Deployment Flow

We use GitHub Actions to automate builds and deployments. When code is merged to the default `main` branch, the following steps execute:

1. Quality checks (formatting, linting, type-checking).
2. Unit tests execution.
3. Production compilation (`npm run build`).
4. Playwright E2E browser checks.
5. Automatic deployment of compiled static files to GitHub Pages.

---

## Required Repository Configurations

To host the game on GitHub Pages, configure the following settings:

1. Go to your repository on GitHub.
2. Navigate to **Settings** -> **Pages**.
3. Under **Build and deployment** -> **Source**, select **GitHub Actions** (instead of Deploy from branch). This permits our automated workflow to push builds directly.

---

## Vite Base Path Configuration

GitHub Pages serves project sites under a subpath format:
`https://<github-username>.github.io/<repository-name>/`

For example, for username `krouis` and repository `p-maze`, the URL is:
`https://krouis.github.io/p-maze/`

To prevent asset loading errors under this subpath:

1. **Configurable Base**: In `vite.config.ts`, the base path is defined as `process.env.VITE_BASE || '/p-maze/'`.
2. **Dynamic Service Worker**: In `src/pwa/registerServiceWorker.ts`, the registration scope is dynamically set using `import.meta.env.BASE_URL` to match `/p-maze/` at runtime.

---

## Manual Deployment

To trigger a manual deployment without pushing code:

1. Go to the **Actions** tab in the GitHub repository.
2. Select the **Deploy to GitHub Pages** workflow in the left sidebar.
3. Click the **Run workflow** dropdown button, select branch `main`, and press **Run workflow**.

---

## Troubleshooting Stale Caches

Since the game is a progressive web app (PWA) that implements offline caching via a Service Worker:

- **Forcing Updates**: To refresh cache changes immediately, close all open tabs of the game, open a new tab, and click reload.
- **Hard Reload**: Press `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (macOS) to clear the active cache and fetch fresh production files.
