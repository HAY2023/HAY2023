#!/usr/bin/env node

/**
 * Icon Generator Script for صندوق الفتوى مسجد الإيمان
 * يقوم بتوليد الأيقونات بأحجام مختلفة للـ Android و Windows
 */

import sharp from "sharp";
import fs from "fs";
import path from "path";

const sourceImage = "./public/icon-mosque.png";
const outputDir = "./src-tauri/icons";

// Define sizes for different platforms
const sizes = {
    // Android Icons
    android: {
        "android/mipmap-mdpi/ic_launcher.png": 48,
        "android/mipmap-hdpi/ic_launcher.png": 72,
        "android/mipmap-xhdpi/ic_launcher.png": 96,
        "android/mipmap-xxhdpi/ic_launcher.png": 144,
        "android/mipmap-xxxhdpi/ic_launcher.png": 192,
    },
    // Windows & General
    windows: {
        "32x32.png": 32,
        "128x128.png": 128,
        "128x128@2x.png": 256,
        "icon.png": 512,
    },
};

// Create directories
function ensureDirectories() {
    const dirs = [
        outputDir,
        `${outputDir}/android`,
        `${outputDir}/android/mipmap-mdpi`,
        `${outputDir}/android/mipmap-hdpi`,
        `${outputDir}/android/mipmap-xhdpi`,
        `${outputDir}/android/mipmap-xxhdpi`,
        `${outputDir}/android/mipmap-xxxhdpi`,
    ];

    dirs.forEach((dir) => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
}

// Generate PNG icons
async function generateIcons() {
    console.log("🎨 جاري توليد الأيقونات...\n");

    try {
        // Generate Android icons
        for (const [filename, size] of Object.entries(sizes.android)) {
            const outputPath = path.join(outputDir, filename);
            await sharp(sourceImage)
                .resize(size, size, {
                    fit: "contain",
                    background: { r: 255, g: 255, b: 255, alpha: 0 },
                })
                .png()
                .toFile(outputPath);

            console.log(`✅ تم إنشاء: ${filename} (${size}x${size})`);
        }

        // Generate Windows icons
        for (const [filename, size] of Object.entries(sizes.windows)) {
            const outputPath = path.join(outputDir, filename);
            await sharp(sourceImage)
                .resize(size, size, {
                    fit: "contain",
                    background: { r: 255, g: 255, b: 255, alpha: 0 },
                })
                .png()
                .toFile(outputPath);

            console.log(`✅ تم إنشاء: ${filename} (${size}x${size})`);
        }

        console.log("\n✨ تم إنشاء جميع الأيقونات بنجاح!");
        console.log(`📁 يمكنك العثور على الملفات في: ${outputDir}`);
    } catch (error) {
        console.error("❌ خطأ في توليد الأيقونات:", error.message);
        process.exit(1);
    }
}

// Main execution
ensureDirectories();
generateIcons();
