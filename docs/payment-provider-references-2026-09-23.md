# Payment provider references

## Brazil Pix

Official Cielo Pix API documentation: https://developercielo.github.io/en/manual/apipix

Key points used for planning: Pix API supports dynamic QR-code billing, payment status checks, reconciliation, and returns/refunds. Charges use a unique transaction identifier (`txid`) for reconciliation. Provider credentials and scopes are required, and the payment lifecycle distinguishes charges, Pix payments, and returns.

## Colombia Wompi

Official Wompi event documentation: https://docs.wompi.co/en/docs/colombia/eventos/

Key points used for planning: Wompi sends HTTPS POST webhooks for lifecycle events such as `transaction.updated`; the handler should return HTTP 200. Failed notifications may be retried up to three times over 24 hours. Event integrity uses SHA-256 with the event's dynamic `signature.properties`, timestamp, and event secret; the properties array must not be hard-coded. `X-Event-Checksum` is also provided.

## Google Search Console / sitemap

Official ownership verification: https://support.google.com/webmasters/answer/9008080?hl=en
Official sitemap guidance: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
Official sitemap report: https://support.google.com/webmasters/answer/7451001?hl=en
