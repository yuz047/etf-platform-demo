# ETF Tower

## What It Is

ETF Tower is a static GitHub-deployable ETF Daily Control Tower prototype for monitoring US/HK/CN demo ETFs, rule breaches, workflow tickets, evidence, and data-quality status.

## What It Is Not

Prototype only. Demo/research data may be delayed, incomplete, synthetic, or not licensed for production use. Not investment advice. Not for trading, regulatory disclosure, client reporting, redistribution, or NAV/PCF production.

It is not production trading, compliance, disclosure, NAV, PCF, market-data redistribution, broker, or client-reporting infrastructure.

## Stack

Next.js, TypeScript, Tailwind, shadcn/ui-style local components, TanStack Table, Recharts, Python snapshot scripts, GitHub Actions, and GitHub Pages.

## Local Setup

```bash
pnpm install
python -m pip install -r scripts/requirements.txt
python scripts/build_snapshot.py --as-of today --output public/data
pnpm dev
```

## Build

```bash
pnpm lint
pnpm build
pytest
```

`pnpm build` writes the static export to `out/`.

## Yahoo Test Feed

For local testing with a few US ETFs, generate a separate Yahoo-backed snapshot:

```bash
python scripts/build_snapshot.py --source yahoo_test --tickers SPY QQQ IWM --benchmark SPY --output public/data-yahoo-test
```

This path uses `yfinance` for research/testing only. It marks the source as `unknown_license`, sets redistribution to `false`, and includes warnings because Yahoo/yfinance data rights must be checked before any publication or redistribution.

## Deploy

GitHub Pages deploys through `.github/workflows/daily-update.yml`.

In GitHub, set Pages to:

```text
Settings -> Pages -> Build and deployment -> Source -> GitHub Actions
```

## Data Policy

Only seed/public/research-safe data belongs in public GitHub Pages. Do not commit secrets, real vendor data, private holdings, internal NAV/PCF, AP or market-maker information, client data, API keys, tokens, or database credentials.
