const fs = require("fs");
const path = require("path");

const dirs = [
  path.join(__dirname, "public"),
  path.join(__dirname, "public", "assets")
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Minimal valid 1x1 transparent PNG base64 string
const base64Png = "iVBOR00GgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
const buffer = Buffer.from(base64Png, "base64");

const files = [
  path.join(__dirname, "public", "assets", "icon16.png"),
  path.join(__dirname, "public", "assets", "icon48.png"),
  path.join(__dirname, "public", "assets", "icon128.png"),
  path.join(__dirname, "public", "assets", "launcher_icon_large.png"),
  path.join(__dirname, "public", "assets", "icon.png")
];

files.forEach(file => {
  fs.writeFileSync(file, buffer);
  console.log(`Created asset: ${file}`);
});
console.log("All extension placeholder assets initialized successfully!");
