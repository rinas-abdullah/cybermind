class I18n {

  constructor() {
    this.lang = localStorage.getItem("language") || "en";
    this.translations = window.__CYBERMIND_TRANSLATIONS || {};
  }

  getCurrentLanguage() {
    return this.lang;
  }

  applyDirection(lang) {
    const normalized = lang === "ar" ? "ar" : "en";
    document.documentElement.lang = normalized;
    document.documentElement.dir = normalized === "ar" ? "rtl" : "ltr";
    if (normalized === "ar") {
      document.body.classList.add("rtl");
      document.body.classList.remove("ltr");
    } else {
      document.body.classList.add("ltr");
      document.body.classList.remove("rtl");
    }
  }

  setLanguage(lang) {
    if (!this.translations[lang]) return;

    this.lang = lang;
    localStorage.setItem("language", lang);

    this.applyDirection(lang);
    this.translatePage();

    window.dispatchEvent(
      new CustomEvent("languageChanged", { detail: { language: lang } })
    );
  }

  toggleLanguage() {
    const newLang = this.lang === "en" ? "ar" : "en";
    this.setLanguage(newLang);
  }

  t(key, vars = {}) {
    const parts = String(key).split(".");
    let node = this.translations?.[this.lang];
    for (const p of parts) {
      if (node == null || typeof node !== "object") {
        node = undefined;
        break;
      }
      node = node[p];
    }
    let text = node;

    if (text == null || text === "") return key;

    if (typeof text === "object") {
      if (vars.count === 1) text = text.one;
      else text = text.other;
    }

    Object.keys(vars).forEach(v => {
      text = text.replace(`{{${v}}}`, vars[v]);
    });

    return text;
  }

  translatePage() {
    const elements = document.querySelectorAll("[data-i18n]");

    elements.forEach(el => {
      const key = el.dataset.i18n;
      el.textContent = this.t(key);
    });

    const attrElements = document.querySelectorAll("[data-i18n-placeholder]");
    attrElements.forEach(el => {
      const key = el.dataset.i18nPlaceholder;
      el.placeholder = this.t(key);
    });

    const titleElements = document.querySelectorAll("[data-i18n-title]");
    titleElements.forEach(el => {
      const key = el.dataset.i18nTitle;
      el.title = this.t(key);
    });

    document.querySelectorAll("option[data-i18n]").forEach(el => {
      const key = el.dataset.i18n;
      el.textContent = this.t(key);
    });
  }

  init() {
    this.setLanguage(this.lang);
  }

}

const i18n = new I18n();
window.i18n = i18n;

if (typeof document !== "undefined") {
  const bootI18n = () => {
    try {
      i18n.init();
    } catch (e) {
      console.warn("i18n init:", e);
    }
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootI18n);
  } else {
    bootI18n();
  }
}