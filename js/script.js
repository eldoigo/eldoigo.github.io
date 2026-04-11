/* Dominic's Italian & BBQ — site script */

(function () {
  'use strict';

  /* ── LOADER ── */
  window.addEventListener('load', function () {
    setTimeout(function () {
      var loader = document.getElementById('loader');
      if (loader) loader.classList.add('hide');
      // trigger initial hero bg zoom
      var heroBg = document.querySelector('.hero-bg');
      if (heroBg) heroBg.classList.add('loaded');
    }, 2600);
  });

  /* ── NAV: scroll class + hamburger ── */
  var nav        = document.getElementById('nav');
  var hamburger  = document.querySelector('.hamburger');
  var mobNav     = document.getElementById('mob-nav');
  var mobLinks   = document.querySelectorAll('#mob-nav a');

  window.addEventListener('scroll', function () {
    if (window.scrollY > 40) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }, { passive: true });

  if (hamburger) {
    hamburger.addEventListener('click', function () {
      hamburger.classList.toggle('open');
      mobNav.classList.toggle('open');
      document.body.style.overflow = mobNav.classList.contains('open') ? 'hidden' : '';
    });
  }

  mobLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      hamburger.classList.remove('open');
      mobNav.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  /* ── SCROLL REVEAL ── */
  var revealEls = document.querySelectorAll('.reveal, .reveal-l, .reveal-r, .stagger');

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('on');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    // Fallback for older browsers
    revealEls.forEach(function (el) { el.classList.add('on'); });
  }

  /* ── SMOOTH NAV LINKS ── */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        var offset = parseInt(getComputedStyle(document.documentElement)
          .getPropertyValue('--nav-h')) || 68;
        var top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });

  /* ── ACTIVE NAV LINK HIGHLIGHT ── */
  var sections   = document.querySelectorAll('section[id], div[id]');
  var navAnchors = document.querySelectorAll('.nav-links a');

  window.addEventListener('scroll', function () {
    var scrollY = window.scrollY + 100;
    sections.forEach(function (sec) {
      if (scrollY >= sec.offsetTop && scrollY < sec.offsetTop + sec.offsetHeight) {
        navAnchors.forEach(function (a) {
          a.style.color = '';
          if (a.getAttribute('href') === '#' + sec.id) {
            a.style.color = 'var(--gold)';
          }
        });
      }
    });
  }, { passive: true });

  /* ── PARALLAX: section band images on scroll ── */
  var bandImgs = document.querySelectorAll('.sec-band-img');
  window.addEventListener('scroll', function () {
    var scrollY = window.scrollY;
    bandImgs.forEach(function (img) {
      var parent = img.closest('.sec-band');
      if (!parent) return;
      var rect   = parent.getBoundingClientRect();
      var center = rect.top + rect.height / 2;
      var offset = (center - window.innerHeight / 2) * 0.18;
      img.style.transform = 'scale(1.12) translateY(' + offset + 'px)';
    });
  }, { passive: true });

})();
