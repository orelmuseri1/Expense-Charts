import { useEffect, useState } from "react";
import "./App.css";
import Home from "./Pages/Home.jsx";

function getInitialTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") return saved;
  return "dark"; // default
}

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <div className="app" dir="rtl">
      <div className="container">
        <div className="topbar">
          <div className="titleWrap">
            <h1>ניהול הוצאות</h1>
            <p>העלה קובץ Excel וצפה בניתוח ההוצאות שלך</p>
          </div>

          <button className="themeBtn" onClick={toggle}>
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>

        <Home />
      </div>
    </div>
  );
}
