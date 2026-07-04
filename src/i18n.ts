import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enCommon from "./locales/en/common.json";
import faCommon from "./locales/fa/common.json";

// Retrieve language from localStorage or default to English
const savedLanguage = localStorage.getItem("app_locale") || "en";

const resources = {
  en: {
    common: enCommon,
  },
  fa: {
    common: faCommon,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: "en",
    defaultNS: "common",
    interpolation: {
      escapeValue: false, // React already safeguards against XSS
    },
  });

// Handle document direction and language code changes
const updateDocumentAttributes = (lng: string) => {
  document.documentElement.lang = lng;
  document.documentElement.dir = lng === "fa" ? "rtl" : "ltr";
  
  // Conditionally set CSS class for custom font rendering
  if (lng === "fa") {
    document.documentElement.classList.add("font-fa");
    document.documentElement.classList.remove("font-en");
  } else {
    document.documentElement.classList.add("font-en");
    document.documentElement.classList.remove("font-fa");
  }
};

// Initial update
updateDocumentAttributes(savedLanguage);

// On language change, update attributes and save to localStorage
i18n.on("languageChanged", (lng) => {
  localStorage.setItem("app_locale", lng);
  updateDocumentAttributes(lng);
});

export default i18n;
