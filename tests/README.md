# Tests

## Mobile workbench regression

With a production server running (`pnpm build && pnpm start`), install both
browsers and run:

```sh
pnpm exec playwright install chromium webkit
pnpm test:mobile
```

Use production mode to avoid the development-only React Grab overlay intercepting
touch input. Set `TEST_BASE_URL` to use another server address.

## Body font size browser regression

```sh
pnpm test:font-size
```

## Preview browser smoke

```sh
pnpm test:preview
```

AI / PDF-import unit tests were removed in P0.
