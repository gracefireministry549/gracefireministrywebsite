// Grace Fire Deliverance Healing Global World Ministry — site scripts
document.addEventListener('DOMContentLoaded', function () {
  const header = document.querySelector('.site-header');
  if (header) window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 30));

  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));
  }

  const slides = document.querySelectorAll('.hero-slide');
  const dotsWrap = document.querySelector('.hero-dots');
  if (slides.length) {
    let current = 0;
    if (dotsWrap) slides.forEach((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Show slide ' + (i + 1));
      if (i === 0) b.classList.add('active');
      b.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(b);
    });
    function goTo(i) {
      slides[current].classList.remove('active');
      if (dotsWrap && dotsWrap.children[current]) dotsWrap.children[current].classList.remove('active');
      current = i;
      slides[current].classList.add('active');
      if (dotsWrap && dotsWrap.children[current]) dotsWrap.children[current].classList.add('active');
    }
    if (slides.length > 1) setInterval(() => goTo((current + 1) % slides.length), 6000);
  }

  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: 0.15 });
    revealEls.forEach(el => io.observe(el));
  } else revealEls.forEach(el => el.classList.add('in'));

  // The anniversary has passed; avoid showing a misleading active countdown.
  const countdownTarget = new Date('2026-08-30T09:00:00+01:00').getTime();
  const cdDays = document.getElementById('cd-days');
  const cdHours = document.getElementById('cd-hours');
  const cdMinutes = document.getElementById('cd-minutes');
  const cdSeconds = document.getElementById('cd-seconds');
  if (cdDays) {
    function tick() {
      const diff = Math.max(0, countdownTarget - Date.now());
      cdDays.textContent = String(Math.floor(diff / 86400000)).padStart(2, '0');
      cdHours.textContent = String(Math.floor(diff / 3600000) % 24).padStart(2, '0');
      cdMinutes.textContent = String(Math.floor(diff / 60000) % 60).padStart(2, '0');
      cdSeconds.textContent = String(Math.floor(diff / 1000) % 60).padStart(2, '0');
    }
    tick(); setInterval(tick, 1000);
  }

  async function submitToSupabase(form, options) {
    const msg = document.getElementById(options.messageId);
    const btn = form.querySelector('button[type="submit"]');
    const cfg = window.GRACE_FIRE_SUPABASE;
    const values = Object.fromEntries(new FormData(form).entries());
    const setMessage = (text, ok) => {
      if (!msg) return;
      msg.textContent = text;
      msg.className = 'form-msg ' + (ok ? 'ok' : 'err');
      msg.setAttribute('role', 'status');
      msg.setAttribute('aria-live', 'polite');
    };

    if (!cfg || !cfg.url || !cfg.publishableKey) {
      setMessage('The form is temporarily unavailable. Please contact us on WhatsApp.', false);
      return;
    }

    const name = String(values.name || '').trim();
    const email = String(values.email || '').trim();
    const phone = String(values.phone || '').trim();
    const bodyText = String(values[options.bodyField] || '').trim();
    const subject = String(values.subject || 'Website contact message').trim() || 'Website contact message';

    if (name.length < 2 || name.length > 120 || bodyText.length < 3 || bodyText.length > 3000) {
      setMessage('Please check your name and message. The message must be between 3 and 3000 characters.', false);
      return;
    }
    if (options.table === 'contact_messages' && (email.length < 3 || email.length > 254)) {
      setMessage('Please enter a valid email address.', false);
      return;
    }
    if (email.length > 254 || phone.length > 40 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      setMessage('Please check your email address or phone number.', false);
      return;
    }

    if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }
    try {
      const row = options.table === 'prayer_requests'
        ? { full_name: name, email: email || null, phone: phone || null, prayer_request: bodyText, consent: true }
        : { full_name: name, email, subject: subject.slice(0, 160), message: bodyText };
      const response = await fetch(cfg.url + '/rest/v1/' + options.table, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': cfg.publishableKey,
          'Authorization': 'Bearer ' + cfg.publishableKey,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(row)
      });
      if (!response.ok) {
        let details = {};
        try { details = await response.json(); } catch (_) {}
        console.error('Supabase form submission failed:', response.status, details.code || '');
        if (response.status === 401 || response.status === 403) {
          setMessage('We could not submit the form right now. Please contact us on WhatsApp.', false);
        } else if (response.status === 429) {
          setMessage('Too many submissions in a short time. Please wait and try again.', false);
        } else {
          setMessage('We could not send your message. Please check the details and try again.', false);
        }
        return;
      }
      setMessage(options.successMessage, true);
      form.reset();
    } catch (error) {
      console.error('Supabase connection error:', error);
      setMessage('Connection problem. Please check your internet and try again, or contact us on WhatsApp.', false);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = options.buttonText;
      }
    }
  }

  const prayerForm = document.getElementById('prayer-form');
  if (prayerForm) prayerForm.addEventListener('submit', async e => {
    e.preventDefault();
    await submitToSupabase(prayerForm, {
      table: 'prayer_requests', bodyField: 'request', messageId: 'prayer-msg',
      buttonText: 'Send Prayer Request',
      successMessage: 'Thank you. Your prayer request has been received — we are praying with you.'
    });
  });

  const contactForm = document.getElementById('contact-form');
  if (contactForm) contactForm.addEventListener('submit', async e => {
    e.preventDefault();
    await submitToSupabase(contactForm, {
      table: 'contact_messages', bodyField: 'message', messageId: 'contact-msg',
      buttonText: 'Send Message',
      successMessage: 'Message sent successfully. We will get back to you shortly.'
    });
  });

  document.querySelectorAll('.copy-btn').forEach(btn => btn.addEventListener('click', async () => {
    const text = btn.getAttribute('data-copy');
    try {
      await navigator.clipboard.writeText(text);
      const original = btn.textContent; btn.textContent = 'Copied!';
      setTimeout(() => btn.textContent = original, 1500);
    } catch (_) {
      btn.textContent = 'Please copy manually';
      setTimeout(() => btn.textContent = 'Copy', 1500);
    }
  }));

  const galleryItems = document.querySelectorAll('.gallery-item[data-full]');
  if (galleryItems.length) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(7,14,36,.92);display:none;align-items:center;justify-content:center;z-index:2000;padding:24px;cursor:zoom-out;';
    const img = document.createElement('img');
    img.style.cssText = 'max-width:90vw;max-height:85vh;border-radius:10px;box-shadow:0 20px 50px rgba(0,0,0,.5);';
    img.alt = 'Expanded gallery image';
    overlay.appendChild(img); document.body.appendChild(overlay);
    galleryItems.forEach(item => item.addEventListener('click', () => {
      img.src = item.getAttribute('data-full'); overlay.style.display = 'flex';
    }));
    overlay.addEventListener('click', () => { overlay.style.display = 'none'; img.removeAttribute('src'); });
  }
});
