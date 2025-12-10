package com.bumbaskitchen.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Latest version a manual registerPlugin lage na.
        // Capacitor automatic sob plugin khuje ney 'cap sync' korle.
        // Tai amra ekhane kichu likhbo na, just super.onCreate thakbe.
        super.onCreate(savedInstanceState);
    }
}