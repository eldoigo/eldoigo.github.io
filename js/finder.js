/* =====================================================================
   Bon Accord Engineering — materials finder (bolts page)
   No database: each grade is a card in bolts.html. To add one, copy a
   <li class="ba-grade"> line and change its text, data-cat and keywords.
   ===================================================================== */
(function () {
	'use strict';
	var root = document.querySelector('[data-finder]');
	if (!root) return;

	var input = root.querySelector('input[type="search"]');
	var chips = Array.prototype.slice.call(root.querySelectorAll('.ba-chip'));
	var cards = Array.prototype.slice.call(root.querySelectorAll('.ba-grade'));
	var count = root.querySelector('.ba-finder__count');
	var empty = root.querySelector('.ba-finder__empty');
	var ask = root.querySelector('[data-finder-ask]');
	var category = 'all';

	cards.forEach(function (card) {
		card._text = (card.textContent + ' ' + (card.getAttribute('data-keywords') || '')).toLowerCase();
	});

	function apply() {
		var query = input.value.trim().toLowerCase();
		var terms = query.split(/[\s,]+/).filter(Boolean);
		var shown = 0;
		cards.forEach(function (card) {
			var match = (category === 'all' || card.getAttribute('data-cat') === category) &&
				terms.every(function (t) { return card._text.indexOf(t) > -1; });
			if (match) {
				if (card.hidden) {
					card.hidden = false;
					card.classList.remove('is-entering');
					void card.offsetWidth;
					card.classList.add('is-entering');
				}
				shown++;
			} else {
				card.hidden = true;
			}
		});
		count.textContent = shown === cards.length
			? 'Showing all ' + shown + ' material groups'
			: 'Showing ' + shown + ' of ' + cards.length + ' material groups';
		empty.hidden = shown > 0;
		if (ask) ask.href = './contact.html?service=bolts' + (query ? '&material=' + encodeURIComponent(input.value.trim()) : '') + '#quote';
	}

	chips.forEach(function (chip) {
		chip.addEventListener('click', function () {
			category = chip.getAttribute('data-cat');
			chips.forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
			apply();
		});
	});
	input.addEventListener('input', apply);
	apply();
})();
