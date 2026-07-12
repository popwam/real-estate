"use client";

const copy = {
  en: {
    eyebrow: "Site error",
    title: "Something went wrong.",
    body: "The public site could not render this screen. Try again or return home.",
    action: "Try again",
  },
  ar: {
    eyebrow: "خطأ في الموقع",
    title: "حدث خطأ غير متوقع.",
    body: "تعذر عرض الموقع العام. حاول مرة أخرى أو ارجع إلى الصفحة الرئيسية.",
    action: "حاول مرة أخرى",
  },
  fr: {
    eyebrow: "Erreur du site",
    title: "Une erreur est survenue.",
    body: "Le site public n'a pas pu afficher cet ecran. Reessayez ou revenez a l'accueil.",
    action: "Reessayer",
  },
} as const;

function getLocale() {
  if (typeof document !== "undefined") {
    const lang = document.documentElement.lang.toLowerCase();
    if (lang.startsWith("ar")) return "ar";
    if (lang.startsWith("fr")) return "fr";
  }
  if (typeof navigator !== "undefined") {
    const lang = navigator.language.toLowerCase();
    if (lang.startsWith("ar")) return "ar";
    if (lang.startsWith("fr")) return "fr";
  }
  return "en";
}

export default function GlobalError({ reset }: { reset: () => void }) {
  const locale = getLocale();
  const text = copy[locale];
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir}>
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#07111f", color: "#f8fafc" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
          <section style={{ maxWidth: 560, textAlign: "center", border: "1px solid rgba(255,255,255,.18)", borderRadius: 18, padding: 32, background: "rgba(255,255,255,.06)" }}>
            <p style={{ color: "#5eead4", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>{text.eyebrow}</p>
            <h1>{text.title}</h1>
            <p style={{ color: "#cbd5e1", lineHeight: 1.7 }}>{text.body}</p>
            <button onClick={reset} style={{ marginTop: 20, border: 0, borderRadius: 10, padding: "10px 16px", fontWeight: 700 }}>{text.action}</button>
          </section>
        </main>
      </body>
    </html>
  );
}
