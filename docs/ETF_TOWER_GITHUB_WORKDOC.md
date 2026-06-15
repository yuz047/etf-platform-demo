# ETF Tower — GitHub Prototype 工作文档

版本：v0.2 GitHub Static Prototype  
目标读者：Founder / PM / Designer / Codex / 前端工程 / 数据工程  
实现方式：Next.js 静态站点 + Python 快照生成 + GitHub Actions 每日更新 + GitHub Pages 部署  
状态：可直接作为 repo 的 `docs/ETF_TOWER_GITHUB_WORKDOC.md` 使用

---

## 0. 一句话产品定义

**ETF Tower 是一个面向 ETF manager 的 Daily Control Tower。**  
它每天把 ETF 指标、陆港美公开/研究数据、事件、corporate actions、PCF/holding 检查、规则触发、workflow ticket 和 evidence 放进一个现代、紧凑、可追溯的操作台。

第一版目标不是生产交易，也不是生产级合规系统，而是做出一个可展示、可部署、可每日自动更新的 **read-only decision-support prototype**。

---

## 1. 当前版本范围

### 1.1 要做什么

第一版 GitHub prototype 必须做到：

```text
Data snapshot → rule evaluation → health scoring → workflow tickets → static UI → daily GitHub deployment
```

具体包括：

1. 一个现代化 ETF Control Tower 首页。
2. ETF 行级健康状态：green / yellow / red / grey / blue。
3. 陆港美三地 ETF 的 demo universe。
4. 静态 JSON 数据快照：`public/data/latest.json`。
5. Python 脚本每日生成快照。
6. YAML 规则引擎。
7. 规则触发后自动生成 workflow ticket。
8. 每个指标、规则、ticket 都绑定 evidence ID。
9. 右侧 drawer 快速查看 ETF 详情。
10. Event Inbox、Rules & Workflow、Backtest Lab、Data Quality 页面。
11. GitHub Actions 自动更新数据并部署到 GitHub Pages。
12. 无 Wind/Bloomberg 真实数据、无内部数据、无 secrets。

### 1.2 不做什么

第一版不做：

```text
交易执行
自动调仓
真实 OMS/PMS 对接
真实 AP/market-maker workflow
真实 NAV/PCF 生产
正式监管披露发布
客户报告分发
Wind/Bloomberg/LSEG/FactSet 等授权数据接入
实时行情 redisplay
用户登录/RBAC
数据库服务
LLM 实时调用
```

这些全部保留为生产版路线。

---

## 2. 架构选择

### 2.1 为什么采用 GitHub static prototype

第一版要服务两个目的：

1. 快速展示产品想法。
2. 让 Codex 能够从文档直接完成完整 repo。

所以采用：

```text
Next.js + TypeScript + Tailwind + shadcn/ui
Python snapshot scripts
Static JSON under public/data
GitHub Actions scheduled update
GitHub Pages static hosting
```

这样不需要后端服务器，也不需要数据库部署，适合 demo、投资人展示、内部沟通和产品验证。

### 2.2 高层架构图

```text
┌──────────────────────────────────────────────────────────────┐
│ Seed / Public / Research-Safe Data                            │
│ - mock ETF universe                                            │
│ - public official placeholders                                 │
│ - open-source research placeholders                            │
└───────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────┐
│ Python Data Pipeline                                           │
│ scripts/ingest_public.py                                       │
│ scripts/run_rules.py                                           │
│ scripts/build_backtest.py                                      │
│ scripts/build_snapshot.py                                      │
└───────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────┐
│ Static Snapshot                                                │
│ public/data/latest.json                                        │
│ public/data/manifest.json                                      │
│ public/data/snapshots/YYYY-MM-DD.json                          │
└───────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────┐
│ Next.js Static UI                                              │
│ Control Tower / ETF Detail / Events / Rules / Backtest / DQ    │
└───────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────┐
│ GitHub Actions + GitHub Pages                                  │
│ Daily update → build → upload artifact → deploy                │
└──────────────────────────────────────────────────────────────┘
```

### 2.3 未来生产版替换点

静态 prototype 未来可以平滑升级：

```text
Static latest.json
  → API backend
  → Postgres/Timescale golden source
  → Wind/Bloomberg/vendor adapters
  → entitlement controls
  → RBAC + audit log
  → authenticated internal deployment
  → LLM evidence service
  → workflow approvals
```

第一版代码要预留 adapter 边界，但不要引入生产复杂度。

---

## 3. Repo 结构

Codex 应创建如下结构：

```text
etf-tower/
  AGENTS.md
  README.md
  package.json
  pnpm-lock.yaml
  next.config.mjs
  tsconfig.json
  tailwind.config.ts
  postcss.config.mjs
  components.json
  app/
    layout.tsx
    page.tsx
    globals.css
    etf/
      [ticker]/
        page.tsx
    events/
      page.tsx
    rules/
      page.tsx
    backtest/
      page.tsx
    data-quality/
      page.tsx
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
      # shadcn/ui generated components
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
        2026-06-14.json
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
  docs/
    ETF_TOWER_GITHUB_WORKDOC.md
```

---

## 4. 技术栈

### 4.1 前端

```text
Next.js App Router
React
TypeScript
Tailwind CSS
shadcn/ui
TanStack Table
lucide-react
Recharts 或 Apache ECharts
```

前端必须是静态导出：

```js
// next.config.mjs
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1]
const isGithubActions = process.env.GITHUB_ACTIONS === 'true'
const customBasePath = process.env.NEXT_PUBLIC_BASE_PATH
const basePath = customBasePath ?? (isGithubActions && repo ? `/${repo}` : '')

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath,
  assetPrefix: basePath ? `${basePath}/` : '',
  images: {
    unoptimized: true,
  },
}

export default nextConfig
```

注意：GitHub Pages 项目页通常路径是 `https://owner.github.io/repo/`，所以需要 `basePath` 和 `assetPrefix`。如果未来用 custom domain 根路径，可以设置 `NEXT_PUBLIC_BASE_PATH=''`。

### 4.2 数据脚本

```text
Python 3.11+
pandas
pydantic
pyyaml
pyarrow
pytest
```

第一版所有数据都由 Python 生成静态 JSON。浏览器只读 JSON，不直接调外部 API。

### 4.3 自动化

```text
GitHub Actions
GitHub Pages
workflow_dispatch
push to main
schedule
```

---

## 5. UI 设计目标

### 5.1 产品气质

ETF Tower 的 UI 应该像：

```text
Bloomberg/Aladdin 风格的信息密度
+ Linear/Retool 风格的现代简洁
+ 金融 operations cockpit 的操作效率
```

不要做成：

```text
普通 BI dashboard
大型 hero landing page
花哨营销站
低密度 Streamlit notebook
```

### 5.2 首页五秒原则

用户进入首页后，五秒内应该知道：

1. 今天哪些 ETF 是红/黄？
2. 为什么是红/黄？
3. 是 performance、tracking、premium/discount、liquidity、operations、data quality 哪类问题？
4. 是否已有 ticket？
5. 谁需要处理？
6. 有哪些 evidence？

### 5.3 视觉规则

使用：

```text
背景：neutral / slate / off-white
卡片：细边框、轻阴影或无阴影
表格：紧凑、高密度、sticky header
数字：右对齐、tabular numbers
状态：小 badge，不要大色块
图表：简单线图、面积图、柱图，不要复杂渐变
字体：小但清晰，优先 12-14px dashboard typography
```

状态色语义固定：

```text
green  = normal
yellow = review required
red    = action required
grey   = data unavailable/stale
blue   = awaiting external confirmation
```

---

## 6. UI 页面详细说明

## 6.1 Control Tower 首页 `/`

### 6.1.1 目标

首页是 ETF manager 的每日操作台。它不是综合报表，而是 triage screen。

### 6.1.2 布局

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ TopCommandBar: ETF Tower | Search Cmd+K | As-of | Data Mode | Updated        │
├──────────────┬───────────────────────────────────────────────────────────────┤
│ SideNav      │ StatusStrip: US OK | HK stale 1 | CN OK | 2 source warnings  │
│              ├───────────────────────────────────────────────────────────────┤
│ Control      │ KPI Cards: ETFs | Red | Yellow | Tickets | Events | DQ Gaps   │
│ Events       ├───────────────────────────────────────────────────────────────┤
│ Rules        │ ETFHealthTable                                               │
│ Backtest     │ Status ETF Region AUM Return Tracking P/D Spread Vol CA ...  │
│ Data Quality │                                                               │
│              ├───────────────────────────────┬───────────────────────────────┤
│              │ EventInboxPreview             │ TicketQueue                   │
│              ├───────────────────────────────┴───────────────────────────────┤
│              │ CopilotPanel: deterministic daily summary                     │
└──────────────┴───────────────────────────────────────────────────────────────┘
```

### 6.1.3 KPI Cards

必须有：

```text
ETFs monitored
Red ETFs
Yellow ETFs
Open tickets
Unresolved events
Data-quality gaps
```

每张卡片字段：

```ts
type KpiCard = {
  label: string
  value: number | string
  deltaLabel?: string
  status?: 'green' | 'yellow' | 'red' | 'grey' | 'blue'
}
```

### 6.1.4 StatusStrip

显示：

```text
US data freshness
HK data freshness
CN data freshness
last generated timestamp
source warning count
snapshot environment
```

示例：

```text
US OK · HK stale 1 · CN OK · Generated 2026-06-14 22:30 UTC · Demo Data
```

### 6.1.5 ETFHealthTable

列：

```text
Status
ETF
Name
Region
AUM
Return
Benchmark Return
Tracking Diff bps
Premium/Discount bps
Spread bps
Volume vs 20d
Vol z-score
Corporate Actions
Open Tickets
Primary Reason
Updated At
```

行为：

```text
单击 ETF 行 → 打开右侧 ETFDetailDrawer
双击或点击 ticker → 进入 /etf/[ticker]
点击 evidence badge → 打开 evidence popover
点击 ticket count → drawer 滚动到 Tickets
```

默认排序：

```text
red first → yellow → blue → grey → green
then highest severity / latest update
```

Quick filters：

```text
All
Red/Yellow
US
HK
CN
Open Tickets
Data Gaps
Corporate Actions
```

### 6.1.6 ETFDetailDrawer

右侧 drawer 尽量不超过屏幕宽度 520px。包含：

```text
ETF header
primary reason
health pillar mini cards
latest metrics
triggered rules
open tickets
events
mini charts
evidence list
copilot summary
```

Drawer 的价值是让用户不离开首页也能判断是否需要行动。

---

## 6.2 ETF Detail 页面 `/etf/[ticker]`

### 6.2.1 目标

用于更深入解释单只 ETF 今日状态。

### 6.2.2 Sections

```text
1. ETFHeader
2. Health Pillars
3. Price vs NAV chart
4. Tracking Difference chart
5. Premium/Discount chart
6. Volume/Spread chart
7. Holdings/PCF table
8. Events & Corporate Actions
9. Rule Breaches
10. Workflow Tickets
11. Evidence
12. Copilot Summary
```

### 6.2.3 Health Pillars

六个 pillar：

```text
Performance
Tracking
Premium/Discount
Liquidity
Operations
Data Quality
```

每个 pillar：

```ts
type HealthPillar = {
  id: string
  label: string
  status: Status
  score: number
  summary: string
  evidence_ids: string[]
}
```

### 6.2.4 图表要求

图表使用 precomputed time series：

```text
price_nav_series
tracking_diff_series
premium_discount_series
volume_spread_series
```

不要在浏览器内做大规模计算。

---

## 6.3 Event Inbox `/events`

### 6.3.1 目标

把新闻、公告、corporate action、macro update、data delay 等转换成 ETF impact view。

表格逻辑：

```text
Event → Entity → Impacted ETF → Exposure → Rule Trigger → Suggested Workflow → Ticket Status
```

### 6.3.2 Event 类型

```text
corporate_action
issuer_announcement
macro_release
data_delay
pcf_change
benchmark_proxy_move
volume_liquidity_anomaly
```

### 6.3.3 字段

```ts
type EventItem = {
  id: string
  as_of: string
  event_type: EventType
  title: string
  entity_name?: string
  entity_id?: string
  impacted_tickers: string[]
  exposure_pct?: number
  severity: Status
  rule_ids: string[]
  suggested_workflow: string
  ticket_ids: string[]
  evidence_ids: string[]
  source_tag: SourceTag
}
```

---

## 6.4 Rules & Workflow `/rules`

### 6.4.1 目标

显示系统如何把规则变成任务。

必须包含：

```text
Rule catalog
Current breaches
Ticket board
Owner/SLA placeholder
Evidence links
Resolution status
```

Ticket 状态：

```text
open
reviewing
resolved
waived
```

Owner：

```text
PM
Ops
Risk
Compliance
Capital Markets
Data
```

### 6.4.2 Ticket 生成逻辑

每条 breach 要生成 idempotent ticket：

```text
ticket_id = hash(as_of + ticker + rule_id)
```

同一交易日同一 ETF 同一规则不要重复生成多个 ticket。

---

## 6.5 Backtest Lab `/backtest`

### 6.5.1 目标

第一版不是完整策略回测，而是 **rule replay / workflow backtest**。

回答：

```text
这个阈值过去会触发多少次？
是太敏感还是太迟钝？
哪些规则会产生过多 ticket？
哪些 ETF 的 operational/data-quality issue 更频繁？
```

### 6.5.2 UI

```text
ETF selector
Rule selector
Date range selector
Trigger count
Severity distribution
Metric line chart
Breach table
```

### 6.5.3 数据

从 `latest.json.backtests` 读取 precomputed summary。

---

## 6.6 Data Quality `/data-quality`

### 6.6.1 目标

向用户明确展示数据来源、授权状态、是否过期、是否 mock。

必须包含：

```text
Source registry
Source tags
License notes
Last retrieved time
Stale fields
Missing critical fields
Evidence table
Snapshot manifest
Warnings
```

### 6.6.2 Source tags

```text
mock_seed
public_official
open_source_research
licensed_vendor_placeholder
internal_placeholder
unknown_license
```

---

## 7. 数据快照设计

### 7.1 文件

```text
public/data/latest.json
public/data/manifest.json
public/data/snapshots/YYYY-MM-DD.json
```

`latest.json` 是 UI 默认读取文件。  
`snapshots/YYYY-MM-DD.json` 用于历史 replay。  
`manifest.json` 列出可用快照、生成时间和数据警告。

### 7.2 latest.json 完整 schema 草案

```json
{
  "as_of": "2026-06-14",
  "generated_at": "2026-06-14T22:30:00Z",
  "environment": "demo",
  "data_disclaimer": "Prototype only. Demo/research data may be delayed, incomplete, synthetic, or not licensed for production use. Not investment advice. Not for trading, regulatory disclosure, client reporting, redistribution, or NAV/PCF production.",
  "source_warnings": [
    "HK public event feed unavailable; using seed fixture.",
    "Vendor placeholders are not real licensed data."
  ],
  "etfs": [
    {
      "ticker": "US_DEMO_1",
      "name": "US Equity ETF Demo",
      "region": "US",
      "currency": "USD",
      "asset_class": "equity",
      "benchmark_proxy": "US_BENCHMARK_PROXY",
      "aum_millions": 12500.0,
      "expense_ratio_bps": 9,
      "source_tag": "mock_seed",
      "evidence_ids": ["evd_etf_us_1"]
    }
  ],
  "metrics": [
    {
      "ticker": "US_DEMO_1",
      "as_of": "2026-06-14",
      "health_status": "yellow",
      "health_score": 72,
      "primary_reason": "PREMIUM_DISCOUNT_WARN",
      "etf_return_pct": 0.18,
      "benchmark_return_pct": 0.11,
      "tracking_diff_bps": 7,
      "premium_discount_bps": 82,
      "spread_bps": 18,
      "volume_ratio_20d": 0.74,
      "realized_vol_20d_pct": 16.2,
      "realized_vol_zscore": 1.4,
      "open_ca_count": 0,
      "pcf_age_days": 0,
      "missing_critical_fields": 0,
      "updated_at": "2026-06-14T22:20:00Z",
      "evidence_ids": ["evd_metric_us_1"]
    }
  ],
  "health_pillars": [
    {
      "ticker": "US_DEMO_1",
      "pillar": "premium_discount",
      "status": "yellow",
      "score": 65,
      "summary": "Premium/discount exceeded internal warning threshold.",
      "evidence_ids": ["evd_metric_us_1"]
    }
  ],
  "events": [
    {
      "id": "evt_001",
      "as_of": "2026-06-14",
      "event_type": "corporate_action",
      "title": "Demo corporate-action event pending review",
      "entity_name": "Demo Holding A",
      "entity_id": "DEMO_HOLDING_A",
      "impacted_tickers": ["CN_DEMO_1"],
      "exposure_pct": 3.2,
      "severity": "red",
      "rule_ids": ["CORPORATE_ACTION_UNRESOLVED"],
      "suggested_workflow": "Ops should verify event treatment and PCF impact before publication cut-off.",
      "ticket_ids": ["tkt_001"],
      "evidence_ids": ["evd_evt_001"],
      "source_tag": "mock_seed"
    }
  ],
  "rule_breaches": [
    {
      "id": "br_001",
      "as_of": "2026-06-14",
      "ticker": "CN_DEMO_1",
      "rule_id": "CORPORATE_ACTION_UNRESOLVED",
      "metric": "open_ca_count",
      "metric_value": 1,
      "threshold": 0,
      "severity": "red",
      "owner": "Ops",
      "status": "open",
      "evidence_ids": ["evd_evt_001"]
    }
  ],
  "tickets": [
    {
      "id": "tkt_001",
      "as_of": "2026-06-14",
      "ticker": "CN_DEMO_1",
      "rule_id": "CORPORATE_ACTION_UNRESOLVED",
      "title": "Resolve corporate-action treatment for CN_DEMO_1",
      "owner": "Ops",
      "severity": "red",
      "status": "open",
      "due_at": "2026-06-14T23:30:00Z",
      "suggested_action": "Verify exchange/issuer event evidence and confirm PCF treatment.",
      "evidence_ids": ["evd_evt_001"]
    }
  ],
  "evidence": [
    {
      "id": "evd_evt_001",
      "source_name": "Seed fixture",
      "source_tag": "mock_seed",
      "title": "Demo corporate-action source row",
      "retrieved_at": "2026-06-14T22:00:00Z",
      "as_of": "2026-06-14",
      "url": null,
      "raw_path": "data/seed/events.csv",
      "field_name": "open_ca_count",
      "value": "1",
      "confidence": 0.5
    }
  ],
  "data_sources": [
    {
      "id": "src_seed",
      "name": "Seed data",
      "region": "GLOBAL",
      "source_tag": "mock_seed",
      "production_allowed": false,
      "redistribution_allowed": true,
      "last_retrieved_at": "2026-06-14T22:00:00Z",
      "status": "ok",
      "notes": "Synthetic data for prototype only."
    }
  ],
  "time_series": {
    "US_DEMO_1": {
      "price_nav": [],
      "tracking_diff": [],
      "premium_discount": [],
      "volume_spread": []
    }
  },
  "backtests": [
    {
      "ticker": "US_DEMO_1",
      "rule_id": "PREMIUM_DISCOUNT_WARN",
      "start_date": "2026-05-01",
      "end_date": "2026-06-14",
      "trigger_count": 3,
      "red_count": 0,
      "yellow_count": 3,
      "grey_count": 0,
      "notes": "Demo rule replay based on seed data."
    }
  ],
  "copilot_summaries": [
    {
      "scope": "daily",
      "ticker": null,
      "summary": "One ETF is red due to unresolved corporate-action treatment; one ETF is yellow due to premium/discount widening.",
      "recommended_checks": [
        "Ops: verify corporate-action event evidence.",
        "Capital Markets: review premium/discount and spread context."
      ],
      "evidence_ids": ["evd_evt_001", "evd_metric_us_1"],
      "generated_by": "deterministic_template"
    }
  ]
}
```

### 7.3 manifest.json schema

```json
{
  "latest_as_of": "2026-06-14",
  "latest_path": "/data/latest.json",
  "generated_at": "2026-06-14T22:30:00Z",
  "available_snapshots": [
    {
      "as_of": "2026-06-14",
      "path": "/data/snapshots/2026-06-14.json",
      "generated_at": "2026-06-14T22:30:00Z",
      "source_warning_count": 2,
      "etf_count": 9,
      "ticket_count": 3
    }
  ]
}
```

---

## 8. TypeScript 类型

创建 `lib/types.ts`：

```ts
export type Region = 'US' | 'HK' | 'CN'
export type Status = 'green' | 'yellow' | 'red' | 'grey' | 'blue'
export type SourceTag =
  | 'mock_seed'
  | 'public_official'
  | 'open_source_research'
  | 'licensed_vendor_placeholder'
  | 'internal_placeholder'
  | 'unknown_license'

export type WorkflowOwner =
  | 'PM'
  | 'Ops'
  | 'Risk'
  | 'Compliance'
  | 'Capital Markets'
  | 'Data'

export type ETF = {
  ticker: string
  name: string
  region: Region
  currency: string
  asset_class: string
  benchmark_proxy: string
  aum_millions?: number
  expense_ratio_bps?: number
  source_tag: SourceTag
  evidence_ids: string[]
}

export type ETFMetric = {
  ticker: string
  as_of: string
  health_status: Status
  health_score: number
  primary_reason: string
  etf_return_pct: number | null
  benchmark_return_pct: number | null
  tracking_diff_bps: number | null
  premium_discount_bps: number | null
  spread_bps: number | null
  volume_ratio_20d: number | null
  realized_vol_20d_pct?: number | null
  realized_vol_zscore: number | null
  open_ca_count: number
  pcf_age_days: number | null
  missing_critical_fields: number
  updated_at: string
  evidence_ids: string[]
}

export type RuleBreach = {
  id: string
  as_of: string
  ticker: string
  rule_id: string
  metric: string
  metric_value: number | null
  threshold: number
  severity: Status
  owner: WorkflowOwner
  status: 'open' | 'reviewing' | 'resolved' | 'waived'
  evidence_ids: string[]
}

export type Ticket = {
  id: string
  as_of: string
  ticker: string
  rule_id: string
  title: string
  owner: WorkflowOwner
  severity: Status
  status: 'open' | 'reviewing' | 'resolved' | 'waived'
  due_at?: string
  suggested_action: string
  evidence_ids: string[]
}

export type Evidence = {
  id: string
  source_name: string
  source_tag: SourceTag
  title: string
  retrieved_at: string
  as_of: string
  url?: string | null
  raw_path?: string | null
  field_name?: string | null
  value?: string | null
  confidence?: number | null
}

export type Snapshot = {
  as_of: string
  generated_at: string
  environment: 'demo' | 'internal' | 'production_placeholder'
  data_disclaimer: string
  source_warnings: string[]
  etfs: ETF[]
  metrics: ETFMetric[]
  events: EventItem[]
  rule_breaches: RuleBreach[]
  tickets: Ticket[]
  evidence: Evidence[]
  data_sources: DataSource[]
  time_series?: Record<string, unknown>
  backtests: BacktestSummary[]
  copilot_summaries: CopilotSummary[]
}
```

---

## 9. Python 脚本设计

### 9.1 scripts/requirements.txt

```text
pandas>=2.2
pyarrow>=15.0
pydantic>=2.7
pyyaml>=6.0
python-dateutil>=2.9
pytest>=8.0
```

### 9.2 scripts/schemas.py

要求：

1. 定义与 TypeScript mirror 的 Pydantic models。
2. 对 source_tag、status、region、owner 做 enum validation。
3. build_snapshot 结束前必须 validate 整个 snapshot。

### 9.3 scripts/ingest_public.py

第一版行为：

```text
- 读取 data/seed/*.csv 或内置 seed fixtures
- 可选读取公开数据源，但失败时不报错中断
- 标记 source_tag
- 生成中间 DataFrame/dict
```

原则：

```text
网络失败 → warning，不让部署失败
API key 缺失 → 使用 seed
数据缺失 → source_warnings + Data Quality page
```

### 9.4 scripts/run_rules.py

功能：

1. 读取 `rules/rules.yml`。
2. 对每只 ETF 的 metrics 应用规则。
3. 生成 rule_breaches。
4. 生成 idempotent tickets。
5. 计算 overall health status。

Pseudo-code：

```python
def evaluate_rules(metrics, rules):
    breaches = []
    for metric in metrics:
        for rule in rules:
            value = getattr(metric, rule.metric)
            if value is None:
                continue
            if condition_matches(value, rule):
                breaches.append(make_breach(metric, rule, value))
    return breaches


def make_ticket(as_of, ticker, breach):
    ticket_id = stable_hash(f"{as_of}:{ticker}:{breach.rule_id}")
    return Ticket(
        id=ticket_id,
        as_of=as_of,
        ticker=ticker,
        rule_id=breach.rule_id,
        title=f"{breach.rule_id} for {ticker}",
        owner=breach.owner,
        severity=breach.severity,
        status="open",
        evidence_ids=breach.evidence_ids,
    )
```

### 9.5 scripts/build_backtest.py

第一版只做 deterministic seed replay：

```text
- 生成过去 N 天的 demo metric series
- 按规则计算 trigger_count
- 输出 backtests summary
```

### 9.6 scripts/build_snapshot.py

CLI：

```bash
python scripts/build_snapshot.py --as-of today --output public/data
python scripts/build_snapshot.py --as-of 2026-06-14 --output public/data
```

职责：

```text
1. parse as_of
2. ingest seed/public-safe data
3. calculate metrics
4. evaluate rules
5. create tickets
6. build deterministic copilot summaries
7. validate snapshot schema
8. write public/data/latest.json
9. write public/data/snapshots/YYYY-MM-DD.json
10. update public/data/manifest.json
```

---

## 10. Rules.yml 初始规则

创建 `rules/rules.yml`：

```yaml
rules:
  - id: TRACKING_DIFF_WARN
    label: Tracking difference warning
    description: Absolute ETF-vs-benchmark tracking difference exceeds warning threshold.
    metric: tracking_diff_bps
    condition: abs(value) > threshold
    threshold: 50
    severity: yellow
    owner: PM
    suggested_action: Review performance attribution and check cash, fee, FX, dividend, sampling, and corporate-action effects.

  - id: TRACKING_DIFF_RED
    label: Tracking difference action required
    description: Absolute ETF-vs-benchmark tracking difference exceeds action threshold.
    metric: tracking_diff_bps
    condition: abs(value) > threshold
    threshold: 100
    severity: red
    owner: PM
    suggested_action: Escalate to PM review and confirm whether operational or market microstructure issues explain the gap.

  - id: PREMIUM_DISCOUNT_WARN
    label: Premium/discount warning
    description: ETF premium/discount exceeds internal warning threshold.
    metric: premium_discount_bps
    condition: abs(value) > threshold
    threshold: 75
    severity: yellow
    owner: Capital Markets
    suggested_action: Review underlying market status, NAV timestamp, AP activity, spread, and quote quality.

  - id: SPREAD_WIDE
    label: Spread widened
    description: Bid-ask spread exceeds internal warning threshold.
    metric: spread_bps
    condition: value > threshold
    threshold: 30
    severity: yellow
    owner: Capital Markets
    suggested_action: Check market-maker quote quality, underlying liquidity, and recent flows.

  - id: VOLUME_LOW
    label: Low ETF volume
    description: ETF volume ratio vs 20-day average is below warning threshold.
    metric: volume_ratio_20d
    condition: value < threshold
    threshold: 0.5
    severity: yellow
    owner: Capital Markets
    suggested_action: Review secondary-market liquidity and recent investor flow context.

  - id: VOLATILITY_HIGH
    label: High realized volatility
    description: Realized volatility z-score exceeds warning threshold.
    metric: realized_vol_zscore
    condition: value > threshold
    threshold: 2.0
    severity: yellow
    owner: Risk
    suggested_action: Review market regime, exposure concentration, and stress indicators.

  - id: CORPORATE_ACTION_UNRESOLVED
    label: Corporate action unresolved
    description: At least one corporate-action event affecting ETF holdings is unresolved.
    metric: open_ca_count
    condition: value > threshold
    threshold: 0
    severity: red
    owner: Ops
    suggested_action: Confirm event treatment, index treatment, NAV impact, and PCF/basket impact.

  - id: PCF_STALE
    label: PCF stale
    description: PCF age is greater than zero days.
    metric: pcf_age_days
    condition: value > threshold
    threshold: 0
    severity: red
    owner: Ops
    suggested_action: Verify PCF publication status and resolve stale basket issue.

  - id: DATA_QUALITY_GAP
    label: Data-quality gap
    description: Critical fields are missing or stale.
    metric: missing_critical_fields
    condition: value > threshold
    threshold: 0
    severity: grey
    owner: Data
    suggested_action: Inspect source registry, refresh snapshot, or mark source limitation.
```

---

## 11. Health scoring 规则

### 11.1 Overall status precedence

```text
red if any red breach
else yellow if any yellow breach
else blue if awaiting external confirmation exists
else grey if data quality gap exists or critical data stale
else green
```

注意：如果 data 缺失严重，grey 可以覆盖 green/yellow，但不应该覆盖 red operational issue。建议 precedence：

```text
red > grey critical missing > yellow > blue > green
```

### 11.2 Score rough logic

```text
start = 100
red breach: -30 each, floor 0
yellow breach: -12 each
grey data gap: -20 each
blue waiting confirmation: -8 each
cap min 0 max 100
```

### 11.3 Primary reason

优先选择最高 severity 的 rule_id：

```text
red rule first
then grey data quality
then yellow
then blue
else OK
```

---

## 12. Deterministic Copilot

第一版不要调用 LLM API。做 deterministic copilot summary，保证 GitHub Pages 可离线展示。

### 12.1 Daily summary template

```text
As of {as_of}, ETF Tower monitors {n_etfs} ETFs. {n_red} are red, {n_yellow} are yellow, and {n_open_tickets} tickets are open. The highest-priority issue is {top_rule_id} affecting {top_ticker}. Suggested next check: {suggested_action}. Evidence: {evidence_ids}.
```

中文 UI 可显示：

```text
截至 {as_of}，ETF Tower 监控 {n_etfs} 只 ETF。当前 {n_red} 只红色、{n_yellow} 只黄色，开放 ticket {n_open_tickets} 个。最高优先级问题是 {top_rule_id}，影响 {top_ticker}。建议下一步：{suggested_action}。Evidence: {evidence_ids}。
```

### 12.2 ETF summary template

```text
{ticker} is {status}. Primary reason: {primary_reason}. Key metrics: tracking difference {tracking_diff_bps} bps, premium/discount {premium_discount_bps} bps, spread {spread_bps} bps, volume ratio {volume_ratio_20d}x. Open tickets: {ticket_ids}. Evidence: {evidence_ids}.
```

### 12.3 Guardrails

Copilot 必须显示：

```text
Internal draft · evidence-based · prototype only
```

禁止输出：

```text
buy/sell recommendation
final rebalance decision
client-facing disclosure
guaranteed compliance conclusion
```

---

## 13. GitHub Actions 工作流

创建 `.github/workflows/daily-update.yml`：

```yaml
name: Daily ETF Tower Update

on:
  workflow_dispatch:
  push:
    branches: [main]
  schedule:
    # After CN/HK market close, Monday-Friday.
    - cron: "15 18 * * 1-5"
      timezone: "Asia/Hong_Kong"
    # After US market close, Monday-Friday.
    - cron: "30 18 * * 1-5"
      timezone: "America/New_York"

permissions:
  contents: write
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install Python dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r scripts/requirements.txt

      - name: Build daily ETF snapshot
        run: |
          python scripts/build_snapshot.py --as-of today --output public/data

      - name: Commit updated snapshots
        if: github.event_name == 'schedule' || github.event_name == 'workflow_dispatch'
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add public/data/latest.json public/data/manifest.json public/data/snapshots || true
          git diff --cached --quiet || git commit -m "chore(data): daily ETF Tower snapshot"
          git push || true

      - name: Set up pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"

      - name: Install Node dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Build static site
        run: pnpm build

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./out

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 13.1 GitHub Pages 设置

Repo 创建后：

```text
Settings → Pages → Build and deployment → Source → GitHub Actions
```

不要选择 branch `/docs` 部署方式，因为我们需要 build process。

### 13.2 Schedule 注意事项

工作流必须已存在于 default branch。Scheduled workflows 只会在 default branch 上运行。避免把 cron 放在每小时 0 分，因为高峰可能延迟。脚本必须能处理无数据日、周末、节假日，不应该因为无新数据导致部署失败。

---

## 14. README 要求

`README.md` 至少包含：

```text
# ETF Tower

## What it is
A static GitHub-deployable ETF Daily Control Tower prototype.

## What it is not
Not investment advice. Not production trading, compliance, disclosure, NAV, PCF, or market-data redistribution infrastructure.

## Stack
Next.js, TypeScript, Tailwind, shadcn/ui, Python snapshot scripts, GitHub Actions, GitHub Pages.

## Local setup
pnpm install
python -m pip install -r scripts/requirements.txt
python scripts/build_snapshot.py --as-of today --output public/data
pnpm dev

## Build
pnpm lint
pnpm build

## Deploy
GitHub Pages via .github/workflows/daily-update.yml

## Data policy
Only seed/public/research-safe data in public GitHub Pages.
```

---

## 15. Codex 执行计划

### 15.1 Codex 总启动 prompt

```text
Read AGENTS.md and docs/ETF_TOWER_GITHUB_WORKDOC.md. Build the ETF Tower GitHub static prototype. Use Next.js App Router, TypeScript, Tailwind, shadcn/ui, static export, static JSON snapshots, Python snapshot scripts, YAML rules, deterministic copilot summaries, and GitHub Actions deployment. The app must run from seed/public-safe data without secrets. Do not use Streamlit. Do not add real Wind/Bloomberg/vendor integrations. Prioritize a modern, compact Control Tower UI with ETF health table, right-side detail drawer, rule breaches, workflow tickets, evidence IDs, and daily GitHub Pages deployment.
```

### 15.2 Milestone 1 prompt — UI scaffold

```text
Implement Milestone 1. Scaffold Next.js + TypeScript + Tailwind + shadcn/ui. Add static export config for GitHub Pages. Create seed public/data/latest.json and public/data/manifest.json. Build the Control Tower homepage with TopCommandBar, SideNav, StatusStrip, KPI cards, ETF health table, Event Inbox preview, Ticket Queue, CopilotPanel, and ETFDetailDrawer. Add README local run instructions. The app must build with pnpm build and export to out/.
```

Acceptance：

```text
pnpm install works
pnpm lint works
pnpm build creates out/
Homepage loads latest.json
ETF table row opens drawer
No live API calls
No secrets
```

### 15.3 Milestone 2 prompt — data pipeline

```text
Implement Milestone 2. Add scripts/schemas.py, scripts/ingest_public.py, scripts/run_rules.py, scripts/build_backtest.py, scripts/build_snapshot.py, scripts/requirements.txt, and rules/rules.yml. Use deterministic seed data for US/HK/CN demo ETFs. build_snapshot.py must generate public/data/latest.json, public/data/manifest.json, and public/data/snapshots/YYYY-MM-DD.json. Validate output with Pydantic. Rule breaches must create idempotent tickets with evidence IDs.
```

Acceptance：

```text
python scripts/build_snapshot.py --as-of today --output public/data works
latest.json validates
rule breaches generated
idempotent tickets generated
manifest updated
pytest passes
```

### 15.4 Milestone 3 prompt — detail pages

```text
Implement Milestone 3. Build /etf/[ticker], /events, /rules, /backtest, and /data-quality pages. Reuse data from latest.json. Add charts for price vs NAV, tracking difference, premium/discount, and volume/spread using static time series. Add evidence popovers and evidence table. Keep layout compact and modern.
```

Acceptance：

```text
All routes build statically
ETF detail page renders for each seed ETF
Events page shows event-to-impact table
Rules page shows rule catalog and ticket board
Backtest page shows precomputed summary
Data Quality page shows source registry and warnings
```

### 15.5 Milestone 4 prompt — GitHub deployment

```text
Implement Milestone 4. Add .github/workflows/daily-update.yml using workflow_dispatch, push to main, schedule, Python snapshot generation, optional snapshot commit, pnpm install, lint, build, upload-pages-artifact, and deploy-pages. Ensure the workflow does not require private secrets and falls back to seed data. Update README with GitHub Pages setup instructions.
```

Acceptance：

```text
workflow_dispatch can run manually
build job creates latest.json
pnpm build runs in CI
Pages artifact uploads ./out
Deploy job publishes site
No vendor data or secrets exposed
```

### 15.6 Milestone 5 prompt — polish

```text
Implement Milestone 5. Polish UI density, responsive behavior, empty states, source/disclaimer badges, table sorting/filtering, drawer keyboard behavior, deterministic copilot wording, and documentation. Add tests for data schema, rule engine, and snapshot generation.
```

Acceptance：

```text
UI looks modern and concise
Works on laptop width
Shows 8-12 ETF rows without excessive scrolling
All warnings/disclaimers visible
Tests pass
Docs complete
```

---

## 16. GitHub Issues 拆解

建议创建以下 issues：

### Epic 1 — App scaffold

```text
1. Create Next.js App Router project
2. Configure TypeScript, Tailwind, shadcn/ui
3. Configure static export for GitHub Pages
4. Add AppShell, TopCommandBar, SideNav
```

### Epic 2 — Static snapshot data

```text
1. Define Pydantic schemas
2. Define TypeScript types
3. Create seed US/HK/CN ETF universe
4. Generate latest.json
5. Generate manifest.json
6. Add snapshots/YYYY-MM-DD.json
```

### Epic 3 — Rules and tickets

```text
1. Create rules/rules.yml
2. Implement rule evaluator
3. Implement idempotent ticket generation
4. Add severity/status logic
5. Add evidence linking
```

### Epic 4 — Control Tower UI

```text
1. KPI cards
2. Status strip
3. ETF health table
4. Row filters
5. Detail drawer
6. Event preview
7. Ticket queue
8. Copilot panel
```

### Epic 5 — Detail pages

```text
1. /etf/[ticker]
2. /events
3. /rules
4. /backtest
5. /data-quality
```

### Epic 6 — GitHub automation

```text
1. Add daily-update.yml
2. Add workflow_dispatch
3. Add scheduled runs
4. Add Pages deployment
5. Add snapshot commit behavior
6. Document repo settings
```

### Epic 7 — Quality/security/docs

```text
1. Add pytest for Python scripts
2. Add TypeScript type checks
3. Add README
4. Add data policy disclaimer
5. Add no-secrets validation guidance
6. Add known limitations
```

---

## 17. Data policy 和安全边界

### 17.1 Public GitHub Pages 只允许

```text
mock_seed
public_official
open_source_research
licensed_vendor_placeholder，但不含真实 vendor 数据
```

### 17.2 Public GitHub Pages 禁止

```text
Wind/Bloomberg/LSEG/FactSet/ICE/MSCI/S&P 真实数据
交易所实时行情或未经授权延迟行情
指数成分授权文件
内部 holdings
内部 PCF/NAV
AP/market-maker 信息
客户信息
未公开交易或 rebalance 信息
API keys
OAuth tokens
数据库连接串
LLM provider keys
```

### 17.3 代码安全要求

```text
不要把 secrets 写入 .env.example 以外的文件
不要把 .env commit
不要在 latest.json 输出 secrets
不要让 browser bundle 读取私有变量
不要在 GitHub Actions logs 打印 tokens
不要把 private licensed files 放入 public/
```

### 17.4 Disclaimer

UI 页脚、Data Quality 页、README 都必须出现：

```text
Prototype only. Demo/research data may be delayed, incomplete, synthetic, or not licensed for production use. Not investment advice. Not for trading, regulatory disclosure, client reporting, redistribution, or NAV/PCF production.
```

---

## 18. 本地运行命令

```bash
# 1. install frontend deps
pnpm install

# 2. install python deps
python -m pip install -r scripts/requirements.txt

# 3. build snapshot
python scripts/build_snapshot.py --as-of today --output public/data

# 4. run dev server
pnpm dev

# 5. lint and build
pnpm lint
pnpm build

# 6. run python tests
pytest
```

---

## 19. UI 质量 checklist

在交付前检查：

```text
[ ] 首页 5 秒内能看出 red/yellow ETF
[ ] ETF table 默认按 severity 排序
[ ] 关键数字右对齐
[ ] 每个 status badge 颜色语义一致
[ ] 行点击打开 drawer
[ ] Drawer 包含 primary reason、rules、tickets、evidence
[ ] Events 显示 impacted ETF 和 workflow
[ ] Rules 显示 owner 和 status
[ ] Backtest 不是空页面
[ ] Data Quality 清楚显示 source tags
[ ] Footer/Disclaimer 清楚
[ ] 手机/窄屏不崩，但优先 laptop
[ ] pnpm build 成功
[ ] latest.json 无 secrets
[ ] GitHub workflow 不需要私有 key
```

---

## 20. Definition of Done

这个 GitHub prototype 完成的标准：

```text
1. Repo 可以从零 clone 后运行。
2. `pnpm install` 成功。
3. `python -m pip install -r scripts/requirements.txt` 成功。
4. `python scripts/build_snapshot.py --as-of today --output public/data` 成功。
5. `pnpm lint` 成功。
6. `pnpm build` 生成 `out/`。
7. 首页能加载 `public/data/latest.json`。
8. ETF health table 有 US/HK/CN demo ETFs。
9. 点击 ETF 行打开 detail drawer。
10. 至少有一个 red、一个 yellow、一个 green ETF 示例。
11. 至少有一个 corporate-action event 示例。
12. 至少有一个 rule breach 示例。
13. 至少有一个 open ticket 示例。
14. 每个 ticket 都有 evidence IDs。
15. Data Quality 页显示 source registry。
16. GitHub Actions workflow 可手动运行。
17. GitHub Pages 可部署静态站点。
18. UI 明确显示 prototype/data disclaimer。
19. Repo 内不包含 Streamlit 依赖或 Streamlit 备份路线。
20. Repo 内不包含真实 vendor data 或 secrets。
```

---

## 21. 未来生产版路线

当 demo 验证成功后，按以下方向升级：

```text
Phase A: GitHub static demo
  - seed/public/research data
  - no auth
  - no private data

Phase B: authenticated internal static app
  - still static frontend
  - private object storage for snapshots
  - SSO-protected hosting

Phase C: backend + database
  - FastAPI
  - Postgres/Timescale
  - object store for raw files
  - audit logs
  - entitlement registry

Phase D: vendor adapters
  - Wind adapter
  - Bloomberg adapter
  - exchange official feeds
  - index provider feeds
  - corporate-action vendor feeds

Phase E: LLM evidence service
  - tool-calling only
  - evidence IDs mandatory
  - no direct database write
  - human approval for outward-facing text

Phase F: workflow system
  - RBAC
  - approvals
  - SLA
  - audit trail
  - compliance review
```

---

## 22. Official references

Useful implementation references:

```text
Next.js static export:
https://nextjs.org/docs/app/guides/static-exports

GitHub Actions workflow syntax:
https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax

GitHub Actions events and scheduled workflow behavior:
https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows

GitHub Pages publishing source:
https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

shadcn/ui Next.js installation:
https://ui.shadcn.com/docs/installation/next
```

---

## 23. Final note for Codex

Prioritize a working vertical slice over breadth.

The first credible demo is:

```text
Control Tower homepage
+ static snapshot
+ 9 demo ETFs across US/HK/CN
+ health scoring
+ rule breaches
+ tickets
+ evidence
+ detail drawer
+ GitHub Pages deployment
```

Everything else is secondary.
