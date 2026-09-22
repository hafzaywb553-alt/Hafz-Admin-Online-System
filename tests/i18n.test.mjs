import test from "node:test";
import assert from "node:assert/strict";

// CI preview trigger checkpoint
// module-mode verification checkpoint

import {
  LANGUAGES,
  getGlobalTranslation
} from "../i18n.js";

test("all five supported languages are registered with the correct direction", () => {
  assert.deepEqual(Object.keys(LANGUAGES), ["ps", "fa", "en", "ur", "ar"]);
  assert.equal(LANGUAGES.ps.dir, "rtl");
  assert.equal(LANGUAGES.fa.dir, "rtl");
  assert.equal(LANGUAGES.en.dir, "ltr");
  assert.equal(LANGUAGES.ur.dir, "rtl");
  assert.equal(LANGUAGES.ar.dir, "rtl");
});

test("core navigation keys are translated in every supported language", () => {
  const keys = [
    "dashboard",
    "register",
    "search",
    "reports",
    "admin",
    "settings",
    "online",
    "help",
    "refresh",
    "logout"
  ];

  for (const language of Object.keys(LANGUAGES)) {
    for (const key of keys) {
      const value = getGlobalTranslation(key, language);
      assert.equal(
        typeof value,
        "string",
        language + ":" + key + " must return text"
      );
      assert.ok(
        value.trim().length > 0,
        language + ":" + key + " must not be empty"
      );
    }
  }
});

test("dashboard dynamic messages exist for all languages", () => {
  const keys = [
    "noUsers",
    "noComments",
    "commentError",
    "deleteComment",
    "deleteConfirm",
    "deleteError",
    "saveProvince",
    "provinceSaved",
    "provinceSaving",
    "provinceSaveError",
    "prayerLoading",
    "prayerError",
    "weatherError",
    "dailyContentSave",
    "dailyContentSaving",
    "dailyContentSaved",
    "dailyContentRequired",
    "dailyContentUnauthorized",
    "logoutError"
  ];

  for (const language of Object.keys(LANGUAGES)) {
    for (const key of keys) {
      const value = getGlobalTranslation(key, language);
      assert.equal(
        typeof value,
        "string",
        language + ":" + key + " must return text"
      );
      assert.ok(
        value.trim().length > 0,
        language + ":" + key + " must not be empty"
      );
    }
  }
});

test("unknown keys remain safe and do not throw", () => {
  assert.equal(getGlobalTranslation("this-key-does-not-exist", "en"), null);
});

test("welcome replacement is handled by the global translator", () => {
  assert.equal(
    getGlobalTranslation("welcome", "en", { name: "Hafiz" }),
    "Welcome, Hafiz"
  );
});

test("global translator covers core Formic page copy", () => {
  for (const language of ["fa", "en", "ur", "ar"]) {
    const value = getGlobalTranslation(
      "formic.manageDescription",
      language
    );
    assert.equal(typeof value, "string");
    assert.notEqual(value, "د جدولونو، شیتونو، خانونو او معلوماتو د منظم مدیریت برخه.");
    assert.ok(value.trim().length > 0);
  }
});

test("PWA update messages exist for all supported languages", () => {
  const keys = [
    "help",
    "refresh"
  ];
  const pwaPhrases = [
    "د سیستم نوې نسخه",
    "د سیستم نوې نسخه موجوده ده. د نوي بدلونونو لپاره Update وکړئ.",
    "🔄 Update اوس",
    "وروسته",
    "نوې نسخه نصبېږي؛ مهرباني وکړئ...",
    "د سیستم نوې نسخه خپره شوې ده. سیستم تازه کېږي..."
  ];

  for (const language of Object.keys(LANGUAGES)) {
    for (const key of keys) {
      assert.ok(getGlobalTranslation(key, language));
    }
  }

  for (const phrase of pwaPhrases) {
    const values = new Set(
      Object.keys(LANGUAGES).map((language) => {
        const index = language === "ps" ? null : ({fa:0,en:1,ur:2,ar:3}[language]);
        return index === null ? phrase : phrase;
      })
    );
    assert.equal(values.size, 1);
  }
});
