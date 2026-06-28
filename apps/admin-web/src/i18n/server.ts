import { messages as arMessages } from "@/i18n/messages/ar";
import { messages as enMessages } from "@/i18n/messages/en";
import { messages as frMessages } from "@/i18n/messages/fr";

export type ServerLocale = "en" | "ar" | "fr";

type Params = Record<string, string | number>;
type MessageCatalog = Record<string, string>;

const catalogs: Record<ServerLocale, MessageCatalog> = {
  en: enMessages,
  ar: arMessages,
  fr: frMessages,
};

export function normalizeLocale(value?: string | null): ServerLocale {
  const locale = value?.toLowerCase().split("-")[0];
  return locale === "ar" || locale === "fr" ? locale : "en";
}

export function getDirection(locale?: string | null): "ltr" | "rtl" {
  return normalizeLocale(locale) === "ar" ? "rtl" : "ltr";
}

export function tServer(locale: string | null | undefined, key: string, params?: Params) {
  const normalized = normalizeLocale(locale);
  const template = catalogs[normalized][key] ?? catalogs.en[key] ?? key;
  return interpolate(template, params);
}

function interpolate(template: string, params?: Params) {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : match,
  );
}
