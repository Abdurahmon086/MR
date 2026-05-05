"use client";
import { useEffect, useState } from "react";
import i18n from "i18next";
import { initReactI18next, I18nextProvider } from "react-i18next";
import uz from "../../../public/locales/uz/translation.json";
import ru from "../../../public/locales/ru/translation.json";
import en from "../../../public/locales/en/translation.json";

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: { uz: { translation: uz }, ru: { translation: ru }, en: { translation: en } },
    lng: (typeof window !== "undefined" && localStorage.getItem("lang")) || "uz",
    fallbackLng: "uz",
    interpolation: { escapeValue: false },
  });
}

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
