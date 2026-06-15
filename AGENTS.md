# AGENTS.md — ETF Tower GitHub Prototype

Codex must follow this file for all work in this repository.

## Mission

Build **ETF Tower**, a modern, static, GitHub-deployable ETF Daily Control Tower for US/HK/CN ETF monitoring.

ETF Tower is a fast internal decision-support prototype for ETF managers. It converts daily ETF metrics, public/research data snapshots, corporate-action/events, rule breaches, workflow tickets, evidence, and deterministic copilot summaries into a concise operating cockpit.

This prototype is **not** a trading system, NAV system, PCF production system, compliance guarantee system, regulatory filing system, client-reporting system, market-data redistribution platform, or investment-advice product.

## Implementation target

Use a GitHub-first static architecture:

- Next.js App Router + TypeScript
- Tailwind CSS + shadcn/ui
- Static export to `out/`
- Static JSON snapshots under `public/data/`
- Python scripts for ingestion stubs, metric generation, rule evaluation, and snapshot building
- GitHub Actions for daily/weekday snapshot update and GitHub Pages deployment
- No always-on backend for the prototype
- No private or licensed vendor data in public artifacts
- No secrets in source code, static JSON, GitHub Pages, browser bundles, logs, or committed files

Do **not** use Streamlit in this version.

## Required technology choices

Use:

- Node.js 20+
- pnpm
- Next.js + React + TypeScript
- Tailwind CSS
- shadcn/ui components
- lucide-react icons
- TanStack Table for dense ETF grids
- Recharts or Apache ECharts for charts
- Python 3.11+ for snapshot/rules/backtest scripts
- pandas, pyarrow, pydantic, pyyaml for Python processing
- pytest for Python tests

## Product principles

1. **Triage first**: the homepage must answer “what needs attention today?” in under five seconds.
2. **Dense but calm**: compact financial tables, small badges, clear hierarchy, minimal decoration.
3. **One-screen workflow**: clicking an ETF row opens a right-side detail drawer with metrics, rule breaches, evidence, and tickets.
4. **Evidence-first**: every rule breach, ticket, and copilot claim must reference evidence IDs and source tags.
5. **Fast static UX**: precompute metrics, rule breaches, health scores, and backtest summaries into JSON; avoid heavy analytics in the browser.
6. **Keyboard efficient**: include command/search affordances such as Cmd/Ctrl+K, `/` focus search, Esc close drawer.
7. **Status semantics only**: use green, yellow, red, grey, and blue statuses.
8. **No hidden data assumptions**: missing, stale, mock, research-only, or placeholder data must be visible in the UI.

## Required repository structure

Create and maintain:

```text
app/
  layout.tsx
  page.tsx
  etf/[ticker]/page.tsx
  events/page.tsx
  rules/page.tsx
  backtest/page.tsx
  data-quality/page.tsx
components/
  shell/
    AppShell.tsx
    TopCommandBar.tsx
    SideNav.tsx
    StatusStrip.tsx
  control-tower/
    HealthKpiCards.tsx
    ETFHealthTable.tsx
    EventInboxPreview.tsx
    TicketQueue.tsx
  etf/
    ETFDetailDrawer.tsx
    ETFHeader.tsx
    HealthBadge.tsx
    MetricCard.tsx
    EvidencePopover.tsx
  charts/
    PriceNavChart.tsx
    TrackingDiffChart.tsx
    PremiumDiscountChart.tsx
    VolumeSpreadChart.tsx
  workflow/
    TicketCard.tsx
    RuleBreachTimeline.tsx
  copilot/
    CopilotPanel.tsx
  ui/
lib/
  data.ts
  types.ts
  health.ts
  formatting.ts
  routes.ts
public/
  data/
    latest.json
    manifest.json
    snapshots/
      YYYY-MM-DD.json
scripts/
  build_snapshot.py
  ingest_public.py
  run_rules.py
  build_backtest.py
  schemas.py
  requirements.txt
rules/
  rules.yml
.github/
  workflows/
    daily-update.yml
README.md
docs/
  ETF_TOWER_GITHUB_WORKDOC.md
```

## Data policy

Every data item must carry a source tag:

```text
mock_seed
public_official
open_source_research
licensed_vendor_placeholder
internal_placeholder
unknown_license
```

Use only seed/public/research-safe data in GitHub Pages. Do not include Wind, Bloomberg, LSEG, FactSet, ICE, MSCI, S&P, exchange real-time data, private holdings, internal NAV, private PCF, AP/market-maker information, client information, or API keys unless the user explicitly provides license-compatible files and an internal/private deployment target.

The public UI must show this disclaimer:

```text
Prototype only. Demo/research data may be delayed, incomplete, synthetic, or not licensed for production use. Not investment advice. Not for trading, regulatory disclosure, client reporting, redistribution, or NAV/PCF production.
```

## Snapshot contract

The app must load `public/data/latest.json` and use `manifest.json` for snapshot history.

Minimum `latest.json` shape:

```json
{
  "as_of": "YYYY-MM-DD",
  "generated_at": "ISO-8601",
  "environment": "demo",
  "data_disclaimer": "Prototype only...",
  "source_warnings": [],
  "etfs": [],
  "metrics": [],
  "health_pillars": [],
  "events": [],
  "rule_breaches": [],
  "tickets": [],
  "evidence": [],
  "data_sources": [],
  "time_series": {},
  "backtests": [],
  "copilot_summaries": []
}
```

Use TypeScript types in `lib/types.ts` that mirror Python Pydantic schemas in `scripts/schemas.py`.

## Required calculations

Compute in Python snapshot generation, not in the browser:

- ETF daily return
- benchmark/proxy daily return
- tracking difference in bps
- premium/discount in bps
- bid-ask spread in bps
- volume ratio vs 20-day average
- realized volatility 20-day
- volatility z-score
- open corporate-action count affecting ETF holdings
- PCF age in days
- missing critical field count
- health pillar scores
- overall ETF health score and status
- active rule breaches
- idempotent workflow tickets
- deterministic copilot summaries

## Required UI pages

### Control Tower `/`

Must include:

- Top command bar: app name, as-of date, command/search placeholder, update status, data mode badge.
- Status strip: US/HK/CN freshness, last update, source warnings.
- KPI cards: ETFs monitored, red ETFs, yellow ETFs, open tickets, unresolved events, data-quality gaps.
- ETF health table.
- Right-side ETF detail drawer on row click.
- Event inbox preview.
- Ticket queue preview.
- Copilot panel with deterministic summary.

ETF table columns:

```text
Status | ETF | Name | Region | AUM | Return | Benchmark | Tracking bps | P/D bps | Spread bps | Volume vs 20d | Vol z | CA | Tickets | Primary reason | Updated
```

### ETF detail `/etf/[ticker]` and drawer

Must include:

- ETF header and metadata
- primary reason
- six health pillars: Performance, Tracking, Premium/Discount, Liquidity, Operations, Data Quality
- price vs NAV chart
- tracking difference chart
- premium/discount chart
- volume/spread chart
- related events and corporate actions
- rule breaches
- workflow tickets
- evidence list
- deterministic copilot summary

### Event Inbox `/events`

Must show:

```text
Event → Entity → Impacted ETF → Exposure → Rule Trigger → Suggested Workflow → Ticket Status
```

### Rules & Workflow `/rules`

Must include:

- rule catalog from `rules/rules.yml`
- current breaches
- ticket board
- owner/SLA placeholders
- evidence links
- resolution status

### Backtest Lab `/backtest`

Must show precomputed rule-replay summaries from `latest.json.backtests`.

### Data Quality `/data-quality`

Must show source registry, source tags, license notes, last retrieved time, stale fields, missing critical fields, evidence table, snapshot manifest, and warnings.

## Rules

Create `rules/rules.yml` with at least:

- `TRACKING_DIFF_WARN`: `abs(tracking_diff_bps) > 50`, yellow, PM
- `TRACKING_DIFF_RED`: `abs(tracking_diff_bps) > 100`, red, PM
- `PREMIUM_DISCOUNT_WARN`: `abs(premium_discount_bps) > 75`, yellow, Capital Markets
- `SPREAD_WIDE`: `spread_bps > 30`, yellow, Capital Markets
- `VOLUME_LOW`: `volume_ratio_20d < 0.5`, yellow, Capital Markets
- `VOLATILITY_HIGH`: `realized_vol_zscore > 2.0`, yellow, Risk
- `CORPORATE_ACTION_UNRESOLVED`: `open_ca_count > 0`, red, Ops
- `PCF_STALE`: `pcf_age_days > 0`, red, Ops
- `DATA_QUALITY_GAP`: `missing_critical_fields > 0`, grey, Data

Every rule breach must create exactly one idempotent ticket per `as_of + ticker + rule_id`.

## Health scoring

Use precedence:

```text
red > grey critical missing > yellow > blue > green
```

Suggested score logic:

```text
start = 100
red breach: -30 each
yellow breach: -12 each
grey data gap: -20 each
blue waiting confirmation: -8 each
cap min 0 max 100
```

## Deterministic Copilot

Do not call an LLM API in the public GitHub prototype. Generate deterministic summaries from metrics, breaches, tickets, and evidence.

Copilot must display:

```text
Internal draft · evidence-based · prototype only
```

Copilot must not output buy/sell recommendations, final rebalance decisions, client-facing disclosures, or guaranteed compliance conclusions.

## Python scripts

Create:

- `scripts/schemas.py`: Pydantic models mirroring `lib/types.ts`.
- `scripts/ingest_public.py`: seed/public-safe ingestion stubs; failures become warnings, not hard failures.
- `scripts/run_rules.py`: YAML rule evaluator and ticket generator.
- `scripts/build_backtest.py`: deterministic rule replay summaries.
- `scripts/build_snapshot.py`: CLI that writes `latest.json`, `manifest.json`, and `snapshots/YYYY-MM-DD.json`.
- `scripts/requirements.txt`: pandas, pyarrow, pydantic, pyyaml, python-dateutil, pytest.

Required CLI:

```bash
python scripts/build_snapshot.py --as-of today --output public/data
python scripts/build_snapshot.py --as-of 2026-06-14 --output public/data
```

## GitHub Actions

Add `.github/workflows/daily-update.yml` that:

1. runs on `workflow_dispatch`, push to `main`, and weekday schedules;
2. sets up Python;
3. installs `scripts/requirements.txt`;
4. runs `python scripts/build_snapshot.py --as-of today --output public/data`;
5. commits updated snapshots only for scheduled/manual runs;
6. sets up pnpm and Node;
7. installs dependencies;
8. lints;
9. builds static site;
10. uploads `./out` to GitHub Pages;
11. deploys with `actions/deploy-pages`.

The workflow must not require private secrets.

## Build commands

The repo must support:

```bash
pnpm install
python -m pip install -r scripts/requirements.txt
python scripts/build_snapshot.py --as-of today --output public/data
pnpm dev
pnpm lint
pnpm build
pytest
```

`pnpm build` must create `out/`.

## Testing requirements

Add Python tests for:

- schema validation
- metric formulas
- rule trigger logic
- health score mapping
- idempotent ticket generation
- snapshot writing

Keep UI testing lightweight unless needed.

## Coding style

- Keep data/metrics/rules logic in Python.
- Keep browser analytics light; UI should mostly render precomputed JSON.
- Keep components small and typed.
- Do not introduce an always-on backend.
- Do not put secrets or vendor data in `public/`.
- Use deterministic seed data for stable tests.
- Show data limitations, stale data, and source warnings in the UI.

## Implementation order

1. Scaffold Next.js, TypeScript, Tailwind, shadcn/ui, static export, README.
2. Create seed `latest.json` and build the Control Tower homepage.
3. Add ETF detail drawer and basic detail route.
4. Add Python schemas, snapshot script, YAML rules, and ticket generation.
5. Add Events, Rules, Backtest, and Data Quality pages.
6. Add charts from static time series.
7. Add GitHub Actions Pages deployment.
8. Add tests and UI polish.

## Product language constraints

Use conservative language:

- “monitoring” not “guaranteed risk control”
- “copilot draft” not “automated investment decision”
- “benchmark proxy” not “official benchmark” unless licensed
- “demo/research data” not “production golden source”
- “recommended review action” not “required trade”

## Done definition

The prototype is done when:

1. Repo can be cloned and run from scratch.
2. `pnpm install` succeeds.
3. `python -m pip install -r scripts/requirements.txt` succeeds.
4. `python scripts/build_snapshot.py --as-of today --output public/data` succeeds.
5. `pnpm lint` succeeds.
6. `pnpm build` creates `out/`.
7. Homepage loads `public/data/latest.json`.
8. ETF health table has US/HK/CN demo ETF rows.
9. Clicking an ETF row opens the detail drawer.
10. At least one ETF is red, one yellow, and one green.
11. At least one corporate-action event exists.
12. At least one rule breach exists.
13. At least one open ticket exists.
14. Every ticket has evidence IDs.
15. Data Quality page shows source registry and disclaimers.
16. GitHub Actions workflow can run manually.
17. GitHub Pages can deploy the static site.
18. Repo contains no Streamlit dependency or Streamlit backup route.
19. Repo contains no real vendor data or secrets.
