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
    route = 'android_intent_immediate'; // Android Instagram
  } else if (isFacebook && isIOS && wpeabConfig.facebook_ios) {
    route = 'safari_overlay_only'; // iOS Facebook
  } else if (isFacebook && isAndroid && wpeabConfig.facebook_android) {
    route = 'android_intent_immediate'; // Android Facebook
  } else if (isThreads && isIOS && wpeabConfig.threads_ios) {
    route = 'chrome_deeplink_with_safari_overlay'; // iOS Threads
  } else if (isThreads && isAndroid && wpeabConfig.threads_android) {
    route = 'android_intent_immediate'; // Android Threads
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

  if (route === 'android_intent_immediate') {
    fireAndroidIntent();
  }

  if (route === 'android_intent_overlay') {
    showAndroidIntentOverlay();
  }

  if (route === 'instruction_screen') {
    showInstructionScreen();
  }

  // --- UI builders ---

  function fireAndroidIntent() {
    var intentUrl = 'intent://' + currentUrl.replace(/^https?:\/\//, '') +
      '#Intent;scheme=https;action=android.intent.action.VIEW;S.browser_fallback_url=' +
      encodeURIComponent(currentUrl) + ';end';
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        window.location.href = intentUrl;
      });
    });
  }

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
    document.title = 'Open in browser';

    // Inject keyframe animations
    var styleEl = document.createElement('style');
    styleEl.textContent =
      '@keyframes wpeab-arrow-bounce{' +
        '0%{transform:translateY(0) rotate(-45deg)}' +
        '15%{transform:translateY(-18px) rotate(-45deg)}' +
        '30%{transform:translateY(0) rotate(-45deg)}' +
        '100%{transform:translateY(0) rotate(-45deg)}' +
      '}';
    document.head.appendChild(styleEl);

    var overlay = document.createElement('div');
    overlay.className = 'wpeab-overlay wpeab-instruction';

    // --- Text bubble with glassmorphism ---
    var bubble = document.createElement('div');
    bubble.style.cssText = 'background:rgba(255,255,255,0.7);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);border-radius:20px;border:1px solid rgba(255,255,255,0.3);box-shadow:0 8px 48px rgba(0,0,0,0.25);padding:20px 24px;max-width:90%;margin:0 auto;text-align:center';

    var pStyle = 'margin:0 0 4px 0;font-size:16px;font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;color:#111827';

    var title = document.createElement('h1');
    title.style.cssText = 'font-size:22px;font-weight:700;margin:0;font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;color:#111827';
    title.textContent = 'Open in your browser';

    var divider = document.createElement('div');
    divider.style.cssText = 'height:1px;background:#000;margin:8px -24px;width:calc(100% + 48px)';

    var l1 = document.createElement('p');
    l1.style.cssText = pStyle;
    l1.textContent = 'For best viewing,';
    var l2 = document.createElement('p');
    l2.style.cssText = pStyle;
    l2.textContent = 'tap the 3 dots ( \u2022\u2022\u2022 ) in the corner and';
    var l3 = document.createElement('p');
    l3.style.cssText = pStyle.replace('4px', '0');
    l3.innerHTML = 'select "<strong>Open in browser</strong>"';

    bubble.appendChild(title);
    bubble.appendChild(divider);
    bubble.appendChild(l1);
    bubble.appendChild(l2);
    bubble.appendChild(l3);

    // --- Animated arrow pointing to upper-right corner ---
    var arrow = document.createElement('div');
    arrow.style.cssText = 'position:absolute;z-index:2147483648;width:120px;height:120px;top:15px;right:-5px;transform-origin:center center;animation:wpeab-arrow-bounce 2s ease-in-out infinite';
    arrow.innerHTML = '<svg width="120" height="120" viewBox="0 0 108.23841 49.550743" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="m 5,38.938843 c 0,0 12.964694,5.437371 26.926084,5.606026 13.90833,0.168016 28.31843,-3.443094 38.05238,-9.595242 C 82.562914,26.995874 102.85037,5 102.85037,5 m 0,0 -19.996246,0.38805 M 102.85037,5 l 0.38804,19.996233" ' +
      'stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>';

    overlay.appendChild(bubble);
    overlay.appendChild(arrow);
    document.body.appendChild(overlay);
  }

})();
