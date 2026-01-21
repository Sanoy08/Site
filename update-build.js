// update-build.js
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const readline = require('readline');

// ১. ইনপুট নেওয়ার জন্য ইন্টারফেস তৈরি
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const gradlePath = path.join(__dirname, 'android/app/build.gradle');
const sourceApk = path.join(__dirname, 'android/app/build/outputs/apk/release/app-release.apk');
const destApk = path.join(__dirname, 'public/bumbas-kitchen.apk');

// মেইন ফাংশন
const startProcess = async () => {
    try {
        // ২. ইউজারের কাছ থেকে কমিট মেসেজ নেওয়া
        rl.question('📝 Enter Commit Message: ', (commitMsg) => {
            if (!commitMsg.trim()) {
                console.error("❌ Commit message is required!");
                process.exit(1);
            }
            
            rl.close(); // ইনপুট নেওয়া শেষ
            runBuildProcess(commitMsg); // মেইন প্রসেস শুরু
        });

    } catch (error) {
        console.error("\n❌ Error:", error.message);
        process.exit(1);
    }
};

const runBuildProcess = (commitMsg) => {
    try {
        console.log("\n🚀 Starting Auto-Build & Push Process...");

        // ৩. Gradle ফাইল আপডেট (ভার্সন বাড়ানো)
        let gradleContent = fs.readFileSync(gradlePath, 'utf8');
        const codeMatch = gradleContent.match(/versionCode (\d+)/);
        const nameMatch = gradleContent.match(/versionName "([^"]+)"/);

        if (!codeMatch || !nameMatch) throw new Error("Could not find version info in build.gradle");

        const currentCode = parseInt(codeMatch[1]);
        const currentName = nameMatch[1];
        const newCode = currentCode + 1;
        
        // ভার্সন নেম লজিক (1.0.0 -> 1.0.1)
        const nameParts = currentName.split('.').map(Number);
        if(nameParts.length === 2) nameParts.push(0);
        nameParts[nameParts.length - 1] += 1;
        const newName = nameParts.join('.');

        console.log(`📦 Bumping Version: ${currentName} -> ${newName} (Code: ${newCode})`);

        gradleContent = gradleContent.replace(/versionCode \d+/, `versionCode ${newCode}`);
        gradleContent = gradleContent.replace(/versionName "[^"]+"/, `versionName "${newName}"`);
        fs.writeFileSync(gradlePath, gradleContent);

        // ৪. Capacitor Sync
        console.log("\n🔄 Syncing Capacitor...");
        execSync('pnpm exec cap sync', { stdio: 'inherit' });

        // ৫. APK বিল্ড করা
        console.log("\n🔨 Building APK (Please wait...)...");
        const isWindows = process.platform === "win32";
        const buildCmd = isWindows ? 'cd android && gradlew.bat assembleRelease' : 'cd android && ./gradlew assembleRelease';
        execSync(buildCmd, { stdio: 'inherit' });

        // ৬. APK ফাইল মুভ করা
        if (fs.existsSync(sourceApk)) {
            if (fs.existsSync(destApk)) fs.unlinkSync(destApk);
            fs.copyFileSync(sourceApk, destApk);
            console.log(`✅ APK copied to public folder.`);
        } else {
            throw new Error("APK generation failed!");
        }

        // ৭. গিট কমিট এবং পুশ (Git Push)
        console.log("\ncloud_upload Pushing to GitHub...");
        
        execSync('git add .', { stdio: 'inherit' });
        execSync(`git commit -m "${commitMsg} (v${newName})"`, { stdio: 'inherit' });
        execSync('git push', { stdio: 'inherit' });

        console.log("\n🎉 SUCCESS! App updated, built, and pushed to GitHub!");

    } catch (error) {
        console.error("\n❌ Process Failed:", error.message);
        process.exit(1);
    }
};

// স্ক্রিপ্ট রান করা
startProcess();