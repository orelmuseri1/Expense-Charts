import React, { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

export default function ExpenseTable({ expenses }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const filteredExpenses = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return expenses;

    return expenses.filter(
      (expense) =>
        expense.business_name?.toLowerCase().includes(term) ||
        expense.transaction_type?.toLowerCase().includes(term) ||
        expense.notes?.toLowerCase().includes(term)
    );
  }, [expenses, searchTerm]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredExpenses.length / pageSize)),
    [filteredExpenses.length]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, expenses]);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const pagedExpenses = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredExpenses.slice(startIndex, startIndex + pageSize);
  }, [currentPage, filteredExpenses]);

  const startIndex = filteredExpenses.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, filteredExpenses.length);

  return (
    <div className="card">
      <div className="cardHeader tableHeader">
        <div>
          <div className="tableTitle">כל העסקאות</div>
          <div className="tableSub">חיפוש חכם לפי שם עסק, סוג עסקה או הערות</div>
        </div>

        <label className="searchWrap">
          <Search size={16} className="searchIcon" />
          <input
            className="input searchInput"
            placeholder="חפש..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </label>
      </div>

      <div className="cardContent">
        {filteredExpenses.length === 0 ? (
          <div className="emptyState">
            לא נמצאו עסקאות תואמות לחיפוש
          </div>
        ) : (
          <>
            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>תאריך</th>
                    <th>בית עסק</th>
                    <th>סכום</th>
                    <th>סוג עסקה</th>
                    <th>מועד חיוב</th>
                    <th>הערות</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedExpenses.map((expense) => (
                    <tr key={expense.id}>
                      <td>{expense.transaction_date}</td>
                      <td className="text-strong">{expense.business_name}</td>
                      <td className="tableAmount">
                        ₪{expense.amount?.toLocaleString("he-IL", { maximumFractionDigits: 2 })}
                      </td>
                      <td>{expense.transaction_type}</td>
                      <td>{expense.charge_date}</td>
                      <td className="mutedText">{expense.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="tableFooter">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <button
                  className="btn"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{ minWidth: 100 }}
                >
                  הקודם
                </button>
                <div style={{ minWidth: 180, textAlign: "center" }}>
                  מציג {startIndex}-{endIndex} מתוך {filteredExpenses.length} עסקאות
                </div>
                <button
                  className="btn"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || filteredExpenses.length === 0}
                  style={{ minWidth: 100 }}
                >
                  הבא
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
