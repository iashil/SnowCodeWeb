import { createContext, useContext, useEffect, useState } from "react";

type Language = "en" | "ar";
type LanguageContextValue = { language: Language; isArabic: boolean; setLanguage: (language: Language) => void; toggleLanguage: () => void };
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => (localStorage.getItem("snowcode-language") as Language) || "en");
  const setLanguage = (next: Language) => setLanguageState(next);
  const toggleLanguage = () => setLanguageState((current) => current === "en" ? "ar" : "en");
  useEffect(() => {
    localStorage.setItem("snowcode-language", language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);
  return <LanguageContext.Provider value={{ language, isArabic: language === "ar", setLanguage, toggleLanguage }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used within LanguageProvider");
  return value;
}
