/* =====================================================================
   Bon Accord Engineering — site script (update 3)
   Plain JavaScript, no libraries.
   - Loader (styled after the Dominic's site): full intro on the first page
     of a visit, quick fade after that
   - Fade-out between pages
   - Navigation: solid bar on scroll, "What We Do" dropdown, mobile menu
   - Smooth scrolling for on-page anchors
   - Footer copyright year (checked against the web server's clock)
   - Scroll reveals via IntersectionObserver
   ===================================================================== */
(function () {
	'use strict';

	var root = document.documentElement;
	var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var quick = root.classList.contains('ba-quick');
	var revealItems = [];     // declared up here: with "defer" the page may already be
	var revealsStarted = false; // ready, so code below can run before the bottom of this file
	function now() { return window.performance && performance.now ? performance.now() : Date.now(); }
	var startTime = now();

	/* ---------------------------------------------------------------
	   Loader
	   --------------------------------------------------------------- */
	var MIN_INTRO = quick ? 0 : (reduceMotion ? 600 : 1900); // let the bar fill on a first visit
	var MAX_WAIT = quick ? 1200 : 3400;                     // never hold the page longer than this
	var loaded = false;

	function markLoaded() {
		if (loaded) return;
		loaded = true;
		var wait = Math.max(0, MIN_INTRO - (now() - startTime));
		setTimeout(function () {
			root.classList.add('is-loaded');
			try { sessionStorage.setItem('ba-visited', '1'); } catch (e) {}
			startReveals();
		}, wait);
	}

	function criticalImageUrl() {
		var el = document.querySelector('#hero') || document.querySelector('#bolts1 .b-header-bot');
		if (!el) return null;
		var m = (window.getComputedStyle(el).backgroundImage || '').match(/url\(["']?(.*?)["']?\)/);
		return m ? m[1] : null;
	}

	function whenCriticalReady(done) {
		var pending = 0;
		function tick() { if (--pending <= 0) done(); }
		var url = criticalImageUrl();
		if (url) {
			pending++;
			var img = new Image();
			img.onload = img.onerror = tick;
			img.src = url;
		}
		if (document.fonts && document.fonts.ready) {
			pending++;
			document.fonts.ready.then(tick, tick);
		}
		if (!pending) done();
	}

	setTimeout(markLoaded, MAX_WAIT);
	onReady(function () { whenCriticalReady(markLoaded); });

	window.addEventListener('pageshow', function (e) {
		if (e.persisted) {
			root.classList.remove('is-leaving');
			root.classList.add('is-loaded');
		}
	});

	function onReady(fn) {
		if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
		else fn();
	}

	onReady(function () {
		initYear();
		initNav();
		initLinks();
		prepareReveals();
	});

	/* ---------------------------------------------------------------
	   Footer year: visitor's clock first, then the web server's clock
	   --------------------------------------------------------------- */
	function initYear() {
		var spans = document.querySelectorAll('[data-year]');
		if (!spans.length) return;
		function setYear(y) { Array.prototype.forEach.call(spans, function (s) { s.textContent = y; }); }
		setYear(new Date().getFullYear());
		if (!window.fetch || location.protocol.indexOf('http') !== 0) return;
		fetch(location.href, { method: 'HEAD', cache: 'no-store' }).then(function (res) {
			var d = new Date(res.headers.get('Date'));
			if (!isNaN(d)) setYear(d.getUTCFullYear());
		}).catch(function () {});
	}

	/* ---------------------------------------------------------------
	   Navigation
	   --------------------------------------------------------------- */
	function initNav() {
		var nav = document.querySelector('[data-nav]');
		if (!nav) return;
		var burger = nav.querySelector('.site-nav__burger');
		var menu = nav.querySelector('.site-nav__menu');
		var dropdowns = Array.prototype.slice.call(nav.querySelectorAll('.has-dropdown'));
		var mobile = window.matchMedia('(max-width: 1050px)');

		// Solid bar once the page scrolls
		var ticking = false;
		function updateScrolled() {
			nav.classList.toggle('is-scrolled', (window.pageYOffset || 0) > 24);
			ticking = false;
		}
		window.addEventListener('scroll', function () {
			if (!ticking) { ticking = true; requestAnimationFrame(updateScrolled); }
		}, { passive: true });
		updateScrolled();

		// "What We Do" dropdown
		function setDropdown(li, open) {
			li.classList.toggle('is-open', open);
			li.querySelector('.site-nav__toggle').setAttribute('aria-expanded', open ? 'true' : 'false');
		}
		function closeDropdowns(except) {
			dropdowns.forEach(function (li) { if (li !== except) setDropdown(li, false); });
		}
		dropdowns.forEach(function (li) {
			var toggle = li.querySelector('.site-nav__toggle');
			toggle.addEventListener('click', function () {
				var open = !li.classList.contains('is-open');
				closeDropdowns(li);
				setDropdown(li, open);
			});
			li.addEventListener('mouseleave', function () { if (!mobile.matches) setDropdown(li, false); });
			// Open on hover/focus is handled in CSS; keep aria-expanded truthful
			li.addEventListener('mouseenter', function () { if (!mobile.matches) toggle.setAttribute('aria-expanded', 'true'); });
		});
		document.addEventListener('click', function (e) {
			if (!e.target.closest('.has-dropdown')) closeDropdowns();
		});

		// Mobile menu
		function setMenu(open) {
			nav.classList.toggle('is-open', open);
			document.body.classList.toggle('nav-open', open);
			burger.setAttribute('aria-expanded', open ? 'true' : 'false');
			burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
			if (!open) closeDropdowns();
		}
		if (burger) {
			burger.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open')); });
		}
		if (menu) {
			menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
		}
		var onBreakpoint = function () { setMenu(false); };
		if (mobile.addEventListener) mobile.addEventListener('change', onBreakpoint);
		else if (mobile.addListener) mobile.addListener(onBreakpoint);

		document.addEventListener('keydown', function (e) {
			if (e.key !== 'Escape') return;
			var openDd = nav.querySelector('.has-dropdown.is-open');
			if (openDd) { closeDropdowns(); openDd.querySelector('.site-nav__toggle').focus(); return; }
			if (nav.classList.contains('is-open')) { setMenu(false); burger.focus(); }
		});
	}

	/* ---------------------------------------------------------------
	   Links: smooth-scroll on-page anchors, fade when changing page
	   --------------------------------------------------------------- */
	function initLinks() {
		document.addEventListener('click', function (e) {
			if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
			var a = e.target.closest('a[href]');
			if (!a) return;
			var href = a.getAttribute('href');

			if (href.charAt(0) === '#') {
				var target = href.length > 1 ? document.getElementById(href.slice(1)) : null;
				if (!target) return;
				e.preventDefault();
				target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
				if (history.replaceState) history.replaceState(null, '', href);
				if (href === '#main' || target.hasAttribute('tabindex')) target.focus({ preventScroll: true });
				return;
			}

			if (reduceMotion || a.target === '_blank' || a.hasAttribute('download')) return;
			var url;
			try { url = new URL(a.href, location.href); } catch (err) { return; }
			if (url.origin !== location.origin || !/\.html?$|\/$/.test(url.pathname)) return;
			if (url.pathname === location.pathname && url.hash) return;

			e.preventDefault();
			root.classList.add('is-leaving');
			setTimeout(function () { location.href = url.href; }, 260);
		});
	}

	/* ---------------------------------------------------------------
	   Scroll reveals
	   --------------------------------------------------------------- */
	function prepareReveals() {
		revealItems = Array.prototype.slice.call(document.querySelectorAll('[data-reveal], [data-reveal-stagger]'));
		revealItems.forEach(function (el) {
			if (el.hasAttribute('data-reveal-stagger')) {
				Array.prototype.forEach.call(el.children, function (child, i) { child.style.setProperty('--i', i); });
			}
		});
		if (root.classList.contains('is-loaded')) startReveals();
	}

	function reveal(el, delayMs) {
		el.style.setProperty('--reveal-delay', (delayMs || 0) + 'ms');
		el.classList.add('is-revealed');
	}

	function startReveals() {
		if (revealsStarted || !revealItems.length) return;
		revealsStarted = true;
		if (reduceMotion || !('IntersectionObserver' in window)) {
			revealItems.forEach(function (el) { reveal(el, 0); });
			return;
		}
		var io = new IntersectionObserver(function (entries) {
			var batch = [];
			entries.forEach(function (entry) {
				if (entry.isIntersecting) {
					batch.push(entry);
				} else if (entry.boundingClientRect.bottom < 0) {
					entry.target.style.transition = 'none';
					reveal(entry.target, 0);
					io.unobserve(entry.target);
					requestAnimationFrame(function () { entry.target.style.transition = ''; });
				}
			});
			batch.sort(function (a, b) {
				return (a.boundingClientRect.top - b.boundingClientRect.top) || (a.boundingClientRect.left - b.boundingClientRect.left);
			});
			batch.forEach(function (entry, i) {
				reveal(entry.target, Math.min(i, 4) * 90);
				io.unobserve(entry.target);
			});
		}, { rootMargin: '0px 0px -10% 0px', threshold: 0 });
		revealItems.forEach(function (el) { io.observe(el); });
	}
})();
