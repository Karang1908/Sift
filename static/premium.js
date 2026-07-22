/* premium.js — BLACKFORGE motion layer.
 *
 * Decoupled from script.js by design: every effect is driven by
 * MutationObservers over the DOM script.js already produces, or by one-shot
 * entrance timelines. It never reads or writes application state, never calls
 * an API, and never changes markup semantics — delete this file and the app
 * keeps working, just without motion.
 *
 * Libraries, each with one job (all vendored locally):
 *   GSAP       → entrance timelines (forge hero, panel reveal)
 *   Motion One → interaction transitions (rows, modals, dropdowns)
 *   anime.js   → the registration-mark readouts
 *
 * Motion is machined: cubic-bezier(0.2,0,0,1), 100–200ms, NO spring, NO
 * overshoot, NO bounce. Everything decelerates hard into place and stops.
 * prefers-reduced-motion short-circuits all of it.
 */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gsap = window.gsap;
  var Motion = window.Motion;
  var anime = window.anime;
  var EASE = [0.2, 0, 0, 1];          // machined decel — matches --ease-out

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function mAnimate(el, keyframes, opts) {
    if (Motion && typeof Motion.animate === 'function') {
      try { Motion.animate(el, keyframes, opts); } catch (e) { /* no-op */ }
    }
  }

  ready(function () {
    watchLoginFailure();   // runs even under reduced-motion (state feedback)
    watchLivePanel();
    if (reduce) return;
    forgeEntrance();
    watchAppReveal();
    watchFileRows();
    watchModals();
    watchDropdowns();
  });

  /* 1. Forge entrance — wordmark cuts in, then the machine reports for duty. */
  function forgeEntrance() {
    var overlay = document.getElementById('login-overlay');
    if (!overlay || overlay.classList.contains('hidden')) return;
    var word = overlay.querySelector('.forge-wordmark');
    var tag = overlay.querySelector('.forge-tagline');
    var ign = overlay.querySelector('.ignition');
    var box = overlay.querySelector('.login-box');
    var fields = overlay.querySelectorAll('#login-form .form-group, .login-submit-btn');

    var typeMs = typewriter(word);   // returns how long the wordmark takes to type

    if (gsap) {
      var t = typeMs / 1000;
      var tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
      // everything else lands after the wordmark has finished typing
      if (tag) tl.from(tag, { opacity: 0, y: 6, duration: 0.24 }, t);
      if (ign) tl.from(ign, { scaleX: 0, transformOrigin: 'left center', duration: 0.4 }, t + 0.06);
      if (box) tl.from(box, { opacity: 0, y: 10, duration: 0.3 }, t * 0.4);
      if (fields.length) tl.from(fields, { opacity: 0, y: 6, duration: 0.2, stagger: 0.04 }, t * 0.4 + 0.1);
    }
    // anime.js drives the corner registration readouts
    var marks = overlay.querySelectorAll('.login-marks .lm');
    if (anime && marks.length) {
      anime({ targets: marks, opacity: [0, 1], duration: 260, delay: anime.stagger(60, { start: 420 }), easing: 'linear' });
    }
  }

  /* 1b. Typewriter — types "Si" (white) then "ft." (arc blue) with a caret.
         The full text is already in the DOM, so this only ever REPLACES
         already-visible content; if it never runs, the wordmark still reads. */
  function typewriter(word) {
    if (!word) return 0;
    var a = word.querySelector('.wm-a');
    var b = word.querySelector('.wm-b');
    if (!a || !b) return 0;

    var overlay = document.getElementById('login-overlay');
    var headA = a.textContent;            // "Si"  — stays ink white
    var tailB = b.textContent;            // "ft." — stays arc blue
    var full = headA + tailB;
    var total = full.length;

    var TYPE = 115, DEL = 55, HOLD_FULL = 1900, HOLD_EMPTY = 450;

    // Render the first n characters, split across the two coloured spans.
    function render(n) {
      a.textContent = full.slice(0, Math.min(n, headA.length));
      b.textContent = n > headA.length ? full.slice(headA.length, n) : '';
    }

    var n = 0, dir = 1;
    render(0);

    (function step() {
      // Once the user is signed in the hero is gone — settle on the full
      // wordmark and stop the loop rather than timing out forever.
      if (overlay && overlay.classList.contains('hidden')) { render(total); return; }

      n += dir;
      render(n);

      if (dir > 0 && n >= total) { dir = -1; setTimeout(step, HOLD_FULL); return; }
      if (dir < 0 && n <= 0) { dir = 1; setTimeout(step, HOLD_EMPTY); return; }
      setTimeout(step, dir > 0 ? TYPE : DEL);
    })();

    return total * TYPE;
  }

  /* 2. App reveal — panels cut up fast when the shell unlocks. */
  function watchAppReveal() {
    var app = document.getElementById('app-main');
    if (!app) return;
    var obs = new MutationObserver(function () {
      if (!app.classList.contains('hidden')) {
        obs.disconnect();
        var panels = app.querySelectorAll('.panel');
        if (gsap && panels.length) {
          gsap.from(panels, { y: 8, opacity: 0, duration: 0.22, stagger: 0.04, ease: 'power4.out' });
        }
      }
    });
    obs.observe(app, { attributes: true, attributeFilter: ['class'] });
  }

  /* 3. Ledger rows — snap in, no spring. */
  function watchFileRows() {
    var body = document.getElementById('file-list-body');
    if (!body) return;
    var obs = new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        var i = 0;
        m.addedNodes.forEach(function (n) {
          if (n.nodeType === 1 && n.tagName === 'TR' && !n.classList.contains('empty-row')) {
            mAnimate(n, { opacity: [0, 1], transform: ['translateY(4px)', 'translateY(0)'] },
              { duration: 0.18, delay: Math.min(i * 0.03, 0.2), easing: EASE });
            i++;
          }
        });
      });
    });
    obs.observe(body, { childList: true });
  }

  /* 4. Modals — hard cut in. */
  function watchModals() {
    ['modal-overlay', 'export-instructions-overlay'].forEach(function (id) {
      var ov = document.getElementById(id);
      if (!ov) return;
      var obs = new MutationObserver(function () {
        if (!ov.classList.contains('hidden')) {
          mAnimate(ov, { opacity: [0, 1] }, { duration: 0.14 });
          var box = ov.querySelector('.modal-box, .modal-box-wide');
          if (box) mAnimate(box, { opacity: [0, 1], transform: ['translateY(6px)', 'translateY(0)'] },
            { duration: 0.2, easing: EASE });
        }
      });
      obs.observe(ov, { attributes: true, attributeFilter: ['class'] });
    });
  }

  /* 5. Dropdowns. */
  function watchDropdowns() {
    document.querySelectorAll('.preset-dropdown-menu').forEach(function (menu) {
      var obs = new MutationObserver(function () {
        if (!menu.classList.contains('hidden')) {
          mAnimate(menu, { opacity: [0, 1], transform: ['translateY(-4px)', 'translateY(0)'] },
            { duration: 0.14, easing: EASE });
        }
      });
      obs.observe(menu, { attributes: true, attributeFilter: ['class'] });
    });
  }

  /* 6. Live panel — the reticle locks onto whichever panel is working.
        Driven off the spinners script.js already toggles. */
  function watchLivePanel() {
    [['run-spinner', '.output-panel'], ['enhance-spinner', '.prompt-panel'],
     ['upload-progress-container', '.file-panel']].forEach(function (pair) {
      var src = document.getElementById(pair[0]);
      var panel = document.querySelector(pair[1]);
      if (!src || !panel) return;
      var obs = new MutationObserver(function () {
        panel.classList.toggle('is-live', !src.classList.contains('hidden'));
      });
      obs.observe(src, { attributes: true, attributeFilter: ['class'] });
    });
  }

  /* 7. Failed login — the machine rejects you. */
  function watchLoginFailure() {
    var err = document.getElementById('login-error');
    var box = document.querySelector('.login-box');
    if (!err || !box) return;
    var obs = new MutationObserver(function () {
      if (!err.classList.contains('hidden')) {
        box.classList.remove('shake');
        void box.offsetWidth;          // restart the animation
        box.classList.add('shake');
      }
    });
    obs.observe(err, { attributes: true, attributeFilter: ['class'] });
  }
})();
