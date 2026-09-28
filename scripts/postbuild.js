// Copies the built index.html to build/static/shell.html for /middleware.js.
// /index.html itself is redirected to /, so the middleware reads the page
// shell from this copy. Fails the build if the copy cannot be made.
const fs = require("fs");
const path = require("path");

const source = path.join(__dirname, "..", "build", "index.html");
const target = path.join(__dirname, "..", "build", "static", "shell.html");

fs.copyFileSync(source, target);
const html = fs.readFileSync(target, "utf8");
if (!/<\/head>/i.test(html) || !/<div id="root">/i.test(html)) {
  console.error("postbuild: build/static/shell.html is not a valid page shell");
  process.exit(1);
}
console.log("postbuild: wrote build/static/shell.html");
