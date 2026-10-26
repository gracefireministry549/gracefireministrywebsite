// Public testimony submission and approved testimony display.
(function () {
  const cfg = window.GRACE_FIRE_SUPABASE || {};
  const publicKey = cfg.anonKey || cfg.publishableKey || '';
  const endpoint = cfg.url && publicKey && !cfg.url.includes('YOUR_PROJECT_REF') && !publicKey.includes('YOUR_SUPABASE') ? cfg.url.replace(/\/$/, '') + '/rest/v1/testimonies' : '';
  const headers = {'apikey': publicKey, 'Authorization': 'Bearer ' + publicKey};
  const grid = document.getElementById('approved-testimonies');
  if (grid) {
    if (!endpoint) grid.textContent = 'Approved testimonies are temporarily unavailable.';
    else fetch(endpoint + '?select=id,display_name,testimony,created_at&published=eq.true&order=created_at.desc&limit=6', {headers})
      .then(r => { if (!r.ok) throw new Error('Unable to load testimonies'); return r.json(); })
      .then(rows => {
        grid.replaceChildren();
        if (!rows.length) {
          const p = document.createElement('p');
          p.textContent = 'No testimonies have been published yet. You can be the first to share what God has done.';
          grid.appendChild(p); return;
        }
        rows.forEach(row => {
          const card = document.createElement('article'); card.className = 'testi-card reveal in';
          const quote = document.createElement('q'); quote.textContent = row.testimony;
          const name = document.createElement('span'); name.className = 'testi-name'; name.textContent = row.display_name;
          card.append(quote, name); grid.appendChild(card);
        });
      }).catch(() => { grid.textContent = 'Approved testimonies are temporarily unavailable. Please try again later.'; });
  }
  const form = document.getElementById('testimony-form');
  if (!form) return;
  const message = document.getElementById('testimony-msg');
  const button = form.querySelector('button[type="submit"]');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const displayName = String(form.elements.display_name.value || '').trim();
    const testimony = String(form.elements.testimony.value || '').trim();
    const consent = form.elements.consent.checked;
    const show = (text, ok) => {
      message.textContent = text; message.className = 'form-msg ' + (ok ? 'ok' : 'err');
      message.setAttribute('role', 'status'); message.setAttribute('aria-live', 'polite');
    };
    if (!endpoint) { show('The form is temporarily unavailable. Please contact the ministry.', false); return; }
    if (displayName.length < 2 || displayName.length > 100 || testimony.length < 10 || testimony.length > 3000 || !consent) {
      show('Enter your name, a testimony of 10–3000 characters, and give permission for it to be considered for publication.', false); return;
    }
    button.disabled = true; button.textContent = 'Submitting…';
    try {
      const response = await fetch(endpoint, {method:'POST',headers:{...headers,'Content-Type':'application/json','Prefer':'return=minimal'},
        body:JSON.stringify({display_name:displayName,testimony,consent_to_publish:true,published:false})});
      if (!response.ok) throw new Error('Submission rejected');
      form.reset(); show('Thank you for sharing. Your testimony has been received and will remain private until the ministry reviews it.', true);
    } catch (_) { show('We could not submit your testimony right now. Please check your connection and try again.', false); }
    finally { button.disabled = false; button.textContent = 'Submit Testimony for Review'; }
  });
})();
