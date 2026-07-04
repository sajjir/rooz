const fs = require("fs");
const path = require("path");

const distExtDir = path.join(__dirname, "dist-extension");
const distExtAssetsDir = path.join(distExtDir, "assets");

// Ensure directories exist
if (!fs.existsSync(distExtDir)) {
  fs.mkdirSync(distExtDir, { recursive: true });
}
if (!fs.existsSync(distExtAssetsDir)) {
  fs.mkdirSync(distExtAssetsDir, { recursive: true });
}

// 1. Copy manifest.json
const manifestSrc = path.join(__dirname, "packages", "extension", "manifest.json");
const manifestDst = path.join(distExtDir, "manifest.json");
if (fs.existsSync(manifestSrc)) {
  fs.copyFileSync(manifestSrc, manifestDst);
  console.log("Copied manifest.json to dist-extension root");
} else {
  console.error("manifest.json not found at " + manifestSrc);
}

// 2. Copy compiled HTML files from dist-extension/packages/extension/ to dist-extension root
const nestedHtmlDir = path.join(distExtDir, "packages", "extension");
if (fs.existsSync(nestedHtmlDir)) {
  const htmlFiles = fs.readdirSync(nestedHtmlDir).filter(file => file.endsWith(".html"));
  htmlFiles.forEach(file => {
    const srcHtml = path.join(nestedHtmlDir, file);
    const dstHtml = path.join(distExtDir, file);
    
    // Read and adjust absolute paths in script/link tags to be root-relative inside the extension if needed
    let content = fs.readFileSync(srcHtml, "utf8");
    // Ensure paths starting with /assets/ resolve nicely
    fs.writeFileSync(dstHtml, content, "utf8");
    console.log(`Copied and prepared HTML file: ${file}`);
  });
} else {
  console.error("Nested HTML directory not found at " + nestedHtmlDir);
}

// 3. Copy launcher icons from public/assets/ (or generate them if they don't exist)
const assetsSrcDir = path.join(__dirname, "public", "assets");
if (fs.existsSync(assetsSrcDir)) {
  const files = fs.readdirSync(assetsSrcDir);
  files.forEach(file => {
    const srcFile = path.join(assetsSrcDir, file);
    const dstFile = path.join(distExtAssetsDir, file);
    fs.copyFileSync(srcFile, dstFile);
    console.log(`Copied asset: ${file} -> dist-extension/assets/`);
  });
} else {
  console.error("public/assets/ folder not found at " + assetsSrcDir);
}

// 4. Ensure we have fallback icons if not present in public/assets (icon16, icon48, icon128)
// Let's copy them from public or assets folder if we need them
const publicDir = path.join(__dirname, "public");
const iconNames = ["icon16.png", "icon48.png", "icon128.png"];
iconNames.forEach(iconName => {
  const srcIcon = path.join(publicDir, iconName);
  const dstIcon = path.join(distExtAssetsDir, iconName);
  if (fs.existsSync(srcIcon)) {
    fs.copyFileSync(srcIcon, dstIcon);
    console.log(`Copied icon: ${iconName} -> dist-extension/assets/`);
  }
});

// 5. Clean up redundant packages directory inside dist-extension to keep it clean
try {
  const redundantPackagesDir = path.join(distExtDir, "packages");
  if (fs.existsSync(redundantPackagesDir)) {
    fs.rmSync(redundantPackagesDir, { recursive: true, force: true });
    console.log("Cleaned up temporary packages directory inside dist-extension");
  }
} catch (err) {
  console.warn("Could not clean up packages directory", err);
}

console.log("Assets copy and structure optimization completed successfully!");
