import React from "react";

function CategorySummary({ categories }) {
  if (!categories?.length) return null;

  return (
    <div className="stats" style={{ marginTop: 12 }}>
      {categories.map((cat) => (
        <div key={cat.name} className="stat aiStat">
          <small>{cat.name}</small>
          <strong>
            ₪{Number(cat.total || 0).toLocaleString("he-IL", { maximumFractionDigits: 2 })}
          </strong>
          <div className="mutedText">{cat.count} עסקאות</div>
        </div>
      ))}
    </div>
  );
}

function TransactionsTable({ transactions }) {
  if (!transactions?.length) return null;

  return (
    <div className="tableWrap" style={{ marginTop: 16 }}>
      <table>
        <thead>
          <tr>
            <th style={{ width: 140 }}>תאריך</th>
            <th>שם העסק</th>
            <th style={{ width: 120 }}>סכום</th>
            <th style={{ width: 200 }}>קטגוריה שסווגה</th>
            <th>הערות</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((txn) => (
            <tr key={txn.id}>
              <td>{txn.transaction_date || ""}</td>
              <td>{txn.business_name || ""}</td>
              <td className="tableAmount">
                ₪{Number(txn.amount || 0).toLocaleString("he-IL", { maximumFractionDigits: 2 })}
              </td>
              <td>
                <span className="aiBadge subtle">{txn.category || ""}</span>
              </td>
              <td className="mutedText">{txn.notes || ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AiClassificationResults({ result }) {
  if (!result) return null;

  const { categories, transactions, modelNotes } = result;

  return (
    <div className="aiResults">
      <div className="aiResultsHeader">
        <div>
          <div className="aiBadge">AI</div>
          <div className="tableSub" style={{ marginTop: 6 }}>
            הנתונים מבוססים על ניתוח AI מקומי של הקובץ שהעלית
          </div>
        </div>
        {modelNotes && <div className="aiNotes">{modelNotes}</div>}
      </div>

      <CategorySummary categories={categories} />
      <TransactionsTable transactions={transactions} />
    </div>
  );
}
