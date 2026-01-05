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
      .slice(0, 10)
      .reverse();
  }, [expenses]);

  const ROW_H = 30;
  const CHART_H = Math.max(240, data.length * ROW_H + 60);

  if (!data.length) {
    return (
      <div style={{ color: "var(--muted)", fontSize: 14, padding: "6px 0" }}>
        אין מספיק נתונים להצגת בתי עסק מובילים.
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
      {/* Names (outside chart) */}
      <div
        style={{
          display: "grid",
          gridAutoRows: `${ROW_H}px`,
          paddingTop: 18,
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

      {/* Bars only */}
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

function TypeBreakdownChart({ expenses }) {
  const data = useMemo(() => {
    const map = new Map();

    for (const e of expenses || []) {
      const rawType = (e?.transaction_type || "").trim();
      const type = rawType || "לא מסווג";
      if (includesTotal(type)) continue;

      const amt = Number(e?.amount) || 0;
      if (amt <= 0) continue;

      map.set(type, (map.get(type) || 0) + amt);
    }

    const arr = Array.from(map.entries())
      .map(([name, total]) => ({ name, short: truncate(name, 26), total }))
      .sort((a, b) => b.total - a.total);

    // Top 8 + "אחר"
    const top = arr.slice(0, 8);
    const rest = arr.slice(8);
    const restSum = rest.reduce((s, x) => s + x.total, 0);
    if (restSum > 0) top.push({ name: "אחר", short: "אחר", total: restSum });

    // Reverse for nicer top-down bars in vertical layout
    return top.reverse();
  }, [expenses]);

  const ROW_H = 30;
  const CHART_H = Math.max(240, data.length * ROW_H + 60);

  if (!data.length) return null;

  return (
    <div style={{ height: CHART_H }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 18, right: 36, left: 90, bottom: 18 }}
          barCategoryGap={8}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
          <XAxis
            type="number"
            tick={{ fill: "rgba(255,255,255,0.78)", fontSize: 12 }}
            tickFormatter={formatILS}
          />
          <YAxis
            type="category"
            dataKey="short"
            width={90}
            tick={{ fill: "rgba(255,255,255,0.78)", fontSize: 12 }}
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
              item?.payload?.name || "סוג עסקה",
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
  );
}

export default function ExpenseCharts({ expenses }) {
  return (
    <div className="card">
      <div className="cardHeader">גרפים</div>
      <div className="cardContent">
        <div style={{ fontWeight: 800, marginBottom: 10 }}>10 בתי העסק המובילים</div>
        <TopMerchantsOutside expenses={expenses} />

        <div style={{ height: 16 }} />

        <div style={{ fontWeight: 800, marginBottom: 10 }}>חלוקה לפי סוג עסקה</div>
        <TypeBreakdownChart expenses={expenses} />

        <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 10 }}>
          * הסכומים מסוננים כך ששורות/קטגוריות שמכילות “סה״כ” לא נכנסות לניתוח.
        </div>
      </div>
    </div>
  );
}
