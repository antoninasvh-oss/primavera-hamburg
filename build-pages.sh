#!/bin/sh
# Створює /impressum/ і /datenschutz/ як копії index.html, щоб прямі посилання не давали 404 на GitHub Pages.
# Запускати після кожної зміни index.html:  sh build-pages.sh
set -e
cd "$(dirname "$0")"
node tools/build-seo.mjs
make_page() {
  slug="$1"; title="$2"
  mkdir -p "$slug"
  sed \
    -e "s#<link rel=\"canonical\" href=\"https://primavera-hamburg.de/\">#<link rel=\"canonical\" href=\"https://primavera-hamburg.de/$slug/\">#" \
    -e "s#<meta property=\"og:url\" content=\"https://primavera-hamburg.de/\">#<meta property=\"og:url\" content=\"https://primavera-hamburg.de/$slug/\">#" \
    -e "s#<title>[^<]*</title>#<title>$title · Primavera Bistro Pizzeria Hamburg</title>#g" \
    index.html > "$slug/index.html"
}
make_page impressum "Impressum"
make_page datenschutz "Datenschutzerklärung"
echo "OK: impressum/index.html, datenschutz/index.html"
