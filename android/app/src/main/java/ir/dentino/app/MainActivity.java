package ir.dentino.app;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ContentValues;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.View;
import android.view.Window;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.webkit.WebViewAssetLoader;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

public class MainActivity extends Activity {

    private static final String HOST = "appassets.androidplatform.net";
    private static final String START_URL = "https://" + HOST + "/assets/www/index.html";
    private static final int FILE_CHOOSER = 41;

    private WebView web;
    private WebViewAssetLoader loader;
    private ValueCallback<Uri[]> fileCallback;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#f2f5fa"));
        setContentView(web);

        loader = new WebViewAssetLoader.Builder()
                .setDomain(HOST)
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setMediaPlaybackRequiresUserGesture(true);
        s.setTextZoom(100);

        web.addJavascriptInterface(new Bridge(), "Android");

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                if (HOST.equals(u.getHost())) return false;
                openExternal(u.toString());
                return true;
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = cb;
                Intent i = new Intent(Intent.ACTION_GET_CONTENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType("*/*");
                try {
                    startActivityForResult(Intent.createChooser(i, "انتخاب فایل"), FILE_CHOOSER);
                } catch (ActivityNotFoundException e) {
                    fileCallback = null;
                    return false;
                }
                return true;
            }
        });

        if (savedInstanceState != null) web.restoreState(savedInstanceState);
        else web.loadUrl(START_URL);
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        super.onActivityResult(req, res, data);
        if (req == FILE_CHOOSER && fileCallback != null) {
            Uri[] r = null;
            if (res == RESULT_OK && data != null && data.getData() != null) r = new Uri[]{data.getData()};
            fileCallback.onReceiveValue(r);
            fileCallback = null;
        }
    }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript("(window.dentinoBack && window.dentinoBack()) ? 'y' : 'n'", value -> {
            if (value == null || !value.contains("y")) {
                if (web.canGoBack()) web.goBack();
                else finish();
            }
        });
    }

    private void openExternal(String url) {
        try {
            Uri u = Uri.parse(url);
            Intent i;
            String scheme = u.getScheme() == null ? "" : u.getScheme();
            if (scheme.equals("sms") || scheme.equals("smsto")) {
                String ssp = u.getSchemeSpecificPart();
                String number = ssp, body = null;
                int q = ssp.indexOf('?');
                if (q >= 0) {
                    number = ssp.substring(0, q);
                    Uri tmp = Uri.parse("x://y?" + ssp.substring(q + 1));
                    body = tmp.getQueryParameter("body");
                }
                i = new Intent(Intent.ACTION_SENDTO, Uri.parse("smsto:" + number));
                if (body != null) i.putExtra("sms_body", body);
            } else if (scheme.equals("tel")) {
                i = new Intent(Intent.ACTION_DIAL, u);
            } else {
                i = new Intent(Intent.ACTION_VIEW, u);
            }
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(i);
        } catch (Exception e) {
            Toast.makeText(this, "برنامه‌ای برای باز کردن این لینک پیدا نشد", Toast.LENGTH_SHORT).show();
        }
    }

    private class Bridge {
        @JavascriptInterface
        public boolean saveFile(String name, String mime, String b64) {
            try {
                byte[] bytes = Base64.decode(b64, Base64.DEFAULT);
                if (Build.VERSION.SDK_INT >= 29) {
                    ContentValues cv = new ContentValues();
                    cv.put(MediaStore.Downloads.DISPLAY_NAME, name);
                    cv.put(MediaStore.Downloads.MIME_TYPE, mime);
                    cv.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Dentino");
                    Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, cv);
                    if (uri == null) return false;
                    try (OutputStream os = getContentResolver().openOutputStream(uri)) {
                        if (os == null) return false;
                        os.write(bytes);
                    }
                } else {
                    File dir = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                    if (dir == null) return false;
                    dir.mkdirs();
                    try (FileOutputStream fo = new FileOutputStream(new File(dir, name))) {
                        fo.write(bytes);
                    }
                }
                return true;
            } catch (Exception e) {
                return false;
            }
        }

        @JavascriptInterface
        public void print(final String title) {
            runOnUiThread(() -> {
                PrintManager pm = (PrintManager) getSystemService(PRINT_SERVICE);
                PrintDocumentAdapter ad = web.createPrintDocumentAdapter(title == null ? "Dentino" : title);
                pm.print(title == null ? "Dentino" : title, ad, new PrintAttributes.Builder().build());
            });
        }

        @JavascriptInterface
        public void openExternal(final String url) {
            runOnUiThread(() -> MainActivity.this.openExternal(url));
        }

        @JavascriptInterface
        public void setDark(final boolean dark) {
            runOnUiThread(() -> {
                Window w = getWindow();
                w.setStatusBarColor(Color.parseColor(dark ? "#0d1424" : "#1565d8"));
                w.setNavigationBarColor(Color.parseColor(dark ? "#151f33" : "#ffffff"));
                web.setBackgroundColor(Color.parseColor(dark ? "#0d1424" : "#f2f5fa"));
                if (Build.VERSION.SDK_INT >= 26) {
                    View d = w.getDecorView();
                    int f = d.getSystemUiVisibility();
                    f = dark ? (f & ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR) : (f | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
                    d.setSystemUiVisibility(f);
                }
            });
        }

        @JavascriptInterface
        public void setBackHandler(boolean on) { /* بازگشت از طریق window.dentinoBack مدیریت می‌شود */ }
    }
}
