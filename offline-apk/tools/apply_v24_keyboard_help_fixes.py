from pathlib import Path

root = Path(__file__).resolve().parents[1]
html_path = root / "app" / "src" / "main" / "assets" / "index.html"
html = html_path.read_text(encoding="utf-8")


def replace_once(source, old, new, label):
    count = source.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match; found {count}")
    return source.replace(old, new, 1)


keyboard_css = r"""
/* Finance V24: keep the active form field above the Android soft keyboard. */
input, select, textarea, [contenteditable="true"] { scroll-margin-block: 18px; }
body.keyboard-open .bottom {
  visibility: hidden !important;
  pointer-events: none !important;
  transform: translateY(115%) !important;
}
body.keyboard-open .app { padding-bottom: 12px !important; }
body.keyboard-open { overscroll-behavior-y: contain; }
"""
html = replace_once(html, "</style>", keyboard_css + "\n</style>", "keyboard CSS insertion")

keyboard_js = r"""
// Finance V24: native IME insets plus WebView focus management.
(function installKeyboardVisibilityAndFieldReveal(){
  function isEditableField(node){
    if(!node || !node.matches) return false;
    if(node.matches('textarea:not([readonly]):not([disabled]),select:not([disabled]),input:not([readonly]):not([disabled]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"])')) return true;
    return node.isContentEditable === true;
  }
  function revealFocusedField(){
    const field=document.activeElement;
    if(!isEditableField(field)) return;
    const viewport=window.visualViewport;
    const visibleTop=viewport ? viewport.offsetTop : 0;
    const visibleBottom=viewport ? viewport.offsetTop+viewport.height : window.innerHeight;
    const rect=field.getBoundingClientRect();
    if(rect.top<visibleTop+14 || rect.bottom>visibleBottom-22){
      try{field.scrollIntoView({block:'center',inline:'nearest',behavior:'smooth'});}
      catch(_){field.scrollIntoView(false);}
    }
  }
  function scheduleReveal(){
    [80,220,420,700].forEach(delay=>setTimeout(revealFocusedField,delay));
  }
  window.setNativeKeyboardVisible=function(visible){
    const opened=Boolean(visible);
    document.body.classList.toggle('keyboard-open',opened);
    if(opened) scheduleReveal();
  };
  document.addEventListener('focusin',function(event){
    if(isEditableField(event.target)){
      window.setNativeKeyboardVisible(true);
      scheduleReveal();
    }
  },true);
  document.addEventListener('focusout',function(){
    setTimeout(function(){
      const field=document.activeElement;
      if(isEditableField(field)) return;
      const viewport=window.visualViewport;
      const stillOpen=Boolean(viewport && window.innerHeight-viewport.height>120);
      window.setNativeKeyboardVisible(stillOpen);
    },180);
  },true);
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize',function(){
      const open=window.innerHeight-window.visualViewport.height>120;
      window.setNativeKeyboardVisible(open);
      if(open) scheduleReveal();
    });
    window.visualViewport.addEventListener('scroll',function(){
      if(document.body.classList.contains('keyboard-open')) revealFocusedField();
    });
  }
})();
"""
help_marker = "let activeHelpTrigger=null;"
if html.count(help_marker) != 1:
    raise SystemExit("Could not uniquely locate the original Settings Help controller.")
html = replace_once(html, help_marker, keyboard_js + "\n" + help_marker, "keyboard JS insertion")

old_handler_start = "// Delegated click handling is lighter and more reliable in older Android WebView builds."
old_handler_end = "function contactText(){"
start = html.find(old_handler_start)
end = html.find(old_handler_end, start)
if start < 0 or end < 0 or end <= start:
    raise SystemExit("The original Help click-handler block was not found.")
direct_handlers = r"""// Finance V24: bind directly to every real Help control.
document.querySelectorAll('.help-trigger').forEach(trigger=>{
  trigger.addEventListener('click',event=>{
    if(trigger.classList.contains('hidden')) return;
    event.preventDefault();
    event.stopPropagation();
    openHelpModal(trigger);
  });
});
const helpCloseButton=$('helpModalClose');
const helpPreviousButton=$('helpPrevBtn');
const helpNextButton=$('helpNextBtn');
if(!helpCloseButton||!helpPreviousButton||!helpNextButton||!$('helpModal')||!$('helpModalBody')){
  throw new Error('Settings Help controls are incomplete; the Help modal cannot be initialized.');
}
helpCloseButton.addEventListener('click',event=>{event.preventDefault();closeHelpModal();});
helpPreviousButton.addEventListener('click',event=>{event.preventDefault();moveHelpTopic(-1);});
helpNextButton.addEventListener('click',event=>{event.preventDefault();moveHelpTopic(1);});
document.querySelectorAll('[data-help-close="true"]').forEach(backdrop=>{
  backdrop.addEventListener('click',event=>{event.preventDefault();closeHelpModal();});
});
document.addEventListener('keydown',event=>{
  if($('helpModal').classList.contains('hidden')) return;
  if(event.key==='Escape'){event.preventDefault();closeHelpModal();}
  else if(event.key==='ArrowRight')moveHelpTopic(-1);
  else if(event.key==='ArrowLeft')moveHelpTopic(1);
});
"""
html = html[:start] + direct_handlers + html[end:]

html = replace_once(
    html,
    "    modal.setAttribute('aria-hidden','false');\n",
    "    modal.setAttribute('aria-hidden','false');\n    const body=$('helpModalBody');if(body&&body.focus)body.focus();\n",
    "focus Help modal body"
)
html = replace_once(
    html,
    "  document.body.classList.remove('help-modal-open');\n  activeHelpTrigger=null;\n}\n// Finance V24: bind directly",
    "  document.body.classList.remove('help-modal-open');\n  const previousTrigger=activeHelpTrigger;\n  activeHelpTrigger=null;\n  if(previousTrigger&&previousTrigger.focus)previousTrigger.focus();\n}\n// Finance V24: bind directly",
    "return focus to Help trigger"
)

required = [
    'id="salarySection"', 'id="dateSection"', 'id="contactSection"', 'id="settingsSection"',
    'id="helpModal"', 'id="helpModalTitle"', 'id="helpModalBody"',
    'id="helpModalClose"', 'id="helpPrevBtn"', 'id="helpNextBtn"',
    "function openHelpModal(trigger)", "function updateHelpModal()",
    "document.querySelectorAll('.help-trigger').forEach(trigger=>",
    "helpPreviousButton.addEventListener('click'",
    "helpNextButton.addEventListener('click'",
    "window.setNativeKeyboardVisible=function(visible)",
    "field.scrollIntoView({block:'center',inline:'nearest',behavior:'smooth'})",
    "body.keyboard-open .bottom",
    'data-help-title-key=', 'data-help-body-key=',
]
for fragment in required:
    if fragment not in html:
        raise SystemExit("Missing V24 keyboard/help requirement: " + fragment)

trigger_count = html.count('class="help-item help-topic help-trigger"')
if trigger_count < 5:
    raise SystemExit(f"Expected original Settings Help topics; found only {trigger_count}.")
if "Delegated click handling is lighter" in html:
    raise SystemExit("The obsolete delegated Help click handler remains.")

html_path.write_text(html, encoding="utf-8")
print(f"PASS: added keyboard viewport/IME support and direct Help listeners ({trigger_count} Settings Help topics retained).")
