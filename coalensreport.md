# DASHBOARD SPEC — COALLENS CORE12 (NEXT.JS + PRISMA + RECHARTS)

**Tujuan:** Mendesain dashboard komprehensif untuk *CoalTools* yang menggabungkan **Core 12 coal metrics**, produksi→penjualan, finansial (P\&L/Cash/Balance), working capital, payroll, dan alert—siap dibangun dengan stack: **Next.js App Router + TS, Tailwind + shadcn/ui, Recharts, Prisma + PostgreSQL, API routes, PWA**.

---

## 1) IA & NAVIGASI

**Route utama:** `/dashboard`
**Tabs (shadcn Tabs):**

1. **Executive** — KPI ringkas + tren kunci + alert prioritas.
2. **Unit Economics** — per‑ton lens & bridge Production→Revenue.
3. **Costs** — Cash op cost, AISC, vendor Pareto, price creep.
4. **Working Capital** — DSO/DPO/Days Stockpile, Aging AR/AP, CCC.
5. **Cash & P\&L** — P\&L waterfall, Cashflow runway, Budget vs Actual.
6. **Production** — yield, strip ratio, haul/fuel intensity, quality diff.
7. **Risk & Alerts** — rules, threshold, incident log (weighbridge, demurrage, missing bukti).

**Filter global (Context):** Periode, Site, Buyer/Vendor, Contract type (spot/term), Currency (IDR/USD), Status (approved), View mode (monthly/weekly/daily).

---

## 2) KPI & CHARTS (BY TAB)

### 2.1 Executive

**KPI Cards:** Realized Price/ton, Cash Cost/ton, Royalty/ton, **Cash Margin/ton**, EBITDA/ton & margin %, AISC/ton, **FCF/ton**, Total TON, Revenue, Cash, AR, AP, On‑time WD5.
**Charts:**

* **Close Health** (line burn‑down WD1→WD5 + gauge on‑time).
* **Production→Revenue Waterfall** (Deposit, Adj+/−, TON, Price, Total Revenue).
* **Cashflow Area** (In vs Out, net, runway months).
* **Top Alerts** table (click→drill‑down).

### 2.2 Unit Economics

* **Per‑Ton Lens strip**: Price − Cost − Royalty = Margin → EBITDA → AISC → FCF.
* **Yield & Saleable Tons** (ROM vs Saleable bar + Yield%).
* **Benchmark Differential** (line: Realized − Newcastle ± quality adj).

### 2.3 Costs

* **Cash Operating Cost/ton** (stacked bar: BBM, contractor, maintenance, consumables, logistics, site G\&A).
* **AISC/ton** (add sustaining CAPEX, reclamation, corp OH).
* **Vendor Pareto** (bar 80/20 + flags price creep MoM).
* **Fuel Intensity** (liters/ton) & cost/ton (dual axis).

### 2.4 Working Capital

* **DSO & DPO** (line or bullets), **Days Stockpile** cards.
* **CCC** (computed tile).
* **AR/AP Aging tables** (0–30/31–60/>60) + drill‑down invoice/expense.

### 2.5 Cash & P\&L

* **P\&L Waterfall** (Revenue→COGS→GM→Opex→EBITDA→Other→Net).
* **Budget vs Actual** (bar + variance table) dengan traffic light.
* **Cashflow Direct** (In/Out stacked area) + **Runway** (months at current burn).

### 2.6 Production

* **Strip Ratio** (OB/ROM), **Haul cost / ton‑km** (opsional), **Demurrage % sales**.
* **Quality penalty/bonus** per buyer (scatter/heatmap: ash, sulfur, moisture → \$/ton adj).
* **Ritase & daily net tons** (bar daily + 7d MA).

### 2.7 Risk & Alerts

* **Rules & Threshold** list (editable): Gross\<Tare, missing bukti, AR>60, budget overrun>10%, F/X exposure, demurrage spike.
* **Alert Timeline** + status (open/closed), owner, SLA.

---

## 3) DATA CONTRACTS (TS TYPES)

```ts
export type PeriodFilter = { period: string; site?: string; currency?: 'IDR'|'USD'; };

export type Core12KPI = {
  realizedPricePerTon: number; benchmarkDiff: number; saleableTons: number; yieldPct: number;
  stripRatio: number; cashCostPerTon: number; royaltyPerTon: number; cashMarginPerTon: number;
  ebitdaPerTon: number; ebitdaMarginPct: number; aiscPerTon: number; fcf: number; fcfPerTon: number;
  netDebt: number; netDebtToEbitda: number; interestCover: number;
};

export type FinanceSummary = {
  revenue: number; cogs: number; opex: number; ebitda: number; netIncome: number;
  cashIn: number; cashOut: number; cashClosing: number; ar: number; ap: number; ccc: number;
};

export type AlertsItem = { id: string; type: string; severity: 'low'|'med'|'high'; message: string; createdAt: string; ref?: { kind: 'invoice'|'expense'|'weigh'; id: string } };
```

---

## 4) API ENDPOINTS (NEXT.JS APP ROUTER)

```
GET /api/dashboard/summary?period=2025-08&site=ALL
→ { kpi: Core12KPI, finance: FinanceSummary, productionBridge: {...}, alerts: AlertsItem[] }

GET /api/dashboard/expense-by-cat?period=...&site=...
GET /api/dashboard/vendor-pareto?period=...
GET /api/dashboard/unit-economics?period=...
GET /api/dashboard/working-capital?period=...
GET /api/dashboard/benchmark-diff?period=...&buyer=...
```

**Praktik:** Zod validate query/body; SWR dengan `revalidate: 60s`; privilege check (RBAC) di handler.

---

## 5) PRISMA SCHEMA (RINGKAS + INDEX)

> Tambahkan index untuk performa dashboard.

```prisma
model Expense { id String @id @default(cuid())
  tanggal DateTime @index
  siteId String @index
  jenis String @index
  sub_jenis String @index
  total Decimal @db.Numeric(18,2)
  status String @default("approved") @index
}

model WeighTransaction { id String @id @default(cuid())
  tanggal DateTime @index
  nopol String? @index
  buyerId String? @index
  grossTon Decimal @db.Numeric(12,3)
  tareTon  Decimal @db.Numeric(12,3)
  nettoTon Decimal @db.Numeric(12,3)
}

model Invoices { id String @id @default(cuid())
  invoiceDate DateTime @index
  grandTotal Decimal @db.Numeric(18,2)
  paidAmount Decimal @db.Numeric(18,2) @default(0)
  status String @index
}

model Payments { id String @id @default(cuid())
  date DateTime @index
  type String @index
  source String @index
  refId String? @index
  amount Decimal @db.Numeric(18,2)
}

model AccountMap { id String @id @default(cuid())
  jenis String
  sub_jenis String
  pnl_group String @index
  pnl_line  String
  is_capex Boolean @default(false)
}
```

---

## 6) SQL VIEWS/MATERIALIZED VIEWS (CORE 12)

```sql
-- 1 Realized price/ton & 2 Benchmark differential
CREATE MATERIALIZED VIEW mv_price_per_ton AS
SELECT p.id period_id,
       SUM(vs.total_harga)     AS revenue,
       MAX(vs.harga_ton)       AS realized_price_ton,
       MAX(bm.price_ton)       AS benchmark_price_ton,
       MAX(vs.harga_ton - bm.price_ton) AS benchmark_diff
FROM v_sales_value vs
JOIN productionperiod p ON p.id=vs.period_id
LEFT JOIN benchmark_price bm ON bm.month=date_trunc('month', p.start_date)
GROUP BY 1;

-- 3 Saleable tons & yield
CREATE MATERIALIZED VIEW mv_yield AS
SELECT period_id,
       SUM(rom_ton) AS rom_ton,
       SUM(saleable_ton) AS saleable_ton,
       CASE WHEN SUM(rom_ton)=0 THEN 0 ELSE 100.0*SUM(saleable_ton)/SUM(rom_ton) END AS yield_pct
FROM production_yield GROUP BY 1;

-- 4 Strip ratio (OB/ROM)
CREATE MATERIALIZED VIEW mv_strip_ratio AS
SELECT period_id,
       SUM(overburden_ton) / NULLIF(SUM(rom_ton),0) AS strip_ratio
FROM mining_operating_stats GROUP BY 1;

-- 5 Cash operating cost/ton
CREATE MATERIALIZED VIEW mv_cash_cost AS
SELECT date_trunc('month', e.tanggal) m,
       SUM(e.total) FILTER (WHERE am.pnl_group='COGS' AND am.pnl_line IN ('Fuel','Hauling','Maintenance','Consumables','Site G&A')) AS cash_cost,
       (SELECT ton_after_adj FROM v_sales_value vs JOIN productionperiod p ON p.id=vs.period_id WHERE date_trunc('month',p.start_date)=m LIMIT 1) AS tons
FROM expense e JOIN accountmap am ON (am.jenis=e.jenis AND am.sub_jenis=e.sub_jenis)
WHERE e.status='approved' GROUP BY 1;

-- 6 Royalty & levies / ton
CREATE MATERIALIZED VIEW mv_royalty AS
SELECT date_trunc('month', e.tanggal) m,
       SUM(e.total) AS royalty_amount,
       (SELECT ton_after_adj FROM v_sales_value vs JOIN productionperiod p ON p.id=vs.period_id WHERE date_trunc('month',p.start_date)=m LIMIT 1) AS tons
FROM expense e JOIN accountmap am ON am.pnl_line='Royalty' WHERE e.status='approved' GROUP BY 1;

-- 7 Cash margin/ton
CREATE MATERIALIZED VIEW mv_cash_margin AS
SELECT p.m,
       pr.realized_price_ton - (cc.cash_cost/cc.tons) - (ry.royalty_amount/ry.tons) AS cash_margin_ton
FROM (SELECT DISTINCT date_trunc('month', start_date) m, id FROM productionperiod) p
JOIN mv_price_per_ton pr ON pr.period_id = p.id
JOIN mv_cash_cost cc ON cc.m = p.m
JOIN mv_royalty  ry ON ry.m = p.m;

-- 8 EBITDA/ton & margin
CREATE MATERIALIZED VIEW mv_ebitda AS
SELECT m,
       (rev.revenue - cogs.cogs - opex.opex) AS ebitda,
       (rev.revenue - cogs.cogs - opex.opex) / NULLIF(rev.revenue,0) AS ebitda_margin,
       (rev.revenue - cogs.cogs - opex.opex) / NULLIF(cc.tons,0) AS ebitda_per_ton
FROM v_revenue_monthly rev
LEFT JOIN (
  SELECT date_trunc('month',e.tanggal) m, SUM(e.total) cogs
  FROM expense e JOIN accountmap am ON am.pnl_group='COGS' AND am.jenis=e.jenis AND am.sub_jenis=e.sub_jenis
  WHERE e.status='approved' GROUP BY 1
) cogs USING (m)
LEFT JOIN (
  SELECT date_trunc('month',e.tanggal) m, SUM(e.total) opex
  FROM expense e JOIN accountmap am ON am.pnl_group='OPEX' AND am.jenis=e.jenis AND am.sub_jenis=e.sub_jenis
  WHERE e.status='approved' GROUP BY 1
) opex USING (m)
LEFT JOIN mv_cash_cost cc USING (m);

-- 9 AISC/ton (add sustaining capex, reclamation, corp OH)
CREATE MATERIALIZED VIEW mv_aisc AS
SELECT m,
  (cash_cost + capex_sustain + reclamation + corp_oh) / NULLIF(tons,0) AS aisc_per_ton
FROM (
  SELECT cc.m, cc.cash_cost, cc.tons,
         COALESCE(SUM(e.total) FILTER (WHERE am.pnl_line='Sustaining CAPEX'),0) AS capex_sustain,
         COALESCE(SUM(e.total) FILTER (WHERE am.pnl_line='Reclamation'),0) AS reclamation,
         COALESCE(SUM(e.total) FILTER (WHERE am.pnl_line='Corporate OH'),0) AS corp_oh
  FROM mv_cash_cost cc
  LEFT JOIN expense e ON date_trunc('month', e.tanggal)=cc.m AND e.status='approved'
  LEFT JOIN accountmap am ON am.jenis=e.jenis AND am.sub_jenis=e.sub_jenis
  GROUP BY 1,2,3
) x;

-- 10 CCC (DSO + Days Stockpile − DPO)
CREATE MATERIALIZED VIEW mv_working_capital AS
SELECT m,
  (ar / NULLIF(sales/30.0,0))    AS dso,
  (stockpile_ton / NULLIF(avg_ship_ton,0)) AS days_stock,
  (ap / NULLIF(cogs_cash/30.0,0)) AS dpo,
  ((ar / NULLIF(sales/30.0,0)) + (stockpile_ton / NULLIF(avg_ship_ton,0)) - (ap / NULLIF(cogs_cash/30.0,0))) AS ccc
FROM wc_inputs; -- materialized from invoices, shipments, expenses

-- 11 FCF & 12 Leverage ratios → views gabungan dari cashflow & balance
```

> **Catatan:** refresh MV via cron (hourly) atau `REFRESH MATERIALIZED VIEW CONCURRENTLY` setelah impor.

---

## 7) KOMPONEN UI (REACT + SHADCN) — NAMA & PERAN

* `DashboardShell` — layout grid responsif + FilterBar context.
* `KPIStat` — card angka + delta.
* `ChartCard` — wrapper (title, toolbar, export menu).
* `WaterfallChart`, `StackedBarChart`, `LineAreaChart`, `DonutChart`, `ParetoChart`, `HeatTable` (Recharts + tables).
* `DataTableDrawer` — drill‑down transaksi (server‑side paginate, export CSV).
* `AlertList` — filter by severity/type, quick action (assign/close).

---

## 8) CONTOH KOMPONEN (TSX RINGKAS)

```tsx
// app/(dashboard)/_components/KPIStat.tsx
export function KPIStat({ label, value, suffix, delta }: {label:string; value:number; suffix?:string; delta?:number;}) {
  return (
    <div className="rounded-2xl border p-4 shadow-sm">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold mt-1">{Intl.NumberFormat('id-ID').format(value)}{suffix}</div>
      {delta!==undefined && <div className={`text-xs mt-1 ${delta>=0?'text-green-600':'text-red-600'}`}>{delta>=0?'+':''}{delta}%</div>}
    </div>
  );
}
```

```tsx
// app/api/dashboard/summary/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const Q = z.object({ period: z.string(), site: z.string().optional() });
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const parse = Q.safeParse({ period: searchParams.get('period') || '', site: searchParams.get('site')||undefined });
  if (!parse.success) return NextResponse.json({ success:false, error:'Invalid query' }, { status:400 });
  const { period, site } = parse.data;
  // contoh: tarik dari MV + views
  const kpi = await prisma.$queryRawUnsafe<any>(`SELECT * FROM core12_summary($1,$2)`, period, site||'ALL');
  const alerts = await prisma.alerts.findMany({ take: 50, orderBy:{ createdAt:'desc' }});
  return NextResponse.json({ success:true, data: { kpi, alerts } });
}
```

---

## 9) EXPORT (EXCEL/PDF)

* `utils/exportToExcel.ts` (lib `xlsx`): multi‑sheet **KPI\_Charts**, **Transactions**, **Aging**, **Budget**.
* `utils/exportToPDF.ts` (html2canvas + jsPDF) untuk snapshot dashboard/slide meeting.

---

## 10) ALERT ENGINE (RINGKAS)

**Input:** rule JSON (`type, threshold, comparator, window, severity`).
**Evaluator:** job cron (per jam) menulis `alerts` (open) + webhook ke Bot.
Contoh rule: `{"type":"AR_DAYS","threshold":60,"comparator":">","severity":"high"}`.

---

## 11) PERF & SECURITY

* MV + index; paginasi server; `SELECT` minimal kolom.
* Cache SWR per 60s; edge cache untuk statik.
* RBAC guard di API + komponen (feature gates).
* Mask PII di log; signed URL untuk dokumen.

---

## 12) QA & ACCEPTANCE (MVP)

* Semua KPI Core 12 **match** dengan Excel sumber (±0.1%).
* Drill‑down bekerja dari setiap chart → tabel transaksi relevan.
* Export Excel tanpa error; ukuran file < 5 MB untuk 10k baris.
* Respon API p95 < 800ms di data 50k baris; liveness/health OK.
* A11y dasar (keyboard, aria, kontras); dark mode OK.

---

## 13) PROMPTS UNTUK AI CODING ASSISTANT

1. **Buat MV & views Core12**
   “Generate SQL untuk MV `mv_price_per_ton`, `mv_yield`, `mv_strip_ratio`, `mv_cash_cost`, `mv_royalty`, `mv_ebitda`, `mv_aisc`, `mv_working_capital` sesuai ERD dan tambahkan index.”

2. **Endpoint summary**
   “Implement `/api/dashboard/summary` (Zod validate, Prisma raw ke fungsi `core12_summary(period,site)`, return `Core12KPI` + `AlertsItem[]`).”

3. **Komponen ChartCard + Recharts**
   “Buat `ChartCard` (title, toolbar, children) dan `WaterfallChart` untuk P\&L dan Production Bridge (ComposedChart).”

4. **Drill‑down datatable**
   “Buat `DataTableDrawer` dengan server pagination (Prisma), kolom: tanggal, jenis/sub‑jenis, vendor/buyer, total/ton, status; tombol export CSV.”

5. **Alert Engine + Bot**
   “Buat tabel `alerts`, job cron evaluator dari MV/threshold, webhook WA/Telegram untuk notify & ack.”

---

## 14) ROADMAP BUILD (7–10 HARI)

1. Schema & MV inti + endpoint `/summary`.
2. FilterBar + KPI cards + Executive tab.
3. Unit Economics & Production Bridge.
4. Costs (stacked cost/ton, vendor Pareto) + drill‑down.
5. Working Capital (aging + CCC).
6. Cash & P\&L (waterfall, budget vs actual).
7. Alerts engine + export Excel/PDF + hardening.
