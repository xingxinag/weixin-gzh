# Deployment Guide

## Supported targets

- Vercel
- Cloudflare Pages
- Cloudflare Workers static assets + optional `/api/*` proxy
- GitHub Pages

## Build behavior

`vite.config.ts` now resolves `base` automatically:

- `PUBLIC_BASE_PATH` set: use that value
- `VERCEL`, `CF_PAGES`, `SERVER_ENV=NETLIFY`: use `/`
- `GITHUB_ACTIONS=true`: use `/<repo-name>/`
- otherwise: use `/`

## Vercel

### Dashboard deploy

1. Import the GitHub repository into Vercel.
2. Keep the default Vite build command: `npm run build`.
3. Keep the output directory: `dist`.
4. If needed, add `PUBLIC_BASE_PATH=/`.

### GitHub Actions deploy

Set these secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Workflow file: `.github/workflows/deploy-vercel.yml`

## Cloudflare Pages

### Dashboard deploy

1. Create a Pages project from this GitHub repository.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Environment variable: `PUBLIC_BASE_PATH=/`

### GitHub Actions deploy

Set these secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Optional repository variable:

- `CLOUDFLARE_PAGES_PROJECT`

Workflow file: `.github/workflows/deploy-pages.yml`

## Cloudflare Worker proxy mode

This project includes an optional Worker entry at `worker/index.ts`.

Purpose:

- serve the built SPA from `dist`
- proxy `/api/*` to your New API backend
- keep `NEWAPI_API_KEY` off the browser

### Required Worker secrets

- `NEWAPI_BASE_URL`
- `NEWAPI_API_KEY`

### Recommended frontend configuration

If you deploy the app and proxy on the same domain, set the app's API base URL to:

```text
https://your-domain.example.com/api
```

The frontend will then call:

- `/api/v1/models`
- `/api/v1/chat/completions`
- `/api/v1/embeddings`

and the Worker will forward them upstream with the server-side API key.

## GitHub Pages

Existing workflow: `.github/workflows/build.yml`

No extra config is required after the `base` change. The build will use `/<repo-name>/` automatically under GitHub Actions.
