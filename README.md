# Little Lamb Studio – offers.littlelambstudio.com

Static promotion pages, hosted on GitHub Pages.

- `/` – current offers list (add a card per live promo)
- `/<promo>/` – one folder per promotion (own content, images, PDF, OG image, WhatsApp keyword)
- `/shared/` – logo, brand tokens (`brand.css`), simple page styles
- `/ended/` – where retired promo links redirect
- `404.html` – fallback for old or mistyped links

Rules: current lilac lamb logo only, WhatsApp +852 6045 9922 only, no children's faces, bilingual EN / 繁中.

To retire a promo: replace its `index.html` with a redirect to `/ended/` and remove its card from `/index.html`.
