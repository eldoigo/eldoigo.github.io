/* =====================================================================
   Bon Accord Engineering — quote request form
   Sends through Web3Forms (https://web3forms.com), which emails each
   enquiry to the address the access key was created with.

   SETUP: in index.html and contact.html, replace YOUR_WEB3FORMS_ACCESS_KEY
   with the real key. Until then the form still works: it opens the
   visitor's email app with everything filled in, addressed to sales@.
   ===================================================================== */
(function () {
	'use strict';
	var form = document.querySelector('[data-quote-form]');
	if (!form) return;

	var FALLBACK_EMAIL = 'sales@bonaccordengineering.com';
	var PHONE = '+44 (0)1224 878898';
	var status = form.querySelector('.ba-quote__status');
	var button = form.querySelector('.ba-submit');
	var buttonText = button.querySelector('span');
	var labels = { name: 'Name', company: 'Company', email: 'Email', phone: 'Phone', service: 'Enquiry',
		material: 'Material / grade', size: 'Size', quantity: 'Quantity', needed_by: 'Needed by', message: 'Details' };

	/* Pre-fill from links such as contact.html?service=bolts&material=B7#quote */
	var services = { bolts: 'Stud bolts & fasteners', coating: 'Coatings & platings', machining: 'Machining', anco: 'ANCO® PN-LOC® nuts' };
	try {
		var params = new URLSearchParams(location.search);
		var service = params.get('service');
		var material = params.get('material');
		if (service && services[service]) form.elements.service.value = services[service];
		if (material) form.elements.material.value = material.slice(0, 120);
	} catch (e) {}

	function show(state, message) {
		if (!state) { status.removeAttribute('data-state'); status.textContent = ''; return; }
		status.setAttribute('data-state', state);
		status.textContent = message;
	}

	function busy(on) {
		button.disabled = on;
		button.classList.toggle('is-loading', on);
		buttonText.textContent = on ? 'Sending' : 'Send request';
	}

	function emailFallback(data) {
		var lines = [];
		Object.keys(labels).forEach(function (name) {
			var value = (data.get(name) || '').toString().trim();
			if (value) lines.push(labels[name] + ': ' + value);
		});
		var subject = 'Quote request: ' + (data.get('service') || 'website enquiry');
		window.location.href = 'mailto:' + FALLBACK_EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
		show('info', 'Your email app should now open with your request filled in. Just press send. If nothing opens, email ' + FALLBACK_EMAIL + ' or call ' + PHONE + '.');
	}

	function success() {
		form.classList.add('is-sent');
		var panel = form.querySelector('.ba-quote__success');
		if (panel) panel.focus({ preventScroll: true });
		form.scrollIntoView({ behavior: 'smooth', block: 'center' });
	}

	form.addEventListener('submit', function (e) {
		e.preventDefault();
		show(null);
		if (!form.checkValidity()) {
			form.reportValidity();
			var firstBad = form.querySelector(':invalid');
			if (firstBad) firstBad.focus();
			return;
		}
		if (form.elements.botcheck && form.elements.botcheck.checked) return; // spam bot

		var data = new FormData(form);
		var key = (data.get('access_key') || '').toString();
		if (!key || key.indexOf('YOUR_') === 0 || !window.fetch) { emailFallback(data); return; }

		busy(true);
		fetch(form.action, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
			.then(function (res) {
				return res.json().then(function (json) { return { ok: res.ok, json: json }; });
			})
			.then(function (r) {
				if (r.ok && r.json && r.json.success) { form.reset(); success(); }
				else throw new Error((r.json && r.json.message) || 'Send failed');
			})
			.catch(function () {
				show('error', 'Sorry, your request did not send. Please call ' + PHONE + ' or email ' + FALLBACK_EMAIL + '.');
			})
			.then(function () { busy(false); });
	});
})();
