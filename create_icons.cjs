const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");

const dirs = [
  path.join(__dirname, "public"),
  path.join(__dirname, "public", "assets")
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Function to generate a beautifully drawn icon using super-sampling for anti-aliasing
function generateIcon(size, filePath) {
  const png = new PNG({ width: size, height: size });
  const cx = size / 2;
  const cy = size / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // 4x4 Supersampling for beautiful anti-aliasing
      let rSum = 0, gSum = 0, bSum = 0, aSum = 0;
      const samples = 4;

      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          // Subpixel coordinates
          const spx = x + (sx + 0.5) / samples;
          const spy = y + (sy + 0.5) / samples;

          // Normalize relative to center, scale from -1.0 to 1.0
          const nx = (spx - cx) / (size / 2);
          const ny = (spy - cy) / (size / 2);
          const r = Math.sqrt(nx * nx + ny * ny);

          let pr = 0, pg = 0, pb = 0, pa = 0; // Default transparent

          if (r <= 0.95) {
            // Background of the circular badge: deep zinc-900 / zinc-950 slate
            pr = 24;
            pg = 24;
            pb = 27;
            pa = 255;

            // Emerald Brand Ring (radius 0.72 to 0.78)
            if (r >= 0.70 && r <= 0.78) {
              const ringBlend = (r - 0.70) / 0.08; // 0 to 1
              // Blend emerald (16, 185, 129) over zinc background
              pr = Math.round(24 + (16 - 24) * 0.9);
              pg = Math.round(24 + (185 - 24) * 0.9);
              pb = Math.round(27 + (129 - 27) * 0.9);
            }

            // Central Upward Directional Triangle (symbol △/★)
            // Pointing up: base at ny = 0.3, tip at ny = -0.4, half-width at base = 0.35
            const tipY = -0.4;
            const baseY = 0.25;
            const baseHalfWidth = 0.35;

            if (ny >= tipY && ny <= baseY) {
              // Linear interpolation of width based on y position
              const pct = (ny - tipY) / (baseY - tipY); // 0 at tip, 1 at base
              const currentHalfWidth = pct * baseHalfWidth;
              if (Math.abs(nx) <= currentHalfWidth) {
                // Inside the triangle - draw gold/amber (245, 158, 11)
                pr = 245;
                pg = 158;
                pb = 11;
              }
            }

            // Elegant center star dot (symbol ★)
            // Draw a small shining dot at the center of the triangle
            const dotX = 0;
            const dotY = -0.05;
            const dotDist = Math.sqrt((nx - dotX) * (nx - dotX) + (ny - dotY) * (ny - dotY));
            if (dotDist <= 0.08) {
              // Pure bright gold shine (254, 240, 138)
              pr = 254;
              pg = 240;
              pb = 138;
            }
          }

          rSum += pr;
          gSum += pg;
          bSum += pb;
          aSum += pa;
        }
      }

      // Average the samples
      const idx = (size * y + x) << 2;
      png.data[idx] = Math.round(rSum / (samples * samples));
      png.data[idx + 1] = Math.round(gSum / (samples * samples));
      png.data[idx + 2] = Math.round(bSum / (samples * samples));
      png.data[idx + 3] = Math.round(aSum / (samples * samples));
    }
  }

  const buffer = PNG.sync.write(png);
  fs.writeFileSync(filePath, buffer);
  console.log(`Generated beautifully drawn icon (${size}x${size}): ${filePath}`);
}

const files = [
  { size: 16, path: path.join(__dirname, "public", "assets", "icon16.png") },
  { size: 48, path: path.join(__dirname, "public", "assets", "icon48.png") },
  { size: 128, path: path.join(__dirname, "public", "assets", "icon128.png") },
  { size: 512, path: path.join(__dirname, "public", "assets", "launcher_icon_large.png") },
  { size: 512, path: path.join(__dirname, "public", "assets", "icon.png") }
];

files.forEach(f => {
  generateIcon(f.size, f.path);
});

console.log("All beautiful minimalist brand assets generated successfully!");
