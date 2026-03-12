(function () {
  'use strict';

  if (typeof wpeabConfig === 'undefined') {
    return;
  }

  var ua = navigator.userAgent || '';

  // --- Platform detection ---
  var isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var isAndroid = /Android/i.test(ua);

  // --- App browser detection ---
  // Instagram: contains "Instagram" in UA
  var isInstagram = /Instagram/i.test(ua);
  // Facebook: contains "FBAN" or "FBAV" in UA
  var isFacebook = /FBAN|FBAV/i.test(ua);
  // Threads: contains "Barcelona" in UA (Threads internal codename)
  var isThreads = /Barcelona/i.test(ua);
  // Snapchat: contains "Snapchat" in UA
  var isSnapchat = /Snapchat/i.test(ua);
  // TikTok: contains "TikTok" or "BytedanceWebview" or "musical_ly" in UA
  var isTikTok = /TikTok|BytedanceWebview|musical_ly/i.test(ua);

  // --- Determine which route to take ---
  var route = null;

  if (isInstagram && isIOS && wpeabConfig.instagram_ios) {
    route = 'chrome_deeplink_with_safari_overlay'; // iOS Instagram
  } else if (isInstagram && isAndroid && wpeabConfig.instagram_android) {
    route = 'android_intent_overlay'; // Android Instagram
  } else if (isFacebook && isIOS && wpeabConfig.facebook_ios) {
    route = 'safari_overlay_only'; // iOS Facebook
  } else if (isFacebook && isAndroid && wpeabConfig.facebook_android) {
    route = 'android_intent_overlay'; // Android Facebook
  } else if (isThreads && isIOS && wpeabConfig.threads_ios) {
    route = 'chrome_deeplink_with_safari_overlay'; // iOS Threads
  } else if (isThreads && isAndroid && wpeabConfig.threads_android) {
    route = 'android_intent_overlay'; // Android Threads
  } else if (isSnapchat && isIOS && wpeabConfig.snapchat_ios) {
    route = 'chrome_deeplink_with_safari_overlay'; // iOS Snapchat
  } else if (isSnapchat && isAndroid && wpeabConfig.snapchat_android) {
    route = 'instruction_screen'; // Android Snapchat
  } else if (isTikTok && isIOS && wpeabConfig.tiktok_ios) {
    route = 'instruction_screen'; // iOS TikTok
  } else if (isTikTok && isAndroid && wpeabConfig.tiktok_android) {
    route = 'instruction_screen'; // Android TikTok
  }

  if (!route) {
    return;
  }

  var currentUrl = window.location.href;
  var path = window.location.pathname + window.location.search + window.location.hash;

  // --- Route handlers ---

  if (route === 'chrome_deeplink_with_safari_overlay') {
    // Immediately attempt Chrome deeplink
    var chromeUrl = 'googlechrome://' + window.location.host + path;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        window.location.href = chromeUrl;
      });
    });

    // Also show transparent overlay for Safari fallback (for users without Chrome)
    showSafariOverlay();
  }

  if (route === 'safari_overlay_only') {
    showSafariOverlay();
  }

  if (route === 'android_intent_overlay') {
    showAndroidIntentOverlay();
  }

  if (route === 'instruction_screen') {
    showInstructionScreen();
  }

  // --- UI builders ---

  function showSafariOverlay() {
    var safariUrl = 'x-safari-https://' + window.location.host + path;

    var overlay = document.createElement('div');
    overlay.className = 'wpeab-overlay wpeab-overlay--transparent';
    overlay.setAttribute('role', 'button');
    overlay.setAttribute('tabindex', '0');
    overlay.setAttribute('aria-label', 'Tap to open in Safari');

    var hint = document.createElement('div');
    hint.className = 'wpeab-overlay__hint';
    hint.textContent = 'Tap anywhere to open in Safari';
    overlay.appendChild(hint);

    overlay.addEventListener('click', function (e) {
      e.preventDefault();
      window.open(safariUrl, '_blank');
    });

    document.body.appendChild(overlay);
  }

  function showAndroidIntentOverlay() {
    var buttonUrl = currentUrl;
    var intentUrl = 'intent://' + buttonUrl.replace(/^https?:\/\//, '') +
      '#Intent;scheme=https;action=android.intent.action.VIEW;S.browser_fallback_url=' +
      encodeURIComponent(buttonUrl) + ';end';

    var overlay = document.createElement('div');
    overlay.className = 'wpeab-overlay wpeab-overlay--transparent';
    overlay.setAttribute('role', 'button');
    overlay.setAttribute('tabindex', '0');
    overlay.setAttribute('aria-label', 'Tap to open in your browser');

    var hint = document.createElement('div');
    hint.className = 'wpeab-overlay__hint';
    hint.textContent = 'Tap anywhere to open in your browser';
    overlay.appendChild(hint);

    overlay.addEventListener('click', function (e) {
      e.preventDefault();
      window.location.href = intentUrl;
    });

    document.body.appendChild(overlay);
  }

  function showInstructionScreen() {
    var overlay = document.createElement('div');
    overlay.className = 'wpeab-overlay wpeab-instruction';

    var card = document.createElement('div');
    card.className = 'wpeab-instruction__card';

    var icon = document.createElement('div');
    icon.className = 'wpeab-instruction__icon';
    icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>';

    var title = document.createElement('h2');
    title.className = 'wpeab-instruction__title';
    title.textContent = 'Open in Browser';

    var steps = document.createElement('div');
    steps.className = 'wpeab-instruction__steps';

    var stepData = getInstructionSteps();

    for (var i = 0; i < stepData.length; i++) {
      var step = document.createElement('div');
      step.className = 'wpeab-instruction__step';

      var num = document.createElement('span');
      num.className = 'wpeab-instruction__step-num';
      num.textContent = (i + 1).toString();

      var text = document.createElement('span');
      text.className = 'wpeab-instruction__step-text';
      text.textContent = stepData[i];

      step.appendChild(num);
      step.appendChild(text);
      steps.appendChild(step);
    }

    card.appendChild(icon);
    card.appendChild(title);
    card.appendChild(steps);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
  }

  function getInstructionSteps() {
    if (isTikTok && isIOS) {
      return [
        'Tap the share button at the bottom right',
        'Scroll right and tap "Open in Safari"',
        'The page will open in Safari'
      ];
    }
    if (isTikTok && isAndroid) {
      return [
        'Tap the three dots (\u22EF) in the top right corner',
        'Select "Open in browser"',
        'The page will open in your default browser'
      ];
    }
    if (isSnapchat && isAndroid) {
      return [
        'Tap the three dots (\u22EF) in the top right corner',
        'Select "Open in browser"',
        'The page will open in your default browser'
      ];
    }
    // Generic fallback
    return [
      'Look for a menu or share button',
      'Select "Open in browser"',
      'The page will open in your default browser'
    ];
  }
})();
