// Вписує в index.html статичний текст сторінки (меню, опис, години, контакти) для пошуковиків
// та AI-пошуку, які не виконують JavaScript. Відвідувачі з JS цей блок не бачать (клас .js на <html>).
// Дані беруться з того самого коду сайту (T, MENU, HOURS, TESTI), тож текст завжди збігається з сайтом.
// Запуск: node tools/build-seo.mjs   (викликається з build-pages.sh)
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'index.html');
let html = fs.readFileSync(file, 'utf8');

// 1) Дістаємо клас Component зі скрипта сайту
const m = html.match(/<script type="text\/x-dc" data-dc-script[^>]*>([\s\S]*?)<\/script>/);
if (!m) throw new Error('component script not found');
const ctx = { console };
vm.createContext(ctx);
vm.runInContext('class DCLogic { constructor(p){ this.props = p || {}; this.state = this.state || {}; } setState(){} }\n' + m[1] + '\nthis.C = Component;', ctx);
const c = new ctx.C({});
const t = c.T.de, MENU = c.MENU, CATS = c.CAT_KEYS, HOURS = c.HOURS, TESTI = c.TESTI;

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const dayNames = { mo: 'Montag', di: 'Dienstag', mi: 'Mittwoch', do: 'Donnerstag', fr: 'Freitag', sa: 'Samstag', so: 'Sonntag' };

// 2) Будуємо простий семантичний HTML німецькою
const menuHtml = CATS.filter(k => MENU[k] && MENU[k].length).map(k => `
  <h3>${esc(t.menuCats[k])}</h3>
  <ul>${MENU[k].map(it => `
    <li><strong>${esc(it.name)}</strong>${it.d && it.d.de ? ' – ' + esc(it.d.de) : ''} – ${esc(it.price)} €</li>`).join('')}
  </ul>`).join('');

const hoursHtml = HOURS.map(h => `<li>${dayNames[h.k]}: ${[h.lunch, h.dinner].filter(Boolean).join(' und ')} Uhr</li>`).join('');
const services = (t.catering.services || []).map(s => `<li><strong>${esc(s.t)}</strong> – ${esc(s.d)}</li>`).join('');
const reviews = (TESTI || []).map(r => `<li><blockquote>${esc(r.de)}</blockquote>${r.n ? ' – ' + esc(r.n) : ''}</li>`).join('');

const block = `<!--SEO-STATIC-START-->
<div id="seo-static" style="max-width:860px;margin:0 auto;padding:24px;font-family:Georgia,serif;color:#2A2018;background:#F4EBDD;line-height:1.6">
<header>
  <h1>Primavera Bistro Pizzeria – ${esc(t.hero.title)}</h1>
  <p>${esc(t.hero.subtitle)}</p>
  <p>Hopfensack 18, 20457 Hamburg (Altstadt) · Telefon <a href="tel:+494032506940">040 325 06 940</a> · E-Mail <a href="mailto:primavera.altstadt@gmail.com">primavera.altstadt@gmail.com</a></p>
  <nav><a href="#speisekarte">Speisekarte</a> · <a href="#catering">Catering</a> · <a href="#reservierung">Reservierung</a> · <a href="#kontakt">Kontakt</a> · <a href="/impressum/">Impressum</a> · <a href="/datenschutz/">Datenschutz</a></nav>
</header>
<main>
<section><h2>${esc(t.about.title)}</h2><p>${esc(t.about.p1)}</p><p>${esc(t.about.p2)}</p></section>
<section id="speisekarte"><h2>${esc(t.menu.title)}</h2><p>${esc(t.menu.subtitle)}</p>${menuHtml}
  <p>${esc(t.menu.note)}</p></section>
<section id="catering"><h2>${esc(t.catering.title)}</h2><p>${esc(t.catering.subtitle)}</p><ul>${services}</ul>
  <p>${esc(t.catering.contactText)} Telefon 040 325 06 940.</p></section>
<section id="reservierung"><h2>${esc(t.reserve.eyebrow)}</h2><p>${esc(t.reserve.subtitle)}</p>
  <p>${esc(t.inq.sub)}</p><p>${esc(t.reserve.note)}</p></section>
<section><h2>${esc(t.reviews.title)}</h2><p>${esc(t.reviews.badge)}</p><ul>${reviews}</ul></section>
<section id="kontakt"><h2>${esc(t.contact.title)}</h2>
  <p>Primavera Bistro Pizzeria, Hopfensack 18, 20457 Hamburg</p>
  <h3>${esc(t.contact.hours)}</h3><ul>${hoursHtml}</ul><p>${esc(t.contact.kitchen)}</p></section>
</main>
</div>
<!--SEO-STATIC-END-->`;

// 3) Вставляємо / оновлюємо блок одразу після <body>
if (html.includes('<!--SEO-STATIC-START-->')) {
  html = html.replace(/<!--SEO-STATIC-START-->[\s\S]*?<!--SEO-STATIC-END-->/, block);
} else {
  html = html.replace('<body>\n', '<body>\n' + block + '\n');
}

// 4) Ховаємо блок для відвідувачів із JS (той самий зміст бачать у самому сайті)
const hideSnippet = '<script>document.documentElement.classList.add("js")</script><style>.js #seo-static{display:none!important}</style>';
if (!html.includes('#seo-static{display:none')) {
  html = html.replace('</head>', hideSnippet + '\n</head>');
}

fs.writeFileSync(file, html);
console.log('OK: SEO static block', block.length, 'chars,', CATS.reduce((n, k) => n + (MENU[k] || []).length, 0), 'menu items');
