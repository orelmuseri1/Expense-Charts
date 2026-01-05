const TARGET_CATEGORIES = [
  "רכב",
  "קניות",
  "בילויים",
  "חופשות",
  "אוכל ומשקאות",
  "דיור",
  "שירותים",
  "בריאות",
  "חינוך",
  "אחר",
];

const buildPrompt = () =>
  `אתה מסווג הוצאות אישיות לקטגוריות יעד ברורות: ${TARGET_CATEGORIES.join(
    ", "
  )}. החזר סיכום קטגוריות (שם, סכום מצטבר, ספירה) ורשימת עסקאות עם שדה category עבור כל עסקה. התמקד בהגדרות: רכב=דלק/טיפולים, קניות=סופר/חנויות, בילויים=מסעדות/ברים/תרבות, חופשות=טיסות/מלונות, ושיבוץ יתר בהתאם לנ"ל.`;

const normalizeTransactions = (rawItems = []) => {
  const transactions = rawItems.map((item, idx) => ({
    id: item.id ?? String(idx + 1),
    transaction_date: item.transaction_date ?? item.date ?? "",
    business_name: item.business_name ?? item.description ?? "",
    amount: Number(item.amount) || 0,
    category:
      item.category || item.assigned_category || item.tag || "ללא קטגוריה מסווגת",
    notes: item.notes || item.reason || "",
  }));

  const categoryMap = new Map();
  transactions.forEach((t) => {
    const key = t.category || "אחר";
    const current = categoryMap.get(key) || { name: key, total: 0, count: 0 };
    categoryMap.set(key, {
      name: current.name,
      total: current.total + t.amount,
      count: current.count + 1,
    });
  });

  return {
    transactions,
    categories: Array.from(categoryMap.values()),
  };
};

export async function analyzeExpensesWithLLM(expenses = []) {
  const payload = {
    prompt: buildPrompt(),
    categories: TARGET_CATEGORIES,
    expenses: expenses.map((e) => ({
      id: e.id,
      transaction_date: e.transaction_date,
      business_name: e.business_name,
      amount: e.amount,
      charge_date: e.charge_date,
      transaction_type: e.transaction_type,
      digital_wallet: e.digital_wallet,
      notes: e.notes,
    })),
  };

  const response = await fetch("http://localhost:3001/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("הקריאה לשירות ה-AI נכשלה. ודא שהשרת המקומי פעיל.");
  }

  const data = await response.json();
  const categoriesSummary =
    data.categories?.map((c) => ({
      name: c.name || c.category || "לא ידוע",
      total: Number(c.totalAmount ?? c.total ?? 0),
      count: c.count ?? c.transactions ?? 0,
    })) || [];

  const normalized = normalizeTransactions(data.transactions || data.items || []);

  return {
    categories: categoriesSummary.length ? categoriesSummary : normalized.categories,
    transactions: normalized.transactions,
    modelNotes: data.modelNotes || data.notes || "",
  };
}
