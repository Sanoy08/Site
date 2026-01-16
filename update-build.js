// update-build.js
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// ১. gradle ফাইলের পাথ
const gradlePath = path.join(__dirname, 'android/app/build.gradle');

try {
    // ২. ফাইল পড়া
    let gradleContent = fs.readFileSync(gradlePath, 'utf8');

    // ৩. বর্তমান ভার্সন বের করা (Regex দিয়ে)
    const codeMatch = gradleContent.match(/versionCode (\d+)/);
    const nameMatch = gradleContent.match(/versionName "([^"]+)"/);

    if (!codeMatch || !nameMatch) {
        console.error("❌ Error: Could not find versionCode or versionName in build.gradle");
        process.exit(1);
    }

    const currentCode = parseInt(codeMatch[1]);
    const currentName = nameMatch[1];

    // ৪. নতুন ভার্সন তৈরি করা
    const newCode = currentCode + 1;
    
    // ভার্সন নেম লজিক (1.0 -> 1.1, 1.9 -> 2.0 এভাবে বাড়াবে, অথবা আপনি চাইলে সিম্পল রাখতে পারেন)
    // আমরা সহজ রাখার জন্য শুধু প্যাচ ভার্সন বাড়াচ্ছি (e.g. 1.0.1 -> 1.0.2)
    const nameParts = currentName.split('.').map(Number);
    if(nameParts.length === 2) nameParts.push(0); // যদি 1.0 থাকে তবে 1.0.0 বানাও
    nameParts[nameParts.length - 1] += 1; // শেষের সংখ্যা ১ বাড়াও
    const newName = nameParts.join('.');

    console.log(`🚀 Updating Android Version:`);
    console.log(`   Code: ${currentCode} -> ${newCode}`);
    console.log(`   Name: "${currentName}" -> "${newName}"`);

    // ৫. ফাইলে রিপ্লেস করা
    gradleContent = gradleContent.replace(/versionCode \d+/, `versionCode ${newCode}`);
    gradleContent = gradleContent.replace(/versionName "[^"]+"/, `versionName "${newName}"`);

    fs.writeFileSync(gradlePath, gradleContent);
    console.log("✅ build.gradle updated!");

    // ৬. Capacitor Sync চালানো
    console.log("\n🔄 Running: pnpm exec cap sync");
    execSync('pnpm exec cap sync', { stdio: 'inherit' });

    // ৭. APK বিল্ড করা (Android Studio না খুলে)
    console.log("\n🔨 Building Release APK (Please wait... this takes time)");
    
    // উইন্ডোজ হলে 'gradlew.bat', ম্যাক/লিনাক্স হলে './gradlew'
    const isWindows = process.platform === "win32";
    const buildCmd = isWindows ? 'cd android && gradlew.bat assembleRelease' : 'cd android && ./gradlew assembleRelease';
    
    execSync(buildCmd, { stdio: 'inherit' });

    console.log("\n🎉 SUCCESS! APK Generated at:");
    console.log("📂 android/app/build/outputs/apk/release/app-release.apk");

} catch (error) {
    console.error("❌ Failed:", error.message);
}