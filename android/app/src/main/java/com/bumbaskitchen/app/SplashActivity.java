package com.bumbaskitchen.app;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import androidx.appcompat.app.AppCompatActivity;

public class SplashActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_splash);

        // ৩.৫ সেকেন্ড (৩৫০০ মিলিসেকেন্ড) পর অ্যানিমেশন শেষ হলে MainActivity-তে যাবে
        // তুমি চাইলে সময় কমাতে বা বাড়াতে পারো
        new Handler().postDelayed(() -> {
            Intent intent = new Intent(SplashActivity.this, MainActivity.class);
            startActivity(intent);
            finish(); // স্প্ল্যাশ স্ক্রিন পুরোপুরি রিমুভ করা
        }, 3500); 
    }
}