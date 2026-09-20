const http = require("http");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = Number.parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const server = http.createServer((req, res) => handle(req, res));

    server.listen(port, hostname, () => {
      console.log(`> Quatava Next.js server ready on http://${hostname}:${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start the Quatava Next.js server:", error);
    process.exit(1);
  });
