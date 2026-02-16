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

    const btn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = form.querySelector('#name').value.trim();
      const email = form.querySelector('#email').value.trim();
      const subject = form.querySelector('#subject').value.trim();
      const message = form.querySelector('#message').value.trim();
      const honeypot = form.querySelector('#_website')?.value || '';

      if (!name || !email || !subject || !message) {
        this.showMessage(form, 'error',
          'Bitte füllen Sie alle Felder aus.');
        return;
      }

      if (!this.isValidEmail(email)) {
        this.showMessage(form, 'error',
          'Bitte geben Sie eine gültige E-Mail-Adresse ein.');
        return;
      }

      // Disable button during submission
      btn.disabled = true;
      const origText = btn.textContent;
      btn.textContent = 'Wird gesendet\u2026';

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name, email, subject, message,
            _website: honeypot,
            _t: this._loadTime
          })
        });

        const data = await res.json();

        if (data.ok) {
          form.reset();
          this._loadTime = Date.now() / 1000;
          this.showMessage(form, 'success',
            'Ihre Nachricht wurde erfolgreich gesendet.');
        } else {
          this.showMessage(form, 'error',
            data.error || 'Ein Fehler ist aufgetreten.');
        }
      } catch {
        this.showMessage(form, 'error',
          'Verbindungsfehler. Bitte versuchen Sie es später erneut.');
      } finally {
        btn.disabled = false;
        btn.textContent = origText;
      }
    });
  },

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  showMessage(form, type, text) {
    const existing = form.parentElement.querySelector('.form-message');
    if (existing) existing.remove();

    const msg = document.createElement('div');
    msg.className = 'form-message form-message--' + type;
    msg.setAttribute('role', 'alert');
    msg.textContent = text;
    form.parentElement.insertBefore(msg, form.nextSibling);

    setTimeout(() => msg.remove(), 10000);
  }
};
