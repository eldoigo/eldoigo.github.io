/* Bon Accord Engineering — script.js */

(function () {
  'use strict';

  /* ── LOADER ── */
  window.addEventListener('load', function () {
    setTimeout(function () {
      var l = document.getElementById('loader');
      if (l) l.classList.add('hidden');
    }, 1300);
  });

  /* ── NAV: transparent → solid on scroll (home only) ── */
  var nav = document.getElementById('nav');
  if (nav) {
    if (!nav.classList.contains('solid')) {
      window.addEventListener('scroll', function () {
        nav.classList.toggle('scrolled', window.scrollY > 60);
      }, { passive: true });
    }
  }

  /* ── MOBILE MENU ── */
  var burger = document.getElementById('navBurger');
  var drawer = document.getElementById('nav-drawer');
  var dClose = document.getElementById('drawerClose');

  function openDrawer() {
    if (!drawer || !burger) return;
    drawer.classList.add('open');
    burger.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    if (!drawer || !burger) return;
    drawer.classList.remove('open');
    burger.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (burger) burger.addEventListener('click', openDrawer);
  if (dClose) dClose.addEventListener('click', closeDrawer);
  if (drawer) {
    drawer.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeDrawer);
    });
  }

  /* ── INTERSECTION OBSERVER REVEALS ── */
  var revealEls = document.querySelectorAll('.reveal, .reveal-l, .reveal-r');
  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('on');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -36px 0px' });
    revealEls.forEach(function (el) { obs.observe(el); });
  } else {
    /* Fallback — just show everything */
    revealEls.forEach(function (el) { el.classList.add('on'); });
  }

  /* ── SMOOTH SCROLL (anchor links only) ── */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = this.getAttribute('href');
      var target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ── HERO SCROLL HINT ── */
  var scrollHint = document.getElementById('heroScrollHint');
  if (scrollHint) {
    scrollHint.addEventListener('click', function () {
      var next = document.getElementById('services') || document.getElementById('page-content');
      if (next) next.scrollIntoView({ behavior: 'smooth' });
    });
  }

})();
