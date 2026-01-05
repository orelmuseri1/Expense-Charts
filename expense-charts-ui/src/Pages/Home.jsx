import React, { useMemo, useRef, useState } from "react";
import { Upload, FileSpreadsheet, Trash2, Sparkles } from "lucide-react";
import * as XLSX from "xlsx";
import ExpenseCharts from "../Components/ExpenseCharts";
import ExpenseTable from "../Components/ExpenseTable";
import AiClassificationResults from "../Components/AiClassificationResults";
import { analyzeExpensesWithLLM } from "../api/analyzeExpenses";

export default function Home() {
  const analyzeEndpoint =
    import.meta.env?.VITE_ANALYZE_URL || "http://localhost:11434/api/generate";

  const [isUploading, setIsUploading] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [isLoading] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState(null);
  const fileRef = useRef(null);

  const normalizeHeader = (h) =>
    String(h ?? "")
      .replace(/\s+/g, " ")
      .replace(/\n/g, " ")
      .trim();

  const parseExcelDate = (v) => {
    if (!v) return null;

    if (typeof v === "number") {
      const d = XLSX.SSF.parse_date_code(v);
      if (!d) return null;
      return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
    }

    if (v instanceof Date && !isNaN(v.getTime())) {
      const y = v.getFullYear();
      const m = String(v.getMonth() + 1).padStart(2, "0");
      const d = String(v.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }

    return String(v).trim();
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { cellDates: true });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      // Read as rows (array-of-arrays) so we can find the REAL header row
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true });

      // Find header row
      const headerRowIndex = rows.findIndex((r) => {
        const rowStr = (r || []).map(normalizeHeader);
        return (
          rowStr.some((x) => x.includes("תאריך") && x.includes("עסקה")) &&
          rowStr.some((x) => x.includes("שם") && x.includes("בית") && x.includes("עסק")) &&
          rowStr.some((x) => x.includes("סכום"))
        );
      });

      if (headerRowIndex === -1) {
        alert("לא הצלחתי לזהות את שורת הכותרות בקובץ. בדוק שהקובץ הוא פירוט עסקאות תקין.");
        return;
      }

      const header = rows[headerRowIndex].map(normalizeHeader);

      const colIndex = (nameIncludes) =>
        header.findIndex((h) => nameIncludes.every((p) => h.includes(p)));

      const idxDate = colIndex(["תאריך", "עסקה"]);
      const idxBusiness = colIndex(["שם", "בית", "עסק"]);
      const idxAmount = colIndex(["סכום"]);
      const idxCharge = colIndex(["מועד", "חיוב"]);
      const idxType = colIndex(["סוג", "עסקה"]);
      const idxWallet = colIndex(["מזהה", "ארנק"]);
      const idxNotes = colIndex(["הערות"]);

      const parsed = rows
        .slice(headerRowIndex + 1)
        .filter(
          (r) =>
            r &&
            r.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== "")
        )
        // ✅ Ignore any row that contains "סה״כ"
        .filter((r) => {
          const joined = r.map((c) => String(c ?? "")).join(" ");
          return !(joined.includes('סה"כ') || joined.includes("סה״כ") || joined.includes("סהכ"));
        })
        .map((r) => {
          const amountVal = r[idxAmount];
          const amount =
            typeof amountVal === "number"
              ? amountVal
              : parseFloat(String(amountVal ?? "").replace(/,/g, ""));

          return {
            id:
              typeof crypto !== "undefined" && crypto.randomUUID
                ? crypto.randomUUID()
                : String(Math.random()).slice(2),
            transaction_date: parseExcelDate(r[idxDate]),
            business_name: r[idxBusiness] ? String(r[idxBusiness]).trim() : "",
            amount: Number.isFinite(amount) ? amount : 0,
            charge_date: parseExcelDate(r[idxCharge]),
            transaction_type: r[idxType] ? String(r[idxType]).trim() : "",
            digital_wallet: r[idxWallet] ? String(r[idxWallet]).trim() : "",
            notes: r[idxNotes] ? String(r[idxNotes]).trim() : "",
          };
        });

      setExpenses(parsed);
    } catch (error) {
      console.error("Error processing file:", error);
      alert("שגיאה בעיבוד הקובץ");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };
  const totalAmount = useMemo(
    () => expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
    [expenses]
  );
  const avgAmount = expenses.length ? totalAmount / expenses.length : 0;

  const deleteAll = () => setExpenses([]);
  const openFilePicker = () => fileRef.current?.click();

  const handleRunAi = async () => {
    if (isAiProcessing || expenses.length === 0) return;

    setIsAiProcessing(true);
    setAiError(null);

    try {
      const analysis = await analyzeExpensesWithLLM(expenses);
      setAiResult(analysis);
    } catch (error) {
      console.error("AI analysis failed", error);
      setAiError(error.message || "שגיאה בהרצת ניתוח ה-AI");
    } finally {
      setIsAiProcessing(false);
    }
  };

  return (
    <div dir="rtl">
      {/* Upload Section */}
      <div className="card">
        <div className="cardHeader">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <FileSpreadsheet size={20} />
            העלאת קובץ Excel
          </span>
        </div>

        <div className="cardContent">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="fileInput"
            disabled={isUploading}
          />

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <button className="btn" onClick={openFilePicker} disabled={isUploading}>
              <Upload size={16} />
              {isUploading ? "מעלה..." : "בחר קובץ"}
            </button>

            {expenses.length > 0 && (
              <button className="btn btnDanger" onClick={deleteAll}>
                <Trash2 size={16} />
                מחק הכל
              </button>
            )}
          </div>

          <div style={{ marginTop: 10, color: "var(--muted)", fontSize: 13 }}>
            פורמטים נתמכים: xlsx / xls
          </div>
        </div>
      </div>

      {/* Summary */}
      {expenses.length > 0 && (
        <div className="card">
          <div className="cardHeader">סיכום</div>
          <div className="cardContent">
            <div className="stats">
              <div className="stat">
                <small>סה"כ הוצאות</small>
                <strong>
                  ₪{totalAmount.toLocaleString("he-IL", { maximumFractionDigits: 2 })}
                </strong>
              </div>

              <div className="stat">
                <small>מספר עסקאות</small>
                <strong>{expenses.length}</strong>
              </div>

              <div className="stat">
                <small>ממוצע לעסקה</small>
                <strong>
                  ₪{avgAmount.toLocaleString("he-IL", { maximumFractionDigits: 2 })}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      {expenses.length > 0 && <ExpenseCharts expenses={expenses} />}

      {/* Table */}
      {expenses.length > 0 && <ExpenseTable expenses={expenses} />}

      {expenses.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="cardHeader" style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Sparkles size={18} />
            ניתוח AI לקטגוריזציה
            <span className="aiBadge subtle">הנתונים נשלחים ל-LLM מקומי</span>
          </div>
          <div className="cardContent">
            <div className="tableSub" style={{ marginBottom: 10 }}>
              שלח את פירוט ההוצאות ל-LLM מקומי (ברירת מחדל: {analyzeEndpoint} או ערך
              <code style={{ marginInline: 4 }}>VITE_ANALYZE_URL</code>) שמריץ את המודל
              <strong style={{ marginInline: 4 }}>LLaMA 3 8B</strong> דרך Ollama. ודא שהשירות פעיל למשל עם
              <code style={{ marginInline: 4 }}>ollama run llama3:8b</code> לפני ההרצה כדי לקבל קטגוריות יעד כגון
              רכב, קניות, בילויים וחופשות.
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <button
                className="btn btnDanger"
                onClick={handleRunAi}
                disabled={isAiProcessing}
                style={{ minWidth: 220 }}
              >
                {isAiProcessing ? "מריץ ניתוח AI..." : "ניתוח AI לקטגוריות"}
              </button>
              {aiError && <span className="aiError">{aiError}</span>}
              {isAiProcessing && <span className="mutedText">מנתח את הנתונים מול ה-LLM...</span>}
              {!isAiProcessing && aiResult && (
                <span className="aiSuccess">הושלם! הנתונים למטה</span>
              )}
            </div>

            {aiResult && <AiClassificationResults result={aiResult} />}
          </div>
        </div>
      )}

      {/* Empty State */}
      {expenses.length === 0 && !isLoading && (
        <div className="card">
          <div className="cardContent" style={{ textAlign: "center", padding: 44 }}>
            <div style={{ opacity: 0.65, marginBottom: 10 }}>
              <FileSpreadsheet size={54} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>
              אין נתונים להצגה
            </div>
            <div style={{ color: "var(--muted)" }}>העלה קובץ Excel כדי להתחיל</div>
          </div>
        </div>
      )}
    </div>
  );
}
