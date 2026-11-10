#!/usr/bin/env node
/**
 * Genera /en/index.html, /fr/index.html y /it/index.html a partir del
 * index.html raíz (la versión en español, fuente única de verdad).
 *
 * Por qué existe: el sitio es un single-page app (un solo <script> con el
 * objeto ALL_T y una función render()) que antes solo cambiaba de idioma
 * client-side, sin URLs propias. Los buscadores (y las vistas previas de
 * WhatsApp/Facebook, que casi nunca ejecutan JS) solo veían la versión
 * en español. Este script no duplica la lógica de render(): copia el
 * archivo completo (HTML + CSS + el mismo <script>) y solo cambia, por
 * idioma, las etiquetas de <head> que importan para SEO/compartir
 * (title, description, og/twitter, canonical, hreflang, og:locale,
 * ld+json) y el idioma inicial (`state.lang`) con el que arranca la app.
 *
 * Uso: después de editar el index.html raíz (ALL_T, precios, lo que sea),
 * correr `node scripts/generate-lang-pages.js` desde la raíz del repo y
 * commitear tanto index.html como en/index.html, fr/index.html e
 * it/index.html juntos. Si no se corre este script después de un cambio
 * en el índice raíz, las 3 copias quedan desactualizadas.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SOURCE = path.join(ROOT, 'index.html');

const LANGS = {
  en: {
    htmlLang: 'en',
    title: 'Mayab Private Drivers — Bilingual Private Driver in Mérida',
    description: 'Bilingual (English-Spanish) private driver in Mérida, Yucatán. Airport transfers, hourly or destination tours, and chauffeured car rental.',
    ogLocale: 'en_US',
    path: '/en/',
  },
  fr: {
    htmlLang: 'fr',
    title: 'Mayab Private Drivers — Chauffeur privé bilingue à Mérida',
    description: "Chauffeur privé bilingue (anglais-espagnol) à Mérida, Yucatán. Transferts aéroport, excursions à l'heure ou à la carte, et location de véhicule avec chauffeur.",
    ogLocale: 'fr_FR',
    path: '/fr/',
  },
  it: {
    htmlLang: 'it',
    title: 'Mayab Private Drivers — Autista privato bilingue a Mérida',
    description: 'Autista privato bilingue (inglese-spagnolo) a Mérida, Yucatán. Transfer aeroportuali, tour a ore o su misura, e noleggio auto con autista.',
    ogLocale: 'it_IT',
    path: '/it/',
  },
};
const ALL_LOCALES = ['es_MX', 'en_US', 'fr_FR', 'it_IT'];

const ES_TITLE = 'Mayab Private Drivers — Chofer privado bilingüe en Mérida';
const ES_DESCRIPTION = 'Chofer privado bilingüe (inglés-español) en Mérida, Yucatán. Transfers de aeropuerto, tours por hora o destino, y renta de vehículo con chofer.';

function must(content, needle, label) {
  const count = content.split(needle).length - 1;
  if (count !== 1) {
    throw new Error(`Esperaba exactamente 1 ocurrencia de [${label}], encontré ${count}. Revisa el index.html raíz o este script.`);
  }
}

function buildPage(source, code, cfg) {
  let html = source;

  must(html, '<html lang="es">', 'html lang');
  html = html.replace('<html lang="es">', `<html lang="${cfg.htmlLang}">`);

  must(html, `<title>${ES_TITLE}</title>`, 'title');
  html = html.replace(`<title>${ES_TITLE}</title>`, `<title>${cfg.title}</title>`);

  must(html, `<meta name="description" content="${ES_DESCRIPTION}">`, 'meta description');
  html = html.replace(
    `<meta name="description" content="${ES_DESCRIPTION}">`,
    `<meta name="description" content="${cfg.description}">`
  );

  must(html, 'href="https://mayabprivatedrivers.com/">\n<link rel="alternate" hreflang="es"', 'canonical');
  html = html.replace(
    'href="https://mayabprivatedrivers.com/">\n<link rel="alternate" hreflang="es"',
    `href="https://mayabprivatedrivers.com${cfg.path}">\n<link rel="alternate" hreflang="es"`
  );

  must(html, `<meta property="og:title" content="${ES_TITLE}">`, 'og:title');
  html = html.replace(`<meta property="og:title" content="${ES_TITLE}">`, `<meta property="og:title" content="${cfg.title}">`);

  must(html, `<meta property="og:description" content="${ES_DESCRIPTION}">`, 'og:description');
  html = html.replace(
    `<meta property="og:description" content="${ES_DESCRIPTION}">`,
    `<meta property="og:description" content="${cfg.description}">`
  );

  must(html, '<meta property="og:url" content="https://mayabprivatedrivers.com/">', 'og:url');
  html = html.replace(
    '<meta property="og:url" content="https://mayabprivatedrivers.com/">',
    `<meta property="og:url" content="https://mayabprivatedrivers.com${cfg.path}">`
  );

  must(html, '<meta property="og:locale" content="es_MX">', 'og:locale');
  const alternates = ALL_LOCALES.filter((l) => l !== cfg.ogLocale)
    .map((l) => `<meta property="og:locale:alternate" content="${l}">`)
    .join('\n');
  must(html, '<meta property="og:locale:alternate" content="en_US">\n<meta property="og:locale:alternate" content="fr_FR">\n<meta property="og:locale:alternate" content="it_IT">', 'og:locale:alternate block');
  html = html.replace('<meta property="og:locale" content="es_MX">', `<meta property="og:locale" content="${cfg.ogLocale}">`);
  html = html.replace(
    '<meta property="og:locale:alternate" content="en_US">\n<meta property="og:locale:alternate" content="fr_FR">\n<meta property="og:locale:alternate" content="it_IT">',
    alternates
  );

  must(html, `<meta name="twitter:title" content="${ES_TITLE}">`, 'twitter:title');
  html = html.replace(`<meta name="twitter:title" content="${ES_TITLE}">`, `<meta name="twitter:title" content="${cfg.title}">`);

  must(html, `<meta name="twitter:description" content="${ES_DESCRIPTION}">`, 'twitter:description');
  html = html.replace(
    `<meta name="twitter:description" content="${ES_DESCRIPTION}">`,
    `<meta name="twitter:description" content="${cfg.description}">`
  );

  must(html, `"url": "https://mayabprivatedrivers.com/",`, 'ld+json url');
  html = html.replace(`"url": "https://mayabprivatedrivers.com/",`, `"url": "https://mayabprivatedrivers.com${cfg.path}",`);

  must(html, `"description": "${ES_DESCRIPTION}"`, 'ld+json description');
  html = html.replace(`"description": "${ES_DESCRIPTION}"`, `"description": "${cfg.description}"`);

  must(html, "var state = {\n    lang: 'es',", 'state.lang inicial');
  html = html.replace("var state = {\n    lang: 'es',", `var state = {\n    lang: '${code}',`);

  return html;
}

const source = fs.readFileSync(SOURCE, 'utf8');

for (const [code, cfg] of Object.entries(LANGS)) {
  const page = buildPage(source, code, cfg);
  const dir = path.join(ROOT, code);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), page, 'utf8');
  console.log(`✓ generado ${code}/index.html (${(page.length / 1024).toFixed(1)} KB)`);
}
