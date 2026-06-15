# ETF Tower 工程解释文档 — 给 Python Data Scientist 的版本

版本：v0.1  
目标读者：会 Python / pandas / data pipeline，但不一定熟悉前端、TypeScript、Next.js、GitHub Actions、GitHub Pages 的数据科学家。

---

## 0. 用一句话理解这个工程

ETF Tower GitHub prototype 是一个：

```text
Python 每天生成一份 ETF 数据快照 JSON
→ Next.js 前端读取这份 JSON 并渲染现代 UI
→ GitHub Actions 每天自动运行 Python + build 前端
→ GitHub Pages 发布静态网页
```

它不是传统后端服务，也不是数据库应用。第一版故意做成 **static app**：所有展示需要的数据都提前算好，放进 `public/data/latest.json`，浏览器只负责读取和展示。

---

## 1. 你作为 Python data scientist 应该怎么建立 mental model

你可以把整个项目想成你熟悉的 notebook/data pipeline，只是多了一层 web UI。

### 1.1 你熟悉的世界

```text
CSV/API/raw data
  ↓
pandas 清洗
  ↓
计算指标
  ↓
输出 DataFrame / chart / notebook
```

### 1.2 这个工程里的对应关系

```text
seed/public-safe data
  ↓
Python scripts: ingest_public.py / run_rules.py / build_snapshot.py
  ↓
validated JSON snapshot: public/data/latest.json
  ↓
Next.js UI reads JSON
  ↓
GitHub Pages website
```

你最需要掌控的是前三层：数据、计算、schema。前端主要是把结果展示得更专业、更像产品。

---

## 2. 为什么第一版不用数据库

生产版当然需要 PostgreSQL / TimescaleDB / object storage / entitlement registry。但第一版展示版不需要。

原因：

1. GitHub Pages 只能托管静态文件，不跑后端服务器。
2. 数据量很小：US/HK/CN demo ETF、指标、规则、ticket、evidence，放一个 JSON 足够。
3. Demo 的目标是讲清楚产品逻辑，而不是承载真实生产流量。
4. 不用数据库可以让 Codex 更容易一次性搭好整个 repo。

第一版的“数据库”其实就是：

```text
public/data/latest.json
public/data/snapshots/YYYY-MM-DD.json
public/data/manifest.json
```

这类似你把 pandas 结果保存成 parquet/JSON 后交给别人读。

---

## 3. 整体数据流

```text
┌─────────────────────────────┐
│ data/seed 或 public-safe data│
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│ Python ingestion             │
│ scripts/ingest_public.py     │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│ Python calculations          │
│ metrics / rules / health     │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│ Pydantic validation          │
│ scripts/schemas.py           │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│ latest.json                  │
│ manifest.json                │
│ snapshots/YYYY-MM-DD.json    │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│ Next.js static frontend      │
│ app/page.tsx                 │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│ GitHub Pages                 │
└─────────────────────────────┘
```

关键原则：**Python 负责算，前端负责看。**

不要让浏览器去算 tracking error、health score、rule breaches。浏览器里只做轻量排序、筛选、展示。

---

## 4. Repo 目录结构怎么理解

最终 repo 大致是：

```text
etf-tower/
  app/                    # Next.js 页面，相当于网站的 routes
  components/             # 可复用 UI 组件
  lib/                    # TypeScript 工具函数和类型
  public/data/            # 前端可直接读取的数据快照
  scripts/                # Python 数据工程脚本
  rules/                  # YAML 规则配置
  .github/workflows/      # GitHub Actions 自动化
  docs/                   # 工作文档
  README.md               # 项目说明和运行方式
  AGENTS.md               # 给 Codex 的项目指令
```

你可以把它类比成：

```text
scripts/      = 你的 Python data pipeline
public/data/  = pipeline 输出结果
app/          = 把结果展示成网页的入口
components/   = dashboard 中的卡片、表格、drawer、图表
lib/          = 前端版 utils/types
.github/      = 定时任务和部署脚本
```

---

## 5. 前端部分你需要知道什么

你不需要成为前端工程师，但要理解这些概念，否则和 Codex/工程师沟通会卡住。

### 5.1 Next.js 是什么

Next.js 是 React 的应用框架。你可以把它理解成：

```text
React components + routing + build system + deployment conventions
```

这个项目用 Next.js 的 **static export**：build 时生成 HTML/CSS/JS 静态文件，输出到 `out/` 文件夹。GitHub Pages 只需要托管 `out/`。这就是为什么我们不需要服务器。

### 5.2 React 是什么

React 是 UI 组件系统。一个页面由很多组件拼起来。

例如：

```text
Control Tower page
  ├─ TopCommandBar
  ├─ StatusStrip
  ├─ HealthKpiCards
  ├─ ETFHealthTable
  ├─ ETFDetailDrawer
  ├─ EventInboxPreview
  └─ TicketQueue
```

你可以把 React component 类比成 Python 里的函数：

```python
def MetricCard(label, value, status):
    return rendered_card
```

React/TypeScript 里类似：

```tsx
function MetricCard({ label, value, status }: Props) {
  return <div>{label}: {value}</div>
}
```

### 5.3 TypeScript 是什么

TypeScript 是带类型的 JavaScript。它的作用和你用 Pydantic/schema 的心态接近：提前发现字段错、类型错。

例如 snapshot 里 `tracking_diff_bps` 应该是 number 或 null，不应该突然变成 string。TypeScript 会帮前端发现这些问题。

前端会有：

```ts
export type ETFMetric = {
  ticker: string
  tracking_diff_bps: number | null
  premium_discount_bps: number | null
  health_status: 'green' | 'yellow' | 'red' | 'grey' | 'blue'
}
```

Python 侧会有对应的 Pydantic model。两个 schema 要保持一致。

### 5.4 Tailwind CSS 是什么

Tailwind 是写样式的工具。它用 class 名控制样式，例如：

```tsx
<div className="rounded-lg border p-4 text-sm">
```

你不需要深学 CSS，但要知道 UI 样式主要靠 Tailwind 控制。

### 5.5 shadcn/ui 是什么

shadcn/ui 是一套现代 UI 组件模板。它不是传统 npm UI 库，而是把 Button、Table、Card、Dialog、Drawer 等组件代码复制进你的项目，方便你改。

对 ETF Tower 来说，它适合做：

```text
Card
Badge
Button
Table
Sheet/Drawer
Tabs
Popover
Command Palette
Dialog
```

### 5.6 TanStack Table 是什么

TanStack Table 是专业表格库。ETF Tower 首页最重要的是高密度 ETF health table，所以需要：

```text
排序
筛选
列定义
紧凑行
点击行打开 drawer
```

这类表格用普通 HTML table 很快会乱，TanStack Table 更稳。

### 5.7 Recharts / ECharts 是什么

它们是图表库。第一版只需要简单图：

```text
Price vs NAV
Tracking diff
Premium/discount
Volume/spread
```

图表数据从 `latest.json.time_series` 读取，不在浏览器里重新算。

---

## 6. Python 部分怎么做

Python 是你最熟悉、也最应该主导的部分。

### 6.1 scripts/schemas.py

这里定义 Pydantic schema。它是整个工程的数据契约。

你要保证：

```text
latest.json 的每个字段都有 schema
status/source_tag/region/owner 都是 enum
构建快照前后都 validate
```

如果 schema 错，前端就会读错或渲染失败。

### 6.2 scripts/ingest_public.py

第一版不接真实 Wind/Bloomberg。这里读取 seed fixtures 或公开/研究安全数据。

原则：

```text
网络失败 → source_warning
API key 缺失 → 用 seed
数据缺失 → Data Quality page 显示
不要让 demo 因为数据源失败而挂掉
```

### 6.3 scripts/run_rules.py

这里把指标和 YAML 规则比对。

例子：

```yaml
- id: PREMIUM_DISCOUNT_WARN
  metric: premium_discount_bps
  condition: abs(value) > threshold
  threshold: 75
  severity: yellow
  owner: Capital Markets
```

Python 读取规则后，对每只 ETF 的指标跑一遍。如果触发，就生成 `rule_breach` 和 `ticket`。

### 6.4 scripts/build_snapshot.py

这是主入口。它相当于你的 production notebook 被整理成一个 CLI。

运行：

```bash
python scripts/build_snapshot.py --as-of today --output public/data
```

它应该做：

```text
1. parse as_of
2. ingest seed/public data
3. calculate metrics
4. evaluate rules
5. create tickets
6. create deterministic copilot summary
7. validate snapshot
8. write latest.json
9. write snapshots/YYYY-MM-DD.json
10. update manifest.json
```

### 6.5 scripts/build_backtest.py

第一版不是策略回测，而是 rule replay：

```text
过去 N 天，这条规则触发了多少次？
哪些 ETF 经常触发？
这个阈值会不会太敏感？
```

这帮助你讲产品价值：不是只会 alert，还能 backtest alert policy。

---

## 7. latest.json 是整个工程的核心

前端不会直接知道 Wind/Bloomberg/AKShare/SEC/HKEX/SSE。它只知道 `latest.json`。

最小结构：

```json
{
  "as_of": "2026-06-14",
  "generated_at": "2026-06-14T22:30:00Z",
  "environment": "demo",
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

作为 data scientist，你要把它当作一个 stable output contract。只要这个 contract 稳，UI 可以不断变漂亮，数据源也可以以后替换。

---

## 8. Evidence-first 是什么

每个 claim 都要能追溯。

错误做法：

```text
ETF_CN_1 有 corporate action 风险。
```

正确做法：

```json
{
  "rule_id": "CORPORATE_ACTION_UNRESOLVED",
  "ticker": "CN_DEMO_1",
  "metric": "open_ca_count",
  "metric_value": 1,
  "evidence_ids": ["evd_evt_001"]
}
```

然后 `evidence` 表里有：

```json
{
  "id": "evd_evt_001",
  "source_name": "Seed fixture",
  "source_tag": "mock_seed",
  "title": "Demo corporate-action source row",
  "retrieved_at": "2026-06-14T22:00:00Z",
  "raw_path": "data/seed/events.csv"
}
```

以后接生产数据时，这个 evidence 可以指向 Wind/Bloomberg/交易所/issuer/内部系统的原始记录。

---

## 9. UI 页面怎么分工

### 9.1 `/` Control Tower 首页

这是主页面。目标：五秒内知道今天哪里出问题。

它包括：

```text
TopCommandBar
StatusStrip
KPI Cards
ETF Health Table
ETF Detail Drawer
Event Inbox Preview
Ticket Queue
Copilot Panel
```

最关键的是 ETF Health Table。

### 9.2 `/etf/[ticker]` ETF 详情页

单只 ETF 深入分析页。展示：

```text
metadata
health pillars
charts
events
rules
tickets
evidence
copilot summary
```

注意：`[ticker]` 是动态路由。意思是 `/etf/US_DEMO_1/`、`/etf/HK_DEMO_1/` 都走同一个页面模板。

在 static export 中，动态页面通常需要让 Next.js 在 build 时知道有哪些 ticker，或者退而求其次让详情主要通过 drawer/client-side 渲染。第一版 Codex 可以选择：

```text
A. 用 generateStaticParams 为 seed ETFs 生成静态详情页
B. 首页 drawer 作为主要交互，详情页只作为增强
```

### 9.3 `/events`

把事件转成 ETF impact view：

```text
Event → Entity → Impacted ETF → Exposure → Rule Trigger → Suggested Workflow
```

它不是新闻列表，而是事件影响工作台。

### 9.4 `/rules`

显示：

```text
规则目录
当前触发
ticket board
owner
status
evidence
```

### 9.5 `/backtest`

展示 rule replay 结果。

### 9.6 `/data-quality`

这是非常重要的页面。它告诉用户：

```text
哪些数据是 mock
哪些是 public official
哪些是 research-only
哪些过期
哪些字段缺失
哪些 source 有 warning
```

这能避免 demo 被误解成 production golden source。

---

## 10. GitHub Actions 是什么

GitHub Actions 就是 GitHub 里的自动化任务系统。你可以把它想成云端 cron + CI/CD。

这个项目的 workflow 做：

```text
on schedule / push / manual
  ↓
checkout repo
  ↓
install Python
  ↓
run build_snapshot.py
  ↓
commit latest.json/snapshots if needed
  ↓
install Node/pnpm
  ↓
pnpm lint
  ↓
pnpm build
  ↓
upload out/
  ↓
deploy to GitHub Pages
```

它的配置文件是：

```text
.github/workflows/daily-update.yml
```

### 10.1 workflow_dispatch

手动运行按钮。你在 GitHub UI 里点一下，workflow 就跑。

### 10.2 push

每次 push 到 main，自动 build/deploy。

### 10.3 schedule

定时运行。我们设置工作日陆港收盘后、美股收盘后运行。

截至当前 GitHub Actions 文档，scheduled workflow 可以用 cron，并且可以用 IANA timezone 字符串做 timezone-aware schedule。

---

## 11. GitHub Pages 是什么

GitHub Pages 是 GitHub 托管静态网页的服务。

它适合放：

```text
HTML
CSS
JavaScript
JSON
图片
```

它不适合放：

```text
后端 API
数据库
私密数据
需要登录权限的生产系统
Wind/Bloomberg 数据
secrets
```

所以第一版要非常明确：这是 public-safe demo。

---

## 12. 为什么 public/data 里面不能放敏感数据

因为 `public/` 文件夹里的东西会被打包成网站公开资源。任何人打开浏览器 DevTools 或访问 URL，都可能下载。

所以禁止放：

```text
Wind/Bloomberg 真实数据
内部 holdings
真实 NAV/PCF
客户数据
API key
私有交易记录
AP/market maker 信息
非公开 corporate action review
```

即使 repo 是 private，Pages 的访问控制也要特别小心。公开展示版按“互联网可见”处理最安全。

---

## 13. 本地怎么跑

第一次：

```bash
pnpm install
python -m pip install -r scripts/requirements.txt
python scripts/build_snapshot.py --as-of today --output public/data
pnpm dev
```

浏览器打开本地地址，一般是：

```text
http://localhost:3000
```

检查生产 build：

```bash
pnpm lint
pnpm build
```

Python tests：

```bash
pytest
```

你主要需要看：

```text
public/data/latest.json 是否生成
首页是否能读取 latest.json
rule breaches/tickets/evidence 是否合理
pnpm build 是否生成 out/
```

---

## 14. 你需要学到什么程度

### 必须理解

```text
latest.json schema
Pydantic validation
rules.yml
health scoring
source_tag / evidence_id
GitHub Actions 基本流程
public/ 不能放敏感数据
```

### 需要能看懂，但不一定手写

```text
React components
TypeScript types
Tailwind className
Next.js routes
shadcn/ui components
TanStack Table columns
```

### 可以交给 Codex/前端工程师

```text
视觉细节
drawer 动画
command palette
responsive behavior
chart styling
component 抽象
CSS polish
```

### 生产前必须找工程/合规一起做

```text
认证登录
RBAC
数据库
vendor entitlement
Wind/Bloomberg 接入
真实数据授权
审计日志
安全扫描
部署到私有环境
```

---

## 15. 最容易踩坑的地方

### 15.1 把 demo 数据误认为生产数据

解决：所有数据都要有 `source_tag` 和 disclaimer。

### 15.2 前端和 Python schema 不一致

解决：`scripts/schemas.py` 和 `lib/types.ts` 要同步；build_snapshot 必须 validate。

### 15.3 在浏览器里做太多计算

解决：Python 预计算，前端只渲染。

### 15.4 GitHub Pages basePath 问题

GitHub Pages 项目站点通常路径是：

```text
https://owner.github.io/repo/
```

不是根路径 `/`。Next.js 需要配置 `basePath` 和 `assetPrefix`，否则 CSS/JS 路径可能错。

### 15.5 把 secrets 放进 public 或 GitHub logs

解决：第一版完全不使用 secrets；以后 vendor API 只能在私有后端/Actions secrets 里处理，并且不能输出到 public JSON。

### 15.6 动态路由和静态导出

`/etf/[ticker]` 在静态站点中需要 build 时知道 ticker 列表，或者用 client-side lookup。Codex 实现时要注意。

### 15.7 workflow 自己 commit 触发循环

workflow 会 commit snapshot；push 也会触发 workflow。需要确保逻辑不会无限循环。当前设计是只有 schedule/manual 才 commit，push 时只 build。

---

## 16. 你怎么 review Codex 的工作

你不需要逐行看前端，但要按下面 checklist review。

### 数据层

```text
[ ] latest.json 结构符合 schema
[ ] 至少有 US/HK/CN demo ETFs
[ ] 至少一个 red/yellow/green ETF
[ ] 每个 rule breach 有 evidence_ids
[ ] 每个 ticket 有 evidence_ids
[ ] source_tag 都存在
[ ] disclaimer 存在
```

### Python 层

```text
[ ] build_snapshot.py 可重复运行
[ ] as-of 参数有效
[ ] rule evaluator 能处理 abs(value) 规则
[ ] ticket idempotent
[ ] pytest 通过
```

### UI 层

```text
[ ] 首页一眼能看出 red/yellow
[ ] 表格紧凑
[ ] 点击行打开 drawer
[ ] drawer 里能看到原因、规则、ticket、evidence
[ ] Data Quality 页清楚
[ ] disclaimer 明显
```

### 部署层

```text
[ ] pnpm build 生成 out/
[ ] GitHub Actions 可手动运行
[ ] Pages source 设置为 GitHub Actions
[ ] public/data 没有 secrets/vendor data
```

---

## 17. 未来生产化怎么演进

第一版：

```text
GitHub static demo
seed/public-safe data
no auth
no backend
no database
```

第二版：

```text
私有部署
SSO
private object storage snapshots
仍然可以 static frontend
```

第三版：

```text
FastAPI backend
Postgres/TimescaleDB
raw object store
entitlement registry
audit log
```

第四版：

```text
Wind adapter
Bloomberg adapter
exchange official feeds
index provider feeds
corporate action vendor feeds
```

第五版：

```text
LLM evidence service
tool calling
human approval
workflow SLA
compliance review
```

---

## 18. 这版工程的核心设计判断

最重要的判断是：**先不要做一个“软件系统”，先做一个“可每天自动刷新的产品证明”。**

所以我们选择：

```text
Static frontend
+ Python snapshots
+ evidence schema
+ rule engine
+ workflow tickets
+ GitHub daily deployment
```

而不是一开始做：

```text
database
backend API
auth
vendor feeds
LLM API
trading workflow
```

这样可以最快验证：ETF manager 是否真的愿意每天用这个 cockpit 看问题、看原因、看 ticket、看 evidence。

