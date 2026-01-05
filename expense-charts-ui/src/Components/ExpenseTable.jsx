import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";

export default function ExpenseTable({ expenses }) {
  const [searchTerm, setSearchTerm] = useState("");

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
                  {filteredExpenses.map((expense) => (
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
              מציג {filteredExpenses.length} מתוך {expenses.length} עסקאות
            </div>
          </>
        )}
      </div>
    </div>
  );
}
