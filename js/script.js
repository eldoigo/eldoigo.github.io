/* =====================================================================
   Bon Accord Engineering — site script
   Plain JavaScript, no jQuery or AOS needed.
   - Loader: waits for the hero photo + fonts (capped), full intro only on
     the first page of a visit, quick fade after that
   - Fade-out between pages
   - Header tucks away past 300px
   - Mobile menu
   - Smooth scrolling for on-page anchors only
   - Scroll reveals via IntersectionObserver (replaces AOS)
   ===================================================================== */
(function () {
	'use strict';

	var root = document.documentElement;
	var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var quick = root.classList.contains('ba-quick');
	var startTime = window.performance && performance.now ? performance.now() : 0;

	/* ---------------------------------------------------------------
	   Loader
	   --------------------------------------------------------------- */
	var MIN_INTRO = quick ? 0 : 700;   // keep the logo up long enough to read
	var MAX_WAIT = quick ? 1200 : 2600; // never hold the page longer than this
	var loaded = false;

	function now() { return window.performance && performance.now ? performance.now() : Date.now(); }

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

	// The photo that matters most on this page (home hero / bolts banner)
	function criticalImageUrl() {
		var el = document.querySelector('#hero') || document.querySelector('#bolts1 .b-header-bot');
		if (!el) return null;
		var bg = window.getComputedStyle(el).backgroundImage || '';
		var m = bg.match(/url\(["']?(.*?)["']?\)/);
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
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', function () { whenCriticalReady(markLoaded); });
	} else {
		whenCriticalReady(markLoaded);
	}

	// Coming back via the browser's back button: make sure the page isn't stuck behind the veil
	window.addEventListener('pageshow', function (e) {
		if (e.persisted) {
			root.classList.remove('is-leaving');
			root.classList.add('is-loaded');
		}
	});

	/* ---------------------------------------------------------------
	   Everything below needs the DOM
	   --------------------------------------------------------------- */
	function onReady(fn) {
		if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
		else fn();
	}

	onReady(function () {
		initYear();
		initHeader();
		initMenu();
		initLinks();
		initButtonLinks();
		prepareReveals();
	});

	/* Footer copyright year.
	   Set straight away from the visitor's clock, then confirmed against the
	   web server's own clock (the Date header on a tiny HEAD request), so a
	   device with the wrong date can't show the wrong year. */
	function initYear() {
		var spans = document.querySelectorAll('[data-year]');
		if (!spans.length) return;
		function setYear(y) {
			Array.prototype.forEach.call(spans, function (s) { s.textContent = y; });
		}
		setYear(new Date().getFullYear());
		if (!window.fetch || location.protocol.indexOf('http') !== 0) return;
		fetch(location.href, { method: 'HEAD', cache: 'no-store' }).then(function (res) {
			var d = new Date(res.headers.get('Date'));
			if (!isNaN(d)) setYear(d.getUTCFullYear());
		}).catch(function () {});
	}

	/* Header: tuck away after 300px, as before, but with a CSS transition */
	function initHeader() {
		var header = document.querySelector('.header1');
		if (!header) return;
		var ticking = false;
		function update() {
			header.classList.toggle('is-tucked', (window.pageYOffset || 0) > 300);
			ticking = false;
		}
		window.addEventListener('scroll', function () {
			if (!ticking) { ticking = true; requestAnimationFrame(update); }
		}, { passive: true });
		update();
	}

	/* Mobile menu */
	function initMenu() {
		var menu = document.querySelector('.resp-menu');
		if (!menu) return;
		var openers = document.querySelectorAll('.resp-men-but');
		var closer = menu.querySelector('.exit');

		function setOpen(open) {
			menu.classList.toggle('is-open', open);
			document.body.classList.toggle('menu-open', open);
			menu.setAttribute('aria-hidden', open ? 'false' : 'true');
			if (open) {
				var first = menu.querySelector('a');
				if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 50);
			}
		}

		menu.setAttribute('aria-hidden', 'true');
		Array.prototype.forEach.call(openers, function (btn) {
			btn.setAttribute('role', 'button');
			btn.setAttribute('tabindex', '0');
			btn.setAttribute('aria-label', 'Open menu');
			btn.addEventListener('click', function () { setOpen(!menu.classList.contains('is-open')); });
			btn.addEventListener('keydown', function (e) {
				if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(true); }
			});
		});
		if (closer) {
			closer.setAttribute('role', 'button');
			closer.setAttribute('tabindex', '0');
			closer.setAttribute('aria-label', 'Close menu');
			closer.addEventListener('click', function () { setOpen(false); });
			closer.addEventListener('keydown', function (e) {
				if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(false); }
			});
		}
		document.addEventListener('keydown', function (e) {
			if (e.key === 'Escape' && menu.classList.contains('is-open')) setOpen(false);
		});
		menu.addEventListener('click', function (e) {
			if (e.target.closest('a')) setOpen(false);
		});
	}

	/* Links: smooth-scroll on-page anchors, fade out when going to another page.
	   (The old jQuery handler intercepted every link on the site.) */
	function initLinks() {
		document.addEventListener('click', function (e) {
			if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
			var a = e.target.closest('a[href]');
			if (!a) return;
			var href = a.getAttribute('href');

			// On-page anchor
			if (href.charAt(0) === '#') {
				e.preventDefault();
				var target = href.length > 1 ? document.getElementById(href.slice(1)) : null;
				if (target) {
					target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
					if (history.replaceState) history.replaceState(null, '', href);
				} else {
					window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
				}
				return;
			}

			// Another page on this site: brief fade, then go
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

	/* Some buttons wrap their link (<button><a>): make the whole button clickable */
	function initButtonLinks() {
		Array.prototype.forEach.call(document.querySelectorAll('button.button'), function (btn) {
			var link = btn.querySelector('a[href]');
			if (!link) return;
			btn.addEventListener('click', function (e) {
				if (!e.target.closest('a')) link.click();
			});
		});
	}

	/* ---------------------------------------------------------------
	   Scroll reveals
	   --------------------------------------------------------------- */
	var revealItems = [];
	var revealsStarted = false;

	function prepareReveals() {
		revealItems = Array.prototype.slice.call(document.querySelectorAll('[data-reveal], [data-reveal-stagger]'));
		revealItems.forEach(function (el) {
			if (el.hasAttribute('data-reveal-stagger')) {
				Array.prototype.forEach.call(el.children, function (child, i) {
					child.style.setProperty('--i', i);
				});
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
					// Already scrolled past (e.g. page reloaded half-way down): show at once
					entry.target.style.transition = 'none';
					reveal(entry.target, 0);
					io.unobserve(entry.target);
					requestAnimationFrame(function () { entry.target.style.transition = ''; });
				}
			});
			// Items that arrive together cascade top-to-bottom, left-to-right
			batch.sort(function (a, b) {
				return (a.boundingClientRect.top - b.boundingClientRect.top) || (a.boundingClientRect.left - b.boundingClientRect.left);
			});
			batch.forEach(function (entry, i) {
				reveal(entry.target, Math.min(i, 4) * 90);
				io.unobserve(entry.target);
			});
		}, {
			// Fire as soon as the top of an element is ~10% inside the viewport
			rootMargin: '0px 0px -10% 0px',
			threshold: 0
		});

		revealItems.forEach(function (el) { io.observe(el); });
	}
})();
