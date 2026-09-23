/* =========================================================
   settings-apply.js
   خوندي مرکزي Settings Apply Loader

   استعمال:
   <script type="module" src="./settings-apply.js"></script>

   دا فایل:
   - settings.js پورته کوي
   - Cached Settings سمدستي تطبیق کوي
   - Firestore Settings لوستل فعالوي
   - Theme / Font / Color / Direction / Density او عمومي
     Settings تطبیق کوي
   - د موجود HTML اصلي Structure او Business Logic نه بدلوي
========================================================= */

(() => {
  
  const FLAG =
    "__KRHA_SETTINGS_APPLY_LOADER__";
  
  
  if (
    window[FLAG]
  ) {
    return;
  }
  
  
  window[FLAG] =
    true;
  
  
  async function loadSettingsEngine() {
    
    try {
      
      const module =
        await import(
          "./settings.js"
        );
      
      
      if (
        typeof module.initializeSettings ===
        "function"
      ) {
        
        await module.initializeSettings();
      }
      
      
    } catch (error) {
      
      console.warn(
        "KRHA Settings Apply Loader Error:",
        error
      );
    }
  }
  
  
  if (
    document.readyState ===
    "loading"
  ) {
    
    document.addEventListener(
      "DOMContentLoaded",
      loadSettingsEngine,
      {
        once: true
      }
    );
    
  } else {
    
    loadSettingsEngine();
  }
  
})();