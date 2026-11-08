/* =====================================================================
   Bon Accord Engineering — image carousel + lightbox
   No dependencies (replaces Flickity).

   Markup:
   <div class="ba-carousel" data-carousel aria-label="...">
     <figure class="ba-carousel__slide"><img src="..." alt="..."></figure>
     ...
   </div>

   Optional: data-autoplay="5000" (ms). Set data-autoplay="0" to turn it off.
   ===================================================================== */
(function () {
	'use strict';

	var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var ICON_PREV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>';
	var ICON_NEXT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>';
	var ICON_CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

	function pad(n) { return (n < 10 ? '0' : '') + n; }
	function el(tag, cls, html) {
		var node = document.createElement(tag);
		if (cls) node.className = cls;
		if (html) node.innerHTML = html;
		return node;
	}

	/* ---------------------------------------------------------------
	   Carousel
	   --------------------------------------------------------------- */
	function Carousel(root) {
		this.root = root;
		this.slides = Array.prototype.slice.call(root.querySelectorAll('.ba-carousel__slide'));
		if (this.slides.length < 1) return;
		this.index = 0;
		this.delay = parseInt(root.getAttribute('data-autoplay') || '5000', 10);
		this.autoplay = this.delay > 0 && !reduceMotion && this.slides.length > 1;
		this.pauses = {};
		this.build();
		this.bind();
		this.show(0, 0, true);
	}

	Carousel.prototype.build = function () {
		var root = this.root, self = this;
		var label = root.getAttribute('aria-label') || 'Image gallery';
		root.setAttribute('role', 'region');
		root.setAttribute('aria-roledescription', 'carousel');
		root.setAttribute('tabindex', '0');

		// Stage wraps the slides
		this.stage = el('div', 'ba-carousel__stage');
		this.slides.forEach(function (slide, i) {
			slide.setAttribute('role', 'group');
			slide.setAttribute('aria-roledescription', 'slide');
			slide.setAttribute('aria-label', (i + 1) + ' of ' + self.slides.length);
			var img = slide.querySelector('img');
			if (img) {
				img.setAttribute('decoding', 'async');
				img.setAttribute('draggable', 'false');
				if (i > 0) img.setAttribute('loading', 'lazy');
				// Wide photos and collages: show the whole image over a blurred fill
				var checkWide = function () {
					if (img.naturalWidth && img.naturalWidth / img.naturalHeight > 1.9) {
						slide.classList.add('is-wide');
						slide.style.setProperty('--bg', 'url("' + (img.currentSrc || img.src) + '")');
					}
				};
				if (img.complete) checkWide(); else img.addEventListener('load', checkWide);
			}
			self.stage.appendChild(slide);
		});
		root.appendChild(this.stage);

		if (this.slides.length < 2) return;

		this.prevBtn = el('button', 'ba-carousel__btn ba-carousel__btn--prev', ICON_PREV);
		this.nextBtn = el('button', 'ba-carousel__btn ba-carousel__btn--next', ICON_NEXT);
		this.prevBtn.type = this.nextBtn.type = 'button';
		this.prevBtn.setAttribute('aria-label', 'Previous image');
		this.nextBtn.setAttribute('aria-label', 'Next image');
		this.stage.appendChild(this.prevBtn);
		this.stage.appendChild(this.nextBtn);

		this.count = el('div', 'ba-carousel__count');
		this.count.setAttribute('aria-live', 'polite');
		this.stage.appendChild(this.count);

		if (this.autoplay) {
			this.progress = el('div', 'ba-carousel__progress', '<span></span>');
			this.bar = this.progress.firstChild;
			root.style.setProperty('--autoplay', this.delay + 'ms');
			this.stage.appendChild(this.progress);
		}

		// Thumbnails
		this.thumbWrap = el('div', 'ba-carousel__thumbs');
		this.thumbWrap.setAttribute('aria-label', label + ' thumbnails');
		this.thumbs = this.slides.map(function (slide, i) {
			var img = slide.querySelector('img');
			var b = el('button', 'ba-carousel__thumb');
			b.type = 'button';
			b.setAttribute('aria-label', 'Show image ' + (i + 1) + (img && img.alt ? ': ' + img.alt : ''));
			if (img) {
				var t = el('img');
				t.src = img.getAttribute('src');
				t.alt = '';
				t.loading = 'lazy';
				t.decoding = 'async';
				b.appendChild(t);
			}
			b.addEventListener('click', function () { self.go(i); });
			self.thumbWrap.appendChild(b);
			return b;
		});
		root.appendChild(this.thumbWrap);
	};

	Carousel.prototype.bind = function () {
		var self = this, root = this.root, stage = this.stage;

		if (this.prevBtn) {
			this.prevBtn.addEventListener('click', function (e) { e.stopPropagation(); self.prev(); });
			this.nextBtn.addEventListener('click', function (e) { e.stopPropagation(); self.next(); });
		}

		root.addEventListener('keydown', function (e) {
			if (e.key === 'ArrowLeft') { e.preventDefault(); self.prev(); }
			else if (e.key === 'ArrowRight') { e.preventDefault(); self.next(); }
			else if (e.key === 'Enter' && e.target === root) { self.openLightbox(); }
		});

		// Swipe / drag, and tap to enlarge
		var startX = 0, startY = 0, tracking = false;
		stage.addEventListener('pointerdown', function (e) {
			if (e.target.closest('button')) return;
			tracking = true; startX = e.clientX; startY = e.clientY;
		});
		stage.addEventListener('pointerup', function (e) {
			if (!tracking) return;
			tracking = false;
			var dx = e.clientX - startX, dy = e.clientY - startY;
			if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
				dx < 0 ? self.next() : self.prev();
			} else if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {
				self.openLightbox();
			}
		});
		stage.addEventListener('pointercancel', function () { tracking = false; });

		if (!this.autoplay) return;

		// Advance when the progress bar finishes (keeps bar and timing in sync)
		this.bar.addEventListener('animationend', function () { self.next(true); });

		// Pause while hovered, focused, off-screen or in a background tab
		root.addEventListener('mouseenter', function () { self.pause('hover', true); });
		root.addEventListener('mouseleave', function () { self.pause('hover', false); });
		root.addEventListener('focusin', function () { self.pause('focus', true); });
		root.addEventListener('focusout', function (e) { if (!root.contains(e.relatedTarget)) self.pause('focus', false); });
		document.addEventListener('visibilitychange', function () { self.pause('tab', document.hidden); });

		// Don't start the clock until the page intro is over and the carousel
		// has actually been seen, so the first photo gets its full time on screen
		var html = document.documentElement, visible = false, started = false;
		this.pause('intro', true);
		function maybeStart() {
			if (started || !visible || !html.classList.contains('is-loaded')) return;
			started = true;
			setTimeout(function () { self.restartTimer(); self.pause('intro', false); }, 700);
		}
		if ('MutationObserver' in window) {
			new MutationObserver(maybeStart).observe(html, { attributes: true, attributeFilter: ['class'] });
		}
		if ('IntersectionObserver' in window) {
			new IntersectionObserver(function (entries) {
				visible = entries[0].isIntersecting;
				self.pause('offscreen', !visible);
				maybeStart();
			}, { threshold: 0.25 }).observe(root);
		} else {
			visible = true;
			maybeStart();
		}
	};

	Carousel.prototype.pause = function (reason, on) {
		if (on) this.pauses[reason] = true; else delete this.pauses[reason];
		this.root.classList.toggle('is-paused', Object.keys(this.pauses).length > 0);
	};

	Carousel.prototype.restartTimer = function () {
		if (!this.bar) return;
		this.bar.classList.remove('is-running');
		void this.bar.offsetWidth; // restart the CSS animation
		this.bar.classList.add('is-running');
	};

	Carousel.prototype.show = function (i, dir, instant) {
		var n = this.slides.length;
		i = ((i % n) + n) % n;
		var prev = this.slides[this.index];
		var next = this.slides[i];

		if (!instant && i !== this.index) {
			// Direction-aware movement: new image drifts in, old one drifts out
			this.root.style.setProperty('--from', dir < 0 ? '-4%' : '4%');
			this.root.style.setProperty('--to', dir < 0 ? '4%' : '-4%');
			void next.offsetWidth;
			prev.classList.add('is-leaving');
			prev.classList.remove('is-active');
			clearTimeout(prev._leaveTimer);
			prev._leaveTimer = setTimeout(function () { prev.classList.remove('is-leaving'); }, 950);
		} else if (instant) {
			this.slides.forEach(function (s) { s.classList.remove('is-active', 'is-leaving'); });
		}

		next.classList.remove('is-leaving');
		next.classList.add('is-active');
		this.index = i;

		// Warm up the following image so the next change is instant
		var after = this.slides[(i + 1) % n].querySelector('img');
		if (after && after.loading === 'lazy') after.loading = 'eager';

		if (this.count) this.count.innerHTML = '<b>' + pad(i + 1) + '</b> <i>/ ' + pad(n) + '</i>';
		if (this.thumbs) {
			this.thumbs.forEach(function (t, k) {
				t.classList.toggle('is-active', k === i);
				if (k === i) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current');
			});
			var t = this.thumbs[i], wrap = this.thumbWrap;
			var target = t.offsetLeft - (wrap.clientWidth - t.offsetWidth) / 2;
			wrap.scrollLeft = Math.max(0, target); // scroll the strip only, never the page
		}
		this.restartTimer();
	};

	Carousel.prototype.go = function (i) {
		if (i === this.index) return;
		this.show(i, i > this.index ? 1 : -1);
	};
	Carousel.prototype.next = function () { this.show(this.index + 1, 1); };
	Carousel.prototype.prev = function () { this.show(this.index - 1, -1); };

	Carousel.prototype.openLightbox = function () {
		var self = this;
		Lightbox.open(this.slides.map(function (s) { return s.querySelector('img'); }), this.index, function (i) {
			if (i !== self.index) self.show(i, 0, false);
		});
	};

	/* ---------------------------------------------------------------
	   Lightbox (one shared <dialog>)
	   --------------------------------------------------------------- */
	var Lightbox = {
		dialog: null,
		build: function () {
			var d = el('dialog', 'ba-lightbox');
			d.setAttribute('aria-label', 'Enlarged image');
			d.innerHTML =
				'<img class="ba-lightbox__img" alt="">' +
				'<button type="button" class="ba-lightbox__btn ba-lightbox__close" aria-label="Close">' + ICON_CLOSE + '</button>' +
				'<button type="button" class="ba-lightbox__btn ba-lightbox__prev" aria-label="Previous image">' + ICON_PREV + '</button>' +
				'<button type="button" class="ba-lightbox__btn ba-lightbox__next" aria-label="Next image">' + ICON_NEXT + '</button>' +
				'<div class="ba-lightbox__count"></div>';
			document.body.appendChild(d);
			this.dialog = d;
			this.img = d.querySelector('.ba-lightbox__img');
			this.countEl = d.querySelector('.ba-lightbox__count');
			var self = this;
			d.querySelector('.ba-lightbox__close').addEventListener('click', function () { d.close(); });
			d.querySelector('.ba-lightbox__prev').addEventListener('click', function () { self.step(-1); });
			d.querySelector('.ba-lightbox__next').addEventListener('click', function () { self.step(1); });
			d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
			d.addEventListener('keydown', function (e) {
				if (e.key === 'ArrowLeft') self.step(-1);
				else if (e.key === 'ArrowRight') self.step(1);
			});
			var sx = 0;
			d.addEventListener('pointerdown', function (e) { sx = e.clientX; });
			d.addEventListener('pointerup', function (e) {
				var dx = e.clientX - sx;
				if (Math.abs(dx) > 50 && !e.target.closest('button')) self.step(dx < 0 ? 1 : -1);
			});
			d.addEventListener('close', function () { document.body.classList.remove('menu-open'); });
		},
		open: function (imgs, index, onChange) {
			if (typeof HTMLDialogElement === 'undefined') return;
			if (!this.dialog) this.build();
			this.imgs = imgs;
			this.onChange = onChange;
			this.index = index;
			this.render(0);
			this.dialog.showModal();
			document.body.classList.add('menu-open'); // reuses the scroll lock
		},
		step: function (dir) {
			var n = this.imgs.length;
			this.index = (this.index + dir + n) % n;
			this.render(dir);
			if (this.onChange) this.onChange(this.index);
		},
		render: function (dir) {
			var src = this.imgs[this.index];
			this.img.src = src.currentSrc || src.src;
			this.img.alt = src.alt || '';
			this.countEl.textContent = pad(this.index + 1) + ' / ' + pad(this.imgs.length);
			if (dir) {
				this.img.style.setProperty('--lb-from', dir > 0 ? '24px' : '-24px');
				this.img.classList.remove('is-swapping');
				void this.img.offsetWidth;
				this.img.classList.add('is-swapping');
			}
		}
	};

	function init() {
		Array.prototype.forEach.call(document.querySelectorAll('[data-carousel]'), function (node) {
			if (!node._baCarousel) node._baCarousel = new Carousel(node);
		});
	}
	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
	else init();
})();
