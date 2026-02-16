/**
 * main.js — Prof. Dr. Rudolf Steinberg Website
 *
 * Modules:
 *  1. Navigation  – Mobile toggle, active link detection
 *  2. Search      – MiniSearch integration with keyboard nav
 *  3. ScrollReveal – IntersectionObserver-based animations
 *  4. ContactForm  – Client-side validation, server-side submission
 */

// Mark JS as available for CSS progressive enhancement
document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
  Navigation.init();
  Search.init();
  ScrollReveal.init();
  ContactForm.init();
  PubNav.init();
});


/* ================================================================
   1. NAVIGATION
   ================================================================ */

const Navigation = {
  init() {
    this.toggle = document.querySelector('.nav__toggle');
    this.overlay = document.querySelector('.nav__overlay');
    if (!this.toggle || !this.overlay) return;

    this.toggle.addEventListener('click', () => this.toggleMenu());

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.toggleMenu();
    });

    // Close when clicking overlay background
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay && this.isOpen) this.toggleMenu();
    });

    // Close when clicking overlay links
    this.overlay.querySelectorAll('.nav__overlay-link').forEach(link => {
      link.addEventListener('click', () => {
        if (this.isOpen) this.toggleMenu();
      });
    });
  },

  isOpen: false,

  toggleMenu() {
    this.isOpen = !this.isOpen;
    this.overlay.classList.toggle('is-open', this.isOpen);
    this.overlay.setAttribute('aria-hidden', String(!this.isOpen));
    this.toggle.classList.toggle('is-open', this.isOpen);
    this.toggle.setAttribute('aria-expanded', String(this.isOpen));
    this.toggle.setAttribute('aria-label',
      this.isOpen ? 'Navigation schließen' : 'Navigation öffnen');
    document.body.style.overflow = this.isOpen ? 'hidden' : '';
  }
};


/* ================================================================
   2. SEARCH
   ================================================================ */

const Search = {
  miniSearch: null,

  async init() {
    const toggle = document.getElementById('search-toggle');
    const panel = document.getElementById('search-panel');
    const input = document.getElementById('search-input');
    const close = document.getElementById('search-close');
    const results = document.getElementById('search-results');
    const backdrop = document.getElementById('search-backdrop');

    if (!toggle || !panel || !input || !results) return;

    // Open/close search panel
    toggle.addEventListener('click', () => this.openPanel());
    if (close) close.addEventListener('click', () => this.handleClose());
    if (backdrop) backdrop.addEventListener('click', () => this.closePanel());

    // Keyboard shortcut: Ctrl+K or Cmd+K
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.openPanel();
      }
      if (e.key === 'Escape' && panel.classList.contains('is-open')) {
        this.handleClose();
      }
    });

    // Store references
    this.panel = panel;
    this.input = input;
    this.results = results;
    this.backdrop = backdrop;

    // Load search index
    if (typeof MiniSearch === 'undefined') return;

    try {
      const documents = window.__searchIndex || [];

      this.miniSearch = new MiniSearch({
        fields: ['title', 'content'],
        storeFields: ['title', 'page', 'url', 'snippet'],
        searchOptions: {
          boost: { title: 2 },
          fuzzy: 0.2,
          prefix: true
        }
      });

      this.miniSearch.addAll(documents);
    } catch (e) {
      console.warn('Suchindex konnte nicht geladen werden:', e);
      return;
    }

    // Debounced input handler
    let timeout;
    input.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => this.handleSearch(input.value), 200);
    });

    // Keyboard navigation in results
    input.addEventListener('keydown', (e) => this.handleKeyboard(e));
  },

  openPanel() {
    if (!this.panel) return;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = scrollbarWidth + 'px';
    this.panel.classList.add('is-open');
    if (this.backdrop) this.backdrop.classList.add('is-open');
    this.input.focus();
  },

  handleClose() {
    if (this.input.value) {
      this.input.value = '';
      this.handleSearch('');
      this.input.focus();
    } else {
      this.closePanel();
    }
  },

  closePanel() {
    if (!this.panel) return;
    this.panel.classList.remove('is-open');
    this.results.classList.remove('is-visible');
    if (this.backdrop) this.backdrop.classList.remove('is-open');
    this.input.value = '';
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  },

  handleSearch(query) {
    if (!this.miniSearch || query.length < 2) {
      this.results.classList.remove('is-visible');
      return;
    }

    const hits = this.miniSearch.search(query).slice(0, 8);

    // Clear previous results using safe DOM methods
    this.results.textContent = '';

    if (hits.length === 0) {
      const noResults = document.createElement('div');
      noResults.className = 'search__no-results';
      noResults.textContent = 'Keine Ergebnisse gefunden';
      this.results.appendChild(noResults);
    } else {
      hits.forEach((r, i) => {
        const link = document.createElement('a');
        link.href = r.url;
        link.className = 'search__result-item';
        link.setAttribute('role', 'option');
        link.dataset.index = i;
        link.addEventListener('click', () => this.closePanel());

        const page = document.createElement('div');
        page.className = 'search__result-page';
        page.textContent = r.page;

        const title = document.createElement('div');
        title.className = 'search__result-title';
        title.textContent = r.title;

        const snippet = document.createElement('div');
        snippet.className = 'search__result-snippet';
        snippet.textContent = r.snippet;

        link.appendChild(page);
        link.appendChild(title);
        link.appendChild(snippet);
        this.results.appendChild(link);
      });
    }

    this.results.classList.add('is-visible');
  },

  handleKeyboard(e) {
    const items = this.results.querySelectorAll('.search__result-item');
    if (!items.length) return;

    const focused = this.results.querySelector('.search__result-item--focused');
    let index = focused ? parseInt(focused.dataset.index, 10) : -1;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      index = Math.min(index + 1, items.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      index = Math.max(index - 1, 0);
    } else if (e.key === 'Enter' && focused) {
      e.preventDefault();
      this.closePanel();
      window.location.href = focused.href;
      return;
    } else {
      return;
    }

    items.forEach(item => item.classList.remove('search__result-item--focused'));
    if (items[index]) {
      items[index].classList.add('search__result-item--focused');
      items[index].scrollIntoView({ block: 'nearest' });
    }
  }
};


/* ================================================================
   3. SCROLL REVEAL
   ================================================================ */

const ScrollReveal = {
  init() {
    const elements = document.querySelectorAll('.reveal');
    if (!elements.length) return;

    // If no IntersectionObserver support, show everything
    if (!('IntersectionObserver' in window)) {
      elements.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    elements.forEach(el => observer.observe(el));
  }
};


/* ================================================================
   4. PUBLICATION NAV — Section tracking
   ================================================================ */

const PubNav = {
  init() {
    const links = document.querySelectorAll('.pub-nav__link');
    if (!links.length) return;

    const sections = [];
    links.forEach(link => {
      const id = link.getAttribute('href').slice(1);
      const el = document.getElementById(id);
      if (el) sections.push(el);
    });
    if (!sections.length) return;

    // Smooth scroll on click
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const id = link.getAttribute('href').slice(1);
        const target = document.getElementById(id);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      });
    });

    // Scroll-spy: pick the last section whose top is above threshold
    const offset = 120;
    const update = () => {
      let current = sections[0];
      for (const s of sections) {
        if (s.getBoundingClientRect().top <= offset) current = s;
      }
      links.forEach(l => l.classList.remove('pub-nav__link--active'));
      const active = document.querySelector(
        '.pub-nav__link[href="#' + current.id + '"]'
      );
      if (active) active.classList.add('pub-nav__link--active');
    };

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => { update(); ticking = false; });
        ticking = true;
      }
    }, { passive: true });

    update();
  }
};


/* ================================================================
   5. CONTACT FORM
   ================================================================ */

const ContactForm = {
  _loadTime: Date.now() / 1000,

  init() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    this.form = form;
    this.btn = form.querySelector('button[type="submit"]');
    this.fields = [
      { el: form.querySelector('#name'),    msg: 'Bitte füllen Sie dieses Feld aus.' },
      { el: form.querySelector('#email'),   msg: 'Bitte füllen Sie dieses Feld aus.', emailMsg: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' },
      { el: form.querySelector('#subject'), msg: 'Bitte füllen Sie dieses Feld aus.' },
      { el: form.querySelector('#message'), msg: 'Bitte füllen Sie dieses Feld aus.' }
    ];

    // Live-clearing: remove error on input
    this.fields.forEach(f => {
      if (!f.el) return;
      f.el.addEventListener('input', () => this.clearFieldError(f.el));
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      this.clearErrors();

      // Validate
      const errors = this.validate();
      if (errors.length) {
        errors[0].el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => errors[0].el.focus(), 400);
        return;
      }

      const honeypot = form.querySelector('#_website')?.value || '';

      // Disable button during submission
      this.btn.disabled = true;
      const origText = this.btn.textContent;
      this.btn.textContent = 'Wird gesendet\u2026';

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: this.fields[0].el.value.trim(),
            email: this.fields[1].el.value.trim(),
            subject: this.fields[2].el.value.trim(),
            message: this.fields[3].el.value.trim(),
            _website: honeypot,
            _t: this._loadTime
          })
        });

        const data = await res.json();

        if (data.ok) {
          this.showSuccess();
        } else {
          const err = data.error || 'Ein Fehler ist aufgetreten.';
          if (data.field) {
            const target = this.form.querySelector('#' + data.field);
            if (target) {
              this.showFieldError(target, err);
              target.scrollIntoView({ behavior: 'smooth', block: 'center' });
              setTimeout(() => target.focus(), 400);
              return;
            }
          }
          // Fallback: map known error patterns to fields
          if (/e-?mail|domain/i.test(err)) {
            const emailEl = this.fields[1].el;
            this.showFieldError(emailEl, err);
            emailEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => emailEl.focus(), 400);
          } else {
            this.showServerError(err);
          }
        }
      } catch {
        this.showServerError('Verbindungsfehler. Bitte versuchen Sie es später erneut.');
      } finally {
        this.btn.disabled = false;
        this.btn.textContent = origText;
      }
    });
  },

  validate() {
    const errors = [];
    this.fields.forEach(f => {
      if (!f.el) return;
      const val = f.el.value.trim();
      if (!val) {
        this.showFieldError(f.el, f.msg);
        errors.push(f);
      } else if (f.emailMsg && !this.isValidEmail(val)) {
        this.showFieldError(f.el, f.emailMsg);
        errors.push(f);
      }
    });
    return errors;
  },

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  showFieldError(el, text) {
    const errClass = el.tagName === 'TEXTAREA' ? 'form-textarea--error' : 'form-input--error';
    el.classList.add(errClass);
    const msg = document.createElement('div');
    msg.className = 'form-error';
    msg.setAttribute('role', 'alert');
    msg.textContent = text;
    el.parentElement.appendChild(msg);
  },

  clearFieldError(el) {
    el.classList.remove('form-input--error', 'form-textarea--error');
    const err = el.parentElement.querySelector('.form-error');
    if (err) err.remove();
  },

  clearErrors() {
    this.form.querySelectorAll('.form-error').forEach(e => e.remove());
    this.form.querySelectorAll('.form-input--error, .form-textarea--error').forEach(e => {
      e.classList.remove('form-input--error', 'form-textarea--error');
    });
    const banner = this.form.querySelector('.form-message');
    if (banner) banner.remove();
  },

  showSuccess() {
    const container = this.form.parentElement;
    const wrapper = document.createElement('div');
    wrapper.className = 'form-success';
    wrapper.setAttribute('role', 'status');

    const icon = document.createElement('div');
    icon.className = 'form-success__icon';
    icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';

    const title = document.createElement('div');
    title.className = 'form-success__title';
    title.textContent = 'Nachricht gesendet';

    const text = document.createElement('p');
    text.className = 'form-success__text';
    text.textContent = 'Vielen Dank f\u00fcr Ihre Nachricht. Wir melden uns zeitnah bei Ihnen.';

    wrapper.appendChild(icon);
    wrapper.appendChild(title);
    wrapper.appendChild(text);

    this.form.remove();
    container.appendChild(wrapper);
  },

  showServerError(text) {
    const existing = this.form.querySelector('.form-message');
    if (existing) existing.remove();

    const msg = document.createElement('div');
    msg.className = 'form-message form-message--error';
    msg.setAttribute('role', 'alert');
    msg.textContent = text;
    this.btn.insertAdjacentElement('beforebegin', msg);

    setTimeout(() => msg.remove(), 10000);
  }
};
