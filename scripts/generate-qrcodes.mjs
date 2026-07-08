/**
 * Génère UNE FOIS les QR codes de démonstration fixes dans /public/qrcodes/.
 * Ces images sont des assets statiques du projet, liés aux profils démo du seed.
 * L'application ne génère jamais de QR code dynamiquement à l'exécution.
 *
 * Exécution : npm run qrcodes
 */
import QRCode from "qrcode";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public", "qrcodes");

const codes = [
  { file: "demo-linky-001.png", payload: "energycoach://connect-meter?type=linky&meterId=demo-linky-001" },
  { file: "demo-gazpar-001.png", payload: "energycoach://connect-meter?type=gazpar&meterId=demo-gazpar-001" },
  { file: "demo-prepaid-001.png", payload: "energycoach://connect-meter?type=prepaid&meterId=demo-prepaid-001" },
];

await mkdir(outDir, { recursive: true });

for (const c of codes) {
  const target = path.join(outDir, c.file);
  await QRCode.toFile(target, c.payload, {
    width: 512,
    margin: 2,
    color: { dark: "#10221c", light: "#ffffff" },
  });
  console.log(`✓ ${c.file}`);
}

console.log("QR codes générés dans public/qrcodes/");
