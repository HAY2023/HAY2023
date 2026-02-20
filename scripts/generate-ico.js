#!/usr/bin/env node

/**
 * Convert PNG icons to ICO format for Windows
 */

import ICO from "ico";
import fs from "fs";
import path from "path";

const outputDir = "./src-tauri/icons";
const sourcePng = path.join(outputDir, "icon.png");
const outputIco = path.join(outputDir, "icon.ico");

async function createIco() {
  try {
    console.log("🎯 جاري تحويل الأيقونة إلى صيغة Windows (.ico)...\n");

    // Read the largest PNG
    const imageBuffer = fs.readFileSync(sourcePng);

    // Create ICO with multiple sizes
    const ico = ICO.Image.fromPNG(imageBuffer, [
      { width: 256, height: 256 },
      { width: 128, height: 128 },
      { width: 64, height: 64 },
      { width: 48, height: 48 },
      { width: 32, height: 32 },
      { width: 16, height: 16 },
    ]);

    // Write ICO file
    const icoBuffer = await ico.toBuffer();
    fs.writeFileSync(outputIco, icoBuffer);

    console.log("✅ تم إنشاء: icon.ico (Windows Format)");
    console.log(`📁 الملف: ${outputIco}`);
    console.log("\n✨ تحويل الأيقونة اكتمل بنجاح!");
  } catch (error) {
    console.error("❌ خطأ:", error.message);
    console.error("\n⚠️ تم تجاوز الخطأ - سيتم استخدام الأيقونات PNG كبديل");
  }
}

createIco();
