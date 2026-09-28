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

// Do not publish source maps: they expose the full readable source of the app.
// Remove the .map files and the sourceMappingURL comments that point to them.
let removedMaps = 0;
function stripSourceMaps(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) stripSourceMaps(full);
    else if (entry.name.endsWith(".map")) { fs.unlinkSync(full); removedMaps += 1; }
    else if (/\.(js|css)$/.test(entry.name)) {
      const code = fs.readFileSync(full, "utf8");
      const cleaned = code.replace(/\n?\/[/*][#@] sourceMappingURL=[^\n]*$/, "");
      if (cleaned !== code) fs.writeFileSync(full, cleaned);
    }
  }
}
stripSourceMaps(path.join(__dirname, "..", "build"));
const manifestPath = path.join(__dirname, "..", "build", "asset-manifest.json");
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  for (const key of Object.keys(manifest.files || {})) if (key.endsWith(".map")) delete manifest.files[key];
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}
console.log(`postbuild: removed ${removedMaps} source map file(s)`);
