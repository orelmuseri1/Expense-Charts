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

const includesTotal = (text) => {
  const t = String(text || "");
  return t.includes('סה"כ') || t.includes("סה״כ") || t.includes("סהכ");
};

export default function TopMerchantsOutside({ expenses }) {
  const data = useMemo(() => {
    const map = new Map();

    for (const e of expenses || []) {
      const rawName = (e?.business_name || "").trim();
      const name = rawName || "לא ידוע";

      // ✅ ignore totals rows/labels
      if (includesTotal(name)) continue;

      const amt = Number(e?.amount) || 0;
      // ✅ ignore empty/zero rows
      if (amt <= 0) continue;
      if (!rawName) continue; // רוצה רק בתי עסק אמיתיים

      map.set(name, (map.get(name) || 0) + amt);
    }

    return Array.from(map.entries())
      .map(([name, total]) => ({
        name,
        short: truncate(name, 30),
        total,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10); // שמירה על סדר יורד כך שהגבוהים למעלה
  }, [expenses]);

  const ROW_H = 42;
  const BAR_SIZE = 18;
  const CHART_H = Math.max(260, data.length * ROW_H + 32);
  const CATEGORY_GAP = Math.max(ROW_H - BAR_SIZE, 12);

  if (!data.length) {
    return (
      <div style={{ color: "var(--muted)", fontSize: 14, padding: "8px 0" }}>
        אין נתונים להצגת “בתי עסק מובילים” (אולי כל הסכומים 0 או שהשמות ריקים).
      </div>
    );
  }

  return (
    <div className="merchantLayout" style={{ height: CHART_H }}>
      <div
        className="merchantLabels"
        style={{
          height: CHART_H,
          gridTemplateRows: `repeat(${data.length}, ${ROW_H}px)`,
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

      <div className="merchantChartArea" style={{ height: CHART_H }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 12, right: 52, left: 10, bottom: 12 }}
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
              contentStyle={{
                background: "rgba(10, 12, 20, 0.92)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12,
                color: "white",
              }}
              formatter={(value, _, item) => [
                formatILS(value),
                item?.payload?.name || "בית עסק",
              ]}
              labelFormatter={() => ""}
            />
            <Bar dataKey="total" radius={[10, 10, 10, 10]} barSize={18}>
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
    </div>
  );
}
