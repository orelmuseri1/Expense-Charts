import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
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
      .slice(0, 10)
      .reverse(); // כדי שהגדול יהיה למעלה יפה
  }, [expenses]);

  const ROW_H = 30;
  const CHART_H = Math.max(220, data.length * ROW_H + 60);

  if (!data.length) {
    return (
      <div style={{ color: "var(--muted)", fontSize: 14, padding: "8px 0" }}>
        אין נתונים להצגת “בתי עסק מובילים” (אולי כל הסכומים 0 או שהשמות ריקים).
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "260px 1fr",
        gap: 14,
        alignItems: "start",
      }}
    >
      {/* Names column OUTSIDE chart - 1 row per bar */}
      <div
        style={{
          display: "grid",
          gridAutoRows: `${ROW_H}px`,
          paddingTop: 18, // align with chart top
        }}
      >
        {data.map((row) => (
          <div
            key={row.name}
            title={row.name}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              color: "rgba(255,255,255,0.82)",
              fontSize: 12,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              paddingLeft: 10,
            }}
          >
            {row.short}
          </div>
        ))}
      </div>

      {/* Chart only bars */}
      <div style={{ height: CHART_H }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 18, right: 36, left: 0, bottom: 18 }}
            barCategoryGap={8}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
            <XAxis
              type="number"
              tick={{ fill: "rgba(255,255,255,0.78)", fontSize: 12 }}
              tickFormatter={formatILS}
            />
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
