import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
} from "recharts";

const truncate = (s, n = 26) => {
  const str = String(s || "").trim();
  return str.length > n ? str.slice(0, n - 1) + "…" : str;
};

const formatILS = (n) =>
  `₪${Number(n || 0).toLocaleString("he-IL", { maximumFractionDigits: 0 })}`;

const tooltipStyle = {
  background: "rgba(12, 15, 28, 0.95)",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 12,
  color: "white",
  padding: "10px 12px",
  boxShadow: "0 10px 28px rgba(0,0,0,0.35)",
  textAlign: "right",
};

const includesTotal = (text) => {
  const t = String(text || "");
  return t.includes('סה"כ') || t.includes("סה״כ") || t.includes("סהכ");
};

function TopMerchantsOutside({ expenses }) {
  const data = useMemo(() => {
    const map = new Map();

    for (const e of expenses || []) {
      const rawName = (e?.business_name || "").trim();
      const name = rawName || "לא ידוע";
      if (includesTotal(name)) continue;

      const amt = Number(e?.amount) || 0;
      if (amt <= 0) continue;
      if (!rawName) continue; // נציג רק בתי עסק אמיתיים

      map.set(name, (map.get(name) || 0) + amt);
    }

    return Array.from(map.entries())
      .map(([name, total]) => ({ name, short: truncate(name, 30), total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [expenses]);

  const BAR_SIZE = 18;
  const CATEGORY_GAP = 16;
  const PLOT_MARGIN = 12;
  const innerHeight =
    data.length * BAR_SIZE + Math.max(0, data.length - 1) * CATEGORY_GAP;
  const CHART_H = Math.max(260, innerHeight + PLOT_MARGIN * 2);

  if (!data.length) {
    return (
      <div style={{ color: "var(--muted)", fontSize: 14, padding: "6px 0" }}>
        אין מספיק נתונים להצגת בתי עסק מובילים.
      </div>
    );
  }

  return (
    <div className="merchantLayout" style={{ height: CHART_H }}>
      <div className="merchantChartArea" style={{ height: CHART_H }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: PLOT_MARGIN, right: 52, left: 10, bottom: PLOT_MARGIN }}
            barCategoryGap={CATEGORY_GAP}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
            <XAxis
              type="number"
              tick={{ fill: "rgba(255,255,255,0.78)", fontSize: 12 }}
              tickFormatter={formatILS}
            />
            <YAxis type="category" dataKey="short" hide />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.06)" }}
              contentStyle={tooltipStyle}
              itemStyle={{ color: "#e2e8f0", fontWeight: 700, padding: 0 }}
              formatter={(value, _, item) => [
                formatILS(value),
                item?.payload?.name || "בית עסק",
              ]}
              labelFormatter={() => ""}
            />
            <Bar dataKey="total" radius={[10, 10, 10, 10]} barSize={BAR_SIZE}>
              <LabelList
                dataKey="total"
                position="right"
                formatter={formatILS}
                fill="rgba(255,255,255,0.85)"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div
        className="merchantLabels"
        style={{
          height: CHART_H,
          gridAutoRows: `${BAR_SIZE}px`,
          rowGap: `${CATEGORY_GAP}px`,
          padding: `${PLOT_MARGIN}px 10px`,
          boxSizing: "border-box",
        }}
        aria-hidden="true"
      >
        {data.map((item, idx) => (
          <div key={item.name} className="merchantLabelRow" title={item.name}>
            <span className="merchantLabelRank">{idx + 1}</span>
            <span className="merchantLabelName">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ExpenseCharts({ expenses }) {
  return (
    <div className="card">
      <div className="cardHeader">גרפים</div>
      <div className="cardContent">
        <div style={{ fontWeight: 800, marginBottom: 10 }}>10 בתי העסק המובילים</div>
        <TopMerchantsOutside expenses={expenses} />

        <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 10 }}>
          * הסכומים מסוננים כך ששורות/קטגוריות שמכילות “סה״כ” לא נכנסות לניתוח.
        </div>
      </div>
    </div>
  );
}
