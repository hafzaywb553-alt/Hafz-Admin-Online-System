from pathlib import Path

root = Path(__file__).resolve().parents[1]
html_path = root / "app" / "src" / "main" / "assets" / "index.html"
java_path = root / "app" / "src" / "main" / "java" / "com" / "hafz" / "offlinefinance" / "MainActivity.java"
gradle_path = root / "app" / "build.gradle"

def replace_once(source, old, new, label):
    count = source.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    return source.replace(old, new, 1)

html = html_path.read_text(encoding="utf-8")
css_start_marker = "/* Finance V24: keep the active form field above the Android soft keyboard. */"
css_start = html.find(css_start_marker)
css_end = html.find("</style>", css_start)
if css_start < 0 or css_end < 0:
    raise SystemExit("V24 keyboard CSS block was not found.")
keyboard_css = r"""
/* Finance V25: the native WebView viewport is resized to the usable screen area. */
input, select, textarea, [contenteditable="true"] { scroll-margin-block: 22px; }
html, body { min-height: 100%; }
body { overflow-x: hidden; overflow-y: auto; -webkit-overflow-scrolling: touch; }
body.keyboard-open .bottom {
  display: none !important;
  visibility: hidden !important;
  pointer-events: none !important;
}
body.keyboard-open .app { padding-bottom: 12px !important; }
body.keyboard-open { overscroll-behavior-y: contain; }
"""
html = html[:css_start] + keyboard_css + html[css_end:]

js_start_marker = "// Finance V24: native IME insets plus WebView focus management."
js_start = html.find(js_start_marker)
js_end_marker = "})();"
js_end = html.find(js_end_marker, js_start)
if js_start < 0 or js_end < 0:
    raise SystemExit("V24 keyboard JavaScript block was not found.")
js_end += len(js_end_marker)

keyboard_js = r"""// Finance V25: resize-aware keyboard handling for every editable field.
(function installKeyboardVisibilityAndFieldReveal(){
  function isEditableField(node){
    if(!node || !node.matches) return false;
    if(node.matches('textarea:not([readonly]):not([disabled]),select:not([disabled]),input:not([readonly]):not([disabled]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"])')) return true;
    return node.isContentEditable === true;
  }
  function visibleBounds(){
    const viewport=window.visualViewport;
    if(viewport && viewport.height>0){
      return {top:Math.max(0,viewport.offsetTop||0),bottom:(viewport.offsetTop||0)+viewport.height};
    }
    return {top:0,bottom:Math.max(1,window.innerHeight||document.documentElement.clientHeight||1)};
  }
  function findScrollContainer(field){
    let parent=field.parentElement;
    while(parent && parent!==document.body && parent!==document.documentElement){
      let overflow='';
      try{
        const style=window.getComputedStyle ? window.getComputedStyle(parent) : null;
        overflow=style ? (style.overflowY||style.overflow||'') : '';
      }catch(_){}
      if(/auto|scroll|overlay/.test(overflow) && parent.scrollHeight>parent.clientHeight+2) return parent;
      parent=parent.parentElement;
    }
    return document.scrollingElement||document.documentElement||document.body;
  }
  function revealFocusedField(){
    const field=document.activeElement;
    if(!isEditableField(field)) return;
    const bounds=visibleBounds();
    const topLimit=bounds.top+24;
    const bottomLimit=bounds.bottom-30;
    let rect=field.getBoundingClientRect();
    let delta=0;
    if(rect.bottom>bottomLimit) delta=rect.bottom-bottomLimit;
    else if(rect.top<topLimit) delta=rect.top-topLimit;
    if(Math.abs(delta)>1){
      const scroller=findScrollContainer(field);
      if(scroller===document.body || scroller===document.documentElement || scroller===document.scrollingElement){
        window.scrollBy(0,delta);
      }else{
        scroller.scrollTop+=delta;
      }
    }
    rect=field.getBoundingClientRect();
    if(rect.top<topLimit-1 || rect.bottom>bottomLimit+1){
      try{field.scrollIntoView({block:'nearest',inline:'nearest',behavior:'auto'});}
      catch(_){try{field.scrollIntoView(false);}catch(__){}}
    }
  }
  function scheduleReveal(){
    [100,240,420,700,1000,1400].forEach(delay=>setTimeout(revealFocusedField,delay));
  }
  window.setNativeKeyboardVisible=function(visible){
    const opened=Boolean(visible);
    document.body.classList.toggle('keyboard-open',opened);
    if(opened) scheduleReveal();
  };
  document.addEventListener('focusin',function(event){
    if(isEditableField(event.target)){
      document.body.classList.add('keyboard-open');
      scheduleReveal();
    }
  },true);
  document.addEventListener('focusout',function(){
    setTimeout(function(){
      const field=document.activeElement;
      if(isEditableField(field)) return;
      const viewport=window.visualViewport;
      const stillOpen=Boolean(viewport && (window.innerHeight-viewport.height>80));
      if(!stillOpen) document.body.classList.remove('keyboard-open');
    },220);
  },true);
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize',function(){
      const open=(window.innerHeight-window.visualViewport.height)>80;
      window.setNativeKeyboardVisible(open);
      if(open) scheduleReveal();
    });
    window.visualViewport.addEventListener('scroll',function(){
      if(document.body.classList.contains('keyboard-open')) revealFocusedField();
    });
  }
  window.addEventListener('resize',function(){
    if(document.body.classList.contains('keyboard-open')) scheduleReveal();
  });
})();"""

html = html[:js_start] + keyboard_js + html[js_end:]
for required in [
    'id="salarySection"', 'id="dateSection"', 'id="contactSection"', 'id="settingsSection"',
    "window.setNativeKeyboardVisible=function(visible)",
    "function findScrollContainer(field)", "window.scrollBy(0,delta)",
    "[100,240,420,700,1000,1400]", "window.visualViewport.addEventListener('resize'",
]:
    if required not in html:
        raise SystemExit("Missing V25 HTML requirement: " + required)
html_path.write_text(html, encoding="utf-8")

java = java_path.read_text(encoding="utf-8")
java = replace_once(java, "import android.webkit.WebViewClient;", "import android.webkit.WebViewClient;\nimport android.widget.FrameLayout;", "FrameLayout import")
java = replace_once(java, "    private WebView webView;", "    private FrameLayout rootLayout;\n    private WindowInsetsCompat currentInsets;\n    private WebView webView;", "root FrameLayout fields")
java = replace_once(
    java,
    """        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(Color.TRANSPARENT);""",
    """        // Android 6–14: let the platform resize the content window for the IME.
        // Android 15+: handle mandatory edge-to-edge insets by resizing the WebView child.
        boolean decorFits = Build.VERSION.SDK_INT < 35;
        WindowCompat.setDecorFitsSystemWindows(getWindow(), decorFits);
        int systemBarColor = decorFits ? Color.rgb(7, 22, 49) : Color.TRANSPARENT;
        getWindow().setStatusBarColor(systemBarColor);
        getWindow().setNavigationBarColor(systemBarColor);""",
    "version-aware edge-to-edge setup"
)
method_start = java.find("    private void setupWebView() {")
method_end = java.find("\n    private void setupBiometric()", method_start)
if method_start < 0 or method_end < 0:
    raise SystemExit("Could not locate setupWebView() for a safe replacement.")
new_method = r'''    private void setupWebView() {
        rootLayout = new FrameLayout(this);
        rootLayout.setBackgroundColor(Color.rgb(3, 11, 25));

        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(3, 11, 25));
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.setVisibility(View.INVISIBLE);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setAllowFileAccess(true);
        webView.getSettings().setAllowContentAccess(false);
        webView.getSettings().setAllowFileAccessFromFileURLs(false);
        webView.getSettings().setAllowUniversalAccessFromFileURLs(false);
        webView.getSettings().setSupportZoom(false);
        webView.getSettings().setBuiltInZoomControls(false);
        webView.getSettings().setDisplayZoomControls(false);
        webView.addJavascriptInterface(new NativeBridge(), "NativeApp");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                pageLoaded = true;
                webView.setVisibility(View.VISIBLE);
                evaluate("window.setNativeKeyboardVisible && window.setNativeKeyboardVisible(" + imeVisible + ");");
                if (prefs.getBoolean(BIOMETRIC_ENABLED, false)) {
                    showLock();
                    authenticate(false);
                } else {
                    hideLock();
                    unlocked = true;
                }
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return handleUri(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return handleUri(Uri.parse(url));
            }
        });

        rootLayout.addView(webView, new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT
        ));
        ViewCompat.setOnApplyWindowInsetsListener(rootLayout, (view, windowInsets) -> {
            currentInsets = windowInsets;
            applyWebViewWindowInsets(view, windowInsets);
            return windowInsets;
        });
        rootLayout.addOnLayoutChangeListener((view, left, top, right, bottom,
                                               oldLeft, oldTop, oldRight, oldBottom) -> {
            if (currentInsets != null && Build.VERSION.SDK_INT >= 35) {
                applyWebViewWindowInsets(view, currentInsets);
            }
        });

        setContentView(rootLayout);
        webView.loadUrl("file:///android_asset/index.html");
        ViewCompat.requestApplyInsets(rootLayout);
    }

    private void applyWebViewWindowInsets(View rootView, WindowInsetsCompat windowInsets) {
        Insets safe = windowInsets.getInsets(
            WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
        );
        boolean keyboardNowVisible = windowInsets.isVisible(WindowInsetsCompat.Type.ime());
        Insets keyboard = windowInsets.getInsets(WindowInsetsCompat.Type.ime());

        FrameLayout.LayoutParams layoutParams =
            (FrameLayout.LayoutParams) webView.getLayoutParams();
        layoutParams.width = FrameLayout.LayoutParams.MATCH_PARENT;

        if (Build.VERSION.SDK_INT >= 35) {
            int bottomInset = keyboardNowVisible
                ? Math.max(safe.bottom, keyboard.bottom)
                : safe.bottom;
            layoutParams.height = Math.max(1, rootView.getHeight() - safe.top - bottomInset);
            layoutParams.setMargins(safe.left, safe.top, safe.right, 0);
        } else {
            // adjustResize has already reduced this content root on Android 6–14.
            // Do not subtract the keyboard inset a second time on those releases.
            layoutParams.height = FrameLayout.LayoutParams.MATCH_PARENT;
            layoutParams.setMargins(0, 0, 0, 0);
        }
        webView.setLayoutParams(layoutParams);

        if (imeVisible != keyboardNowVisible) {
            imeVisible = keyboardNowVisible;
            webView.post(() -> evaluate(
                "window.setNativeKeyboardVisible && window.setNativeKeyboardVisible("
                    + imeVisible + ");"
            ));
        }
    }
'''
java = java.slice(0, method_start) + new_method + java.slice(method_end)
java = java.replace("Finance-App-V23-Verified-Fixes.apk", "Finance-App-V25-Keyboard-Focus-Fix.apk")
java_path.write_text(java, encoding="utf-8")

gradle = gradle_path.read_text(encoding="utf-8")
gradle = replace_once(gradle, "applicationId 'com.hafz.offlinefinance.v24'", "applicationId 'com.hafz.offlinefinance.v25'", "V25 application ID")
gradle = replace_once(gradle, "versionCode 24", "versionCode 25", "V25 version code")
gradle = replace_once(gradle, "versionName '2.4'", "versionName '2.5'", "V25 version name")
gradle_path.write_text(gradle, encoding="utf-8")

print("PASS: V25 resized the native WebView viewport and replaced the V24 field-reveal logic.")
print("PASS: V25 package/version metadata updated without changing finance tables or the four app sections.")
