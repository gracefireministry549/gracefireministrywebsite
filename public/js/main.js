// =====================================================================
// GRACE FIRE DELIVERANCE HEALING GLOBAL WORLD MINISTRY — site scripts
// =====================================================================

document.addEventListener('DOMContentLoaded', function () {

  /* ---------- Header shrink on scroll ---------- */
  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', function () {
      header.classList.toggle('scrolled', window.scrollY > 30);
    });
  }

  /* ---------- Mobile nav toggle ---------- */
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      navLinks.classList.toggle('open');
    });
    navLinks.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => navLinks.classList.remove('open'))
    );
  }

  /* ---------- Hero slider ---------- */
  const slides = document.querySelectorAll('.hero-slide');
  const dotsWrap = document.querySelector('.hero-dots');
  if (slides.length) {
    let current = 0;
    if (dotsWrap) {
      slides.forEach((_, i) => {
        const b = document.createElement('button');
        if (i === 0) b.classList.add('active');
        b.addEventListener('click', () => goTo(i));
        dotsWrap.appendChild(b);
      });
    }
    function goTo(i) {
      slides[current].classList.remove('active');
      dotsWrap && dotsWrap.children[current].classList.remove('active');
      current = i;
      slides[current].classList.add('active');
      dotsWrap && dotsWrap.children[current].classList.add('active');
    }
    setInterval(() => goTo((current + 1) % slides.length), 6000);
  }

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  /* ---------- Countdown to next event ----------
     Set the target date/time below (ISO format).
     Currently set to the 9th Anniversary: 30 August 2026, 9:00 AM (Lagos time). */
  const countdownTarget = new Date('2026-08-30T09:00:00+01:00').getTime();
  const cdDays = document.getElementById('cd-days');
  const cdHours = document.getElementById('cd-hours');
  const cdMinutes = document.getElementById('cd-minutes');
  const cdSeconds = document.getElementById('cd-seconds');

  if (cdDays) {
    function tick() {
      const now = Date.now();
      let diff = countdownTarget - now;
      if (diff < 0) diff = 0;
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      cdDays.textContent = String(d).padStart(2, '0');
      cdHours.textContent = String(h).padStart(2, '0');
      cdMinutes.textContent = String(m).padStart(2, '0');
      cdSeconds.textContent = String(s).padStart(2, '0');
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- Prayer request form ---------- */
  const prayerForm = document.getElementById('prayer-form');
  if (prayerForm) {
    const msg = document.getElementById('prayer-msg');
    prayerForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const btn = prayerForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Sending...';
      const payload = {
        name: prayerForm.name.value.trim(),
        phone: prayerForm.phone.value.trim(),
        email: prayerForm.email.value.trim(),
        request: prayerForm.request.value.trim()
      };
      try {
        const res = await fetch('/api/prayer-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
          msg.textContent = 'Thank you. Your prayer request has been received — we are praying with you.';
          msg.className = 'form-msg ok';
          prayerForm.reset();
        } else {
          msg.textContent = data.error || 'Something went wrong. Please try again.';
          msg.className = 'form-msg err';
        }
      } catch (err) {
        msg.textContent = 'Network error. Please check your connection and try again.';
        msg.className = 'form-msg err';
      } finally {
        btn.disabled = false;
        btn.textContent = 'Send Prayer Request';
      }
    });
  }

  /* ---------- Contact form ---------- */
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    const msg = document.getElementById('contact-msg');
    contactForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const btn = contactForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Sending...';
      const payload = {
        name: contactForm.name.value.trim(),
        email: contactForm.email.value.trim(),
        subject: contactForm.subject.value.trim(),
        message: contactForm.message.value.trim()
      };
      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
          msg.textContent = 'Message sent. We will get back to you shortly.';
          msg.className = 'form-msg ok';
          contactForm.reset();
        } else {
          msg.textContent = data.error || 'Something went wrong. Please try again.';
          msg.className = 'form-msg err';
        }
      } catch (err) {
        msg.textContent = 'Network error. Please check your connection and try again.';
        msg.className = 'form-msg err';
      } finally {
        btn.disabled = false;
        btn.textContent = 'Send Message';
      }
    });
  }

  /* ---------- Copy account number buttons ---------- */
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const text = btn.getAttribute('data-copy');
      navigator.clipboard.writeText(text).then(() => {
        const original = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => (btn.textContent = original), 1500);
      });
    });
  });

  /* ---------- Simple gallery lightbox ---------- */
  const galleryItems = document.querySelectorAll('.gallery-item[data-full]');
  if (galleryItems.length) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(7,14,36,.92);display:none;align-items:center;justify-content:center;z-index:2000;padding:24px;cursor:zoom-out;';
    const img = document.createElement('img');
    img.style.cssText = 'max-width:90vw;max-height:85vh;border-radius:10px;box-shadow:0 20px 50px rgba(0,0,0,.5);';
    overlay.appendChild(img);
    document.body.appendChild(overlay);
    galleryItems.forEach(item => {
      item.addEventListener('click', () => {
        img.src = item.getAttribute('data-full');
        overlay.style.display = 'flex';
      });
    });
    overlay.addEventListener('click', () => (overlay.style.display = 'none'));
  }

});
