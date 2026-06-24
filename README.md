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

`public/_redirects` provides the Netlify SPA fallback. `public/.htaccess`
provides the Apache/cPanel SPA fallback so refreshed routes like `/profile`,
`/legal/privacy`, and apartment pages load `index.html` instead of a server
404.

For cPanel/Namecheap shared hosting:

1. Run `npm run build`.
2. Upload the contents of `dist/` into the domain's `public_html` folder.
3. Confirm `.htaccess` is included in `public_html`.
4. Set production environment variables before building, especially
   `VITE_API_BASE_URL=https://api.bedrockresidences.com/api/v1`.

## API audit

See [API_AUDIT.md](./API_AUDIT.md) for the frontend endpoint inventory and the
remaining backend confirmations.
