"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useTheme, type InterfaceLocale } from "@/components/providers/theme-provider";
import { messages as enMessages } from "@/i18n/messages/en";
import { domTranslations as arDom, messages as arMessages } from "@/i18n/messages/ar";
import { domTranslations as frDom, messages as frMessages } from "@/i18n/messages/fr";

type Params = Record<string, string | number>;
type MessageCatalog = Record<string, string>;
type DomCatalog = Record<string, string>;

const catalogs: Record<InterfaceLocale, MessageCatalog> = {
  en: enMessages,
  ar: arMessages,
  fr: frMessages,
};

const domCatalogs: Record<InterfaceLocale, DomCatalog> = {
  en: {},
  ar: arDom,
  fr: frDom,
};

const sourceToEnglish = buildSourceIndex([arDom, frDom]);
const translatableAttributes = ["aria-label", "title", "placeholder"];

type I18nContextValue = {
  locale: InterfaceLocale;
  direction: "ltr" | "rtl";
  t: (key: string, params?: Params) => string;
  formatDate: (value: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (value: number, currency: string, options?: Intl.NumberFormatOptions) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const { locale, direction } = useTheme();

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = direction;
  }, [direction, locale]);

  const value = useMemo<I18nContextValue>(() => {
    const t = (key: string, params?: Params) => translate(locale, key, params);

    return {
      locale,
      direction,
      t,
      formatDate: (input, options) => {
        const date = input instanceof Date ? input : new Date(input);
        if (Number.isNaN(date.getTime())) return String(input);
        return new Intl.DateTimeFormat(locale, options ?? { dateStyle: "medium" }).format(date);
      },
      formatNumber: (input, options) => new Intl.NumberFormat(locale, options).format(input),
      formatCurrency: (input, currency, options) =>
        new Intl.NumberFormat(locale, {
          style: "currency",
          currency,
          ...options,
        }).format(input),
    };
  }, [direction, locale]);

  return (
    <I18nContext.Provider value={value}>
      {children}
      <VisibleTextTranslator locale={locale} />
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}

export function translate(locale: InterfaceLocale, key: string, params?: Params) {
  const template = catalogs[locale][key] ?? catalogs.en[key] ?? key;

  if (
    process.env.NODE_ENV === "development" &&
    !(key in catalogs[locale]) &&
    !(key in catalogs.en)
  ) {
    console.warn(`[i18n] Missing Admin translation key: ${key}`);
  }

  return interpolate(template, params);
}

function VisibleTextTranslator({ locale }: { locale: InterfaceLocale }) {
  useEffect(() => {
    let frame = 0;

    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        translateElement(document.body, locale);
      });
    };

    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: translatableAttributes,
    });

    return () => {
      observer.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [locale]);

  return null;
}

function translateElement(root: HTMLElement, locale: InterfaceLocale) {
  translateAttributes(root, locale);

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || shouldSkipText(parent)) return NodeFilter.FILTER_REJECT;
      return node.textContent?.trim()
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });

  const nodes: Text[] = [];
  let node = walker.nextNode();
  while (node) {
    nodes.push(node as Text);
    node = walker.nextNode();
  }

  for (const textNode of nodes) {
    const current = textNode.textContent ?? "";
    const translated = translateDomValue(current, locale);
    if (translated !== current) textNode.textContent = translated;
  }

  for (const element of Array.from(root.querySelectorAll<HTMLElement>("*"))) {
    translateAttributes(element, locale);
  }
}

function translateAttributes(element: HTMLElement, locale: InterfaceLocale) {
  if (shouldSkipAttributes(element)) return;

  for (const attribute of translatableAttributes) {
    const value = element.getAttribute(attribute);
    if (!value) continue;
    const translated = translateDomValue(value, locale);
    if (translated !== value) element.setAttribute(attribute, translated);
  }
}

function translateDomValue(value: string, locale: InterfaceLocale) {
  const trimmed = normalize(value);
  if (!trimmed) return value;

  const english = sourceToEnglish.get(trimmed);
  if (!english) return value;

  const translated = locale === "en" ? english : domCatalogs[locale][english] ?? english;
  if (translated === trimmed) return value;

  const prefix = value.match(/^\s*/)?.[0] ?? "";
  const suffix = value.match(/\s*$/)?.[0] ?? "";
  return `${prefix}${translated}${suffix}`;
}

function buildSourceIndex(catalogsToIndex: DomCatalog[]) {
  const index = new Map<string, string>();

  for (const catalog of catalogsToIndex) {
    for (const [english, translated] of Object.entries(catalog)) {
      index.set(normalize(english), english);
      index.set(normalize(translated), english);
    }
  }

  return index;
}

function shouldSkipText(element: Element) {
  if (element.closest("[data-i18n-skip]")) return true;
  return ["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT", "SVG", "PATH"].includes(
    element.tagName,
  );
}

function shouldSkipAttributes(element: Element) {
  if (element.closest("[data-i18n-skip]")) return true;
  return ["SCRIPT", "STYLE", "NOSCRIPT", "SVG", "PATH"].includes(element.tagName);
}

function normalize(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function interpolate(template: string, params?: Params) {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : match,
  );
}
