# Bedrock Residences Frontend

React and Vite frontend for browsing Bedrock residences, booking apartments,
ordering guest services and managing a guest profile.

## Local setup

```bash
npm install
cp .env.example .env
npm run dev
```

The API base URL is configured with:

```bash
VITE_API_BASE_URL=https://api.bedrockresidences.com/api/v1
```

Keep `.env.example` in version control as deployment documentation. Real
credentials belong only in `.env`, which is ignored by git.

Firebase social sign-in is optional until the Firebase web app values and
Google/Apple providers are configured. The required variables are documented
in `.env.example`.

## Verification

```bash
npm run lint
npm run build
```

`public/_redirects` provides the Netlify SPA fallback. For Vercel or another
host, configure the equivalent fallback to `/index.html`.

## API audit

See [API_AUDIT.md](./API_AUDIT.md) for the frontend endpoint inventory and the
remaining backend confirmations.
