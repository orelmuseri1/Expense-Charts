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

const DEFAULT_OLLAMA_ENDPOINT = "http://localhost:11434/api/generate";
const ANALYZE_ENDPOINT = import.meta.env?.VITE_ANALYZE_URL || DEFAULT_OLLAMA_ENDPOINT;

const NETWORK_ERROR_MESSAGE =
  "החיבור לשירות ה-AI נכשל. ודא שהשרת המקומי רץ ב-" + ANALYZE_ENDPOINT;

const buildPrompt = () =>
  `אתה מסווג הוצאות אישיות באמצעות LLaMA 3 13B בקטגוריות יעד ברורות: ${TARGET_CATEGORIES.join(", ")}. החזר JSON בלבד במבנה הבא: {"categories":[{"name":"שם קטגוריה","total":120.5,"count":3}],"transactions":[{"id":"מזהה","transaction_date":"YYYY-MM-DD","business_name":"שם בית העסק","amount":55.9,"category":"קטגוריה"}],"modelNotes":"הסבר קצר"}. התמקד בהגדרות: רכב=דלק/טיפולים, קניות=סופר/חנויות, בילויים=מסעדות/ברים/תרבות, חופשות=טיסות/מלונות, ושיבוץ יתר בהתאם לנ"ל. אל תוסיף טקסט נוסף, רק JSON תקין.`;

const tryParseJsonFromText = (text = "") => {
  try {
    return JSON.parse(text);
  } catch {
    // Try to extract the first JSON block inside the text (e.g. when wrapped in ```json)
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
  }
  return null;
};

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
  const expensesForModel = expenses.map((e) => ({
    id: e.id,
    transaction_date: e.transaction_date,
    business_name: e.business_name,
    amount: e.amount,
    charge_date: e.charge_date,
    transaction_type: e.transaction_type,
    digital_wallet: e.digital_wallet,
    notes: e.notes,
  }));

  const generatePayload = {
    model: "llama3:13b",
    prompt: `${buildPrompt()}\nהוצאות לדוגמה:\n${JSON.stringify(
      expensesForModel,
      null,
      2
    )}`,
    stream: false,
    options: { temperature: 0.2 },
  };

  const chatPayload = {
    model: "llama3:13b",
    messages: [
      { role: "system", content: buildPrompt() },
      {
        role: "user",
        content: `הוצאות לדוגמה:\n${JSON.stringify(expensesForModel, null, 2)}`,
      },
    ],
    stream: false,
    options: { temperature: 0.2 },
  };

  const analyzePayload = {
    prompt: buildPrompt(),
    categories: TARGET_CATEGORIES,
    expenses: expensesForModel,
    model: "llama-3-13b",
  };

  const payload = ANALYZE_ENDPOINT.includes("/analyze")
    ? analyzePayload
    : generatePayload;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  const postJson = (url, body) =>
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

  let response;
  try {
    response = await postJson(ANALYZE_ENDPOINT, payload);
  } catch (error) {
    const isAbort = error?.name === "AbortError";
    throw new Error(
      isAbort ? `${NETWORK_ERROR_MESSAGE} (חרג מזמן קצוב)` : NETWORK_ERROR_MESSAGE
    );
  } finally {
    clearTimeout(timeout);
  }

  // Attempt a fallback to /api/chat if Ollama is running but /api/generate is missing
  if (
    response.status === 404 &&
    ANALYZE_ENDPOINT === DEFAULT_OLLAMA_ENDPOINT &&
    !ANALYZE_ENDPOINT.endsWith("/api/chat")
  ) {
    try {
      response = await postJson(
        DEFAULT_OLLAMA_ENDPOINT.replace("/api/generate", "/api/chat"),
        chatPayload
      );
    } catch (error) {
      const isAbort = error?.name === "AbortError";
      throw new Error(
        isAbort
          ? `${NETWORK_ERROR_MESSAGE} (חרג מזמן קצוב בניסיון fallback)`
          : NETWORK_ERROR_MESSAGE
      );
    }
  }

  if (!response.ok) {
    const statusInfo = response.status ? ` (סטטוס ${response.status})` : "";
    const endpointHint =
      ANALYZE_ENDPOINT === DEFAULT_OLLAMA_ENDPOINT
        ? " ודא ש-Ollama פעיל והרצת `ollama run llama3:13b`."
        : " בדוק את ערך VITE_ANALYZE_URL או שהשירות המקומי מחזיר JSON תקין.";

    throw new Error(
      `הקריאה לשירות ה-AI נכשלה${statusInfo}.${endpointHint}`
    );
  }

  const data = await response.json();

  // If this is the Ollama format, try to extract the JSON content from the response text
  const responseText = data.response || data.message?.content || "";
  const maybeParsed = responseText ? tryParseJsonFromText(responseText) : null;
  const parsedPayload = maybeParsed || data;

  const categoriesSummary =
    parsedPayload.categories?.map((c) => ({
      name: c.name || c.category || "לא ידוע",
      total: Number(c.totalAmount ?? c.total ?? 0),
      count: c.count ?? c.transactions ?? 0,
    })) || [];

  const normalized = normalizeTransactions(
    parsedPayload.transactions || parsedPayload.items || []
  );

  return {
    categories: categoriesSummary.length ? categoriesSummary : normalized.categories,
    transactions: normalized.transactions,
    modelNotes:
      parsedPayload.modelNotes || parsedPayload.notes || responseText || "",
  };
}
