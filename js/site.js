/**
 * site.js — Scholars.cat static site enhancements
 * Replaces Squarespace JS for Cloudflare Pages deployment.
 * No external dependencies. ES6+.
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  initSpacerBlocks();
  initGalleryReels();
  initGalleryGrids();
  initGalleryMasonries();
  initLazyLoadAndLoaded();
  initScrollAnimations();
  initLightboxes();
  initMobileMenu();
});

/* ============================================================
   0. SPACER BLOCKS
   site.css sets .sqs-layout .spacer-block { display:none } because
   Squarespace JS positions all blocks absolutely and gives spacers
   an explicit pixel height. Without JS we restore them and derive
   their height from data-aspect-ratio × block width.
   Then alignIconsToText() overrides spacers in icon columns so each
   image lines up with the corresponding h4 in the adjacent text column.
   ============================================================ */
function initSpacerBlocks() {
  const spacers = document.querySelectorAll('.sqs-layout .sqs-block-spacer.spacer-block');

  function applyHeights() {
    spacers.forEach(block => {
      const ratio = parseFloat(block.getAttribute('data-aspect-ratio'));
      if (!ratio) return;
      block.style.display = 'block';
      const w = block.offsetWidth;
      if (w > 0) block.style.height = Math.round(w * ratio / 100) + 'px';
    });
    alignIconsToText();
  }

  applyHeights();
  window.addEventListener('resize', applyHeights, { passive: true });
}

/* For each sqs-row where one column has only image+spacer blocks and
   an adjacent column has multiple h4 headings, re-space the images so
   each one aligns with the corresponding heading. */
function alignIconsToText() {
  document.querySelectorAll('.sqs-row').forEach(row => {
    // Collect direct child .col elements
    const cols = Array.from(row.children).filter(el => el.classList.contains('col'));
    if (cols.length < 2) return;

    let iconCol = null, textCol = null;

    for (const col of cols) {
      const allBlocks  = col.querySelectorAll('.sqs-block');
      const imgBlocks  = col.querySelectorAll('.sqs-block-image');
      const spcBlocks  = col.querySelectorAll('.sqs-block-spacer');
      // Icon col: only images + spacers, at least 2 images
      if (imgBlocks.length >= 2 && imgBlocks.length + spcBlocks.length === allBlocks.length) {
        iconCol = col;
      }
      // Text col: contains multiple h4 headings
      if (col.querySelectorAll('h4').length >= 2) {
        textCol = col;
      }
    }

    if (!iconCol || !textCol) return;

    const images   = Array.from(iconCol.querySelectorAll('.sqs-block-image'));
    const headings = Array.from(textCol.querySelectorAll('h4'));
    if (images.length !== headings.length) return;

    const colTop = iconCol.getBoundingClientRect().top;

    images.forEach((imgBlock, i) => {
      const spacer = imgBlock.previousElementSibling;
      if (!spacer || !spacer.classList.contains('sqs-block-spacer')) return;

      // Target: top of this image should align with top of the i-th h4
      const targetTop = headings[i].getBoundingClientRect().top - colTop;

      // Accumulated height of everything before this spacer
      let accum = 0;
      let sib = iconCol.firstElementChild;
      while (sib && sib !== spacer) {
        accum += sib.offsetHeight;
        sib = sib.nextElementSibling;
      }

      spacer.style.height = Math.max(0, targetTop - accum) + 'px';
    });
  });
}

/* ============================================================
   1. GALLERY REEL — horizontal slider with prev/next arrows
   ============================================================ */
function initGalleryReels() {
  document.querySelectorAll('.gallery-reel').forEach(reel => {
    try {
      const list  = reel.querySelector('.gallery-reel-list');
      const items = Array.from(reel.querySelectorAll('.gallery-reel-item'));
      if (!list || items.length === 0) return;

      let current = 0;

      // --- Show/hide helpers ---
      function showSlide(idx, dir) {
        const prev = items[current];
        const next = items[idx];

        prev.classList.remove('is-active');
        prev.style.opacity = '0';
        prev.style.zIndex  = '1';

        next.classList.add('is-active');
        next.style.opacity = '1';
        next.style.zIndex  = '2';

        current = idx;

        // Show caption
        const cap = reel.querySelector('.gallery-caption-reel-active');
        if (cap) cap.classList.remove('gallery-caption-reel-active');
        const newCap = next.querySelector('.gallery-caption');
        if (newCap) newCap.classList.add('gallery-caption-reel-active');

        updateCounter();
      }

      function updateCounter() {
        const counter = reel.querySelector('.reel-counter');
        if (counter) counter.textContent = `${current + 1} / ${items.length}`;
      }

      // --- Initialise items ---
      items.forEach((item, i) => {
        item.style.position   = 'absolute';
        item.style.inset      = '0';
        item.style.width      = '100%';
        item.style.height     = '100%';
        item.style.opacity    = '0';
        item.style.transition = 'opacity 0.5s ease';
        item.style.zIndex     = '1';
      });
      // Show first
      items[0].style.opacity = '1';
      items[0].style.zIndex  = '2';
      items[0].classList.add('is-active');
      const firstCap = items[0].querySelector('.gallery-caption');
      if (firstCap) firstCap.classList.add('gallery-caption-reel-active');

      // Make the list a positioning context
      list.style.position = 'relative';
      list.style.overflow = 'hidden';
      list.style.height   = '100%';
      list.style.display  = 'block';

      // --- Controls ---
      let btnPrev = reel.querySelector('[data-previous]');
      let btnNext = reel.querySelector('[data-next]');

      // If controls don't exist in HTML, create them
      if (!btnPrev || !btnNext) {
        const controls = document.createElement('div');
        controls.className = 'gallery-reel-controls gallery-reel-controls--created';
        controls.innerHTML = `
          <div class="gallery-reel-control">
            <button class="gallery-reel-control-btn" data-previous aria-label="Diapositiva anterior">
              <div class="gallery-reel-control-btn-icon">
                <svg viewBox="0 0 60 30"><path class="st0" d="M15.9,23.7L7.1,15l8.7-8.7" fill="none"/><path class="st1" d="M52.9,15H8.5" fill="none"/></svg>
              </div>
            </button>
          </div>
          <div class="gallery-reel-control">
            <button class="gallery-reel-control-btn" data-next aria-label="Siguiente diapositiva">
              <div class="gallery-reel-control-btn-icon">
                <svg viewBox="0 0 60 30"><path d="M44.1,6.3l8.7,8.7l-8.7,8.7" fill="none"/><path d="M7.1,15h44.4" fill="none"/></svg>
              </div>
            </button>
          </div>`;
        reel.appendChild(controls);
        btnPrev = controls.querySelector('[data-previous]');
        btnNext = controls.querySelector('[data-next]');
      }

      // Add counter span next to controls if not present
      const controlsEl = reel.querySelector('.gallery-reel-controls');
      if (controlsEl && !controlsEl.querySelector('.reel-counter')) {
        const counter = document.createElement('span');
        counter.className = 'reel-counter';
        counter.setAttribute('aria-live', 'polite');
        controlsEl.appendChild(counter);
        updateCounter();
      }

      btnPrev.addEventListener('click', () => {
        const idx = (current - 1 + items.length) % items.length;
        showSlide(idx, 'prev');
      });
      btnNext.addEventListener('click', () => {
        const idx = (current + 1) % items.length;
        showSlide(idx, 'next');
      });

      // Keyboard navigation when focused
      reel.setAttribute('tabindex', '0');
      reel.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft')  { e.preventDefault(); btnPrev.click(); }
        if (e.key === 'ArrowRight') { e.preventDefault(); btnNext.click(); }
      });

      // Touch/swipe support
      let touchStartX = 0;
      reel.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
      reel.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 40) {
          if (dx < 0) btnNext.click();
          else        btnPrev.click();
        }
      }, { passive: true });

    } catch (err) {
      console.warn('Gallery Reel init error:', err);
    }
  });
}

/* ============================================================
   2. GALLERY GRID — CSS already handles layout via overrides.css
      JS only adds cursor pointer and delegates to lightbox.
   ============================================================ */
function initGalleryGrids() {
  document.querySelectorAll('.gallery-grid').forEach(grid => {
    try {
      const lightboxEnabled = isLightboxEnabled(grid);
      if (!lightboxEnabled) return;

      grid.querySelectorAll('.gallery-grid-item').forEach((item, idx) => {
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => {
          openLightboxForGallery(grid, idx);
        });
      });
    } catch (err) {
      console.warn('Gallery Grid init error:', err);
    }
  });
}

/* ============================================================
   3. GALLERY MASONRY — CSS column-count already in overrides.css
      JS adds click-to-lightbox if enabled.
   ============================================================ */
function initGalleryMasonries() {
  document.querySelectorAll('.gallery-masonry').forEach(masonry => {
    try {
      const lightboxEnabled = isLightboxEnabled(masonry);
      if (!lightboxEnabled) return;

      masonry.querySelectorAll('.gallery-masonry-item').forEach((item, idx) => {
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => {
          openLightboxForGallery(masonry, idx);
        });
      });
    } catch (err) {
      console.warn('Gallery Masonry init error:', err);
    }
  });
}

/* ============================================================
   4. IMAGE LAZY LOADING + .loaded class
   ============================================================ */
function initLazyLoadAndLoaded() {
  // Images that already have src (not data-src only) and need .loaded
  // Squarespace mirrors: imgs have both src and data-src set
  const imgs = document.querySelectorAll('img[data-loader="sqs"]');

  if (!('IntersectionObserver' in window)) {
    // Fallback: mark all loaded immediately
    imgs.forEach(img => markLoaded(img));
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const img = entry.target;
      obs.unobserve(img);
      if (img.complete && img.naturalWidth > 0) {
        markLoaded(img);
      } else {
        img.addEventListener('load',  () => markLoaded(img), { once: true });
        img.addEventListener('error', () => markLoaded(img), { once: true }); // still remove opacity on error
      }
    });
  }, { rootMargin: '200px 0px' });

  imgs.forEach(img => observer.observe(img));

  // Also handle imgs that might already be loaded at script run time
  imgs.forEach(img => {
    if (img.complete && img.naturalWidth > 0) {
      markLoaded(img);
    }
  });
}

function markLoaded(img) {
  img.classList.add('loaded');
}

/* ============================================================
   5. SCROLL ANIMATIONS
   ============================================================ */
function initScrollAnimations() {
  // Skip animations if user prefers reduced motion
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const targets = document.querySelectorAll('[data-animation-role="content"]');

  if (targets.length === 0) return;

  if (prefersReduced || !('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('is-visible'));
    return;
  }

  // Inject CSS for scroll animations (only once)
  if (!document.getElementById('site-scroll-anim-css')) {
    const style = document.createElement('style');
    style.id = 'site-scroll-anim-css';
    style.textContent = `
      [data-animation-role="content"] {
        opacity: 0;
        transform: scale(0.96) translateY(12px);
        transition: opacity 0.55s ease, transform 0.55s ease;
        will-change: opacity, transform;
      }
      [data-animation-role="content"].is-visible {
        opacity: 1;
        transform: none;
      }
      /* Never animate header elements — they appear immediately */
      .header [data-animation-role],
      [data-animation-role="header-element"] {
        opacity: 1 !important;
        transform: none !important;
        transition: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.08 });

  targets.forEach(el => {
    // Don't animate elements inside the header
    if (el.closest('header, .header')) {
      el.classList.add('is-visible');
      return;
    }
    observer.observe(el);
  });
}

/* ============================================================
   6. LIGHTBOX
   ============================================================ */

// Helper: read lightboxEnabled from data-props
function isLightboxEnabled(galleryEl) {
  const attr = galleryEl.getAttribute('data-lightbox');
  if (attr === 'false') return false;
  try {
    const props = JSON.parse(galleryEl.getAttribute('data-props') || '{}');
    if (props.lightboxEnabled === false) return false;
  } catch (_) {}
  // data-lightbox="" means enabled in Squarespace
  return attr !== null && attr !== 'false';
}

// Build a simple lightbox overlay (created once, reused)
let _lightboxOverlay = null;

function getLightboxOverlay() {
  if (_lightboxOverlay) return _lightboxOverlay;

  const overlay = document.createElement('div');
  overlay.id = 'site-lightbox';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Galeria ampliada');
  overlay.innerHTML = `
    <div class="site-lightbox-bg"></div>
    <button class="site-lightbox-close" aria-label="Tancar">&times;</button>
    <div class="site-lightbox-content">
      <img class="site-lightbox-img" src="" alt="">
    </div>
    <button class="site-lightbox-prev" aria-label="Anterior">&#8249;</button>
    <button class="site-lightbox-next" aria-label="Seguent">&#8250;</button>
    <div class="site-lightbox-counter" aria-live="polite"></div>
  `;

  // Inject CSS once
  if (!document.getElementById('site-lightbox-css')) {
    const style = document.createElement('style');
    style.id = 'site-lightbox-css';
    style.textContent = `
      #site-lightbox {
        display: none;
        position: fixed;
        inset: 0;
        z-index: 9000;
        align-items: center;
        justify-content: center;
      }
      #site-lightbox.is-open { display: flex; }
      .site-lightbox-bg {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,0.92);
      }
      .site-lightbox-content {
        position: relative;
        z-index: 1;
        max-width: 90vw;
        max-height: 90vh;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .site-lightbox-img {
        max-width: 90vw;
        max-height: 90vh;
        object-fit: contain;
        display: block;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      .site-lightbox-img.loaded { opacity: 1; }
      .site-lightbox-close {
        position: absolute;
        top: 16px; right: 20px;
        z-index: 2;
        background: none;
        border: none;
        color: #fff;
        font-size: 2.5rem;
        cursor: pointer;
        line-height: 1;
        padding: 4px 10px;
        opacity: 0.8;
      }
      .site-lightbox-close:hover { opacity: 1; }
      .site-lightbox-prev,
      .site-lightbox-next {
        position: absolute;
        top: 50%; transform: translateY(-50%);
        z-index: 2;
        background: rgba(255,255,255,0.12);
        border: none;
        color: #fff;
        font-size: 3rem;
        cursor: pointer;
        padding: 12px 18px;
        line-height: 1;
        border-radius: 4px;
        transition: background 0.2s;
      }
      .site-lightbox-prev:hover,
      .site-lightbox-next:hover { background: rgba(255,255,255,0.28); }
      .site-lightbox-prev { left: 12px; }
      .site-lightbox-next { right: 12px; }
      .site-lightbox-counter {
        position: absolute;
        bottom: 16px; left: 50%;
        transform: translateX(-50%);
        color: rgba(255,255,255,0.7);
        font-size: 0.85rem;
        z-index: 2;
        letter-spacing: 0.05em;
      }
      @media (max-width: 480px) {
        .site-lightbox-prev { left: 4px; padding: 8px 12px; }
        .site-lightbox-next { right: 4px; padding: 8px 12px; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(overlay);
  _lightboxOverlay = overlay;

  // Close on background click
  overlay.querySelector('.site-lightbox-bg').addEventListener('click', closeLightbox);
  overlay.querySelector('.site-lightbox-close').addEventListener('click', closeLightbox);

  // Keyboard
  document.addEventListener('keydown', e => {
    if (!overlay.classList.contains('is-open')) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  lightboxStep(-1);
    if (e.key === 'ArrowRight') lightboxStep(1);
  });

  // Touch/swipe
  let _lbTouchX = 0;
  overlay.addEventListener('touchstart', e => { _lbTouchX = e.changedTouches[0].clientX; }, { passive: true });
  overlay.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - _lbTouchX;
    if (Math.abs(dx) > 40) lightboxStep(dx < 0 ? 1 : -1);
  }, { passive: true });

  overlay.querySelector('.site-lightbox-prev').addEventListener('click', () => lightboxStep(-1));
  overlay.querySelector('.site-lightbox-next').addEventListener('click', () => lightboxStep(1));

  return overlay;
}

let _lbImages = [];
let _lbIndex  = 0;

function openLightboxForGallery(galleryEl, startIdx) {
  // Collect all images in this gallery
  const imgs = Array.from(galleryEl.querySelectorAll(
    '.gallery-grid-item img, .gallery-masonry-item img'
  ));
  if (imgs.length === 0) return;

  _lbImages = imgs.map(img => ({
    src: img.getAttribute('src') || img.getAttribute('data-src') || '',
    alt: img.getAttribute('alt') || ''
  }));
  _lbIndex = startIdx;
  showLightboxSlide(_lbIndex);
}

function showLightboxSlide(idx) {
  const overlay = getLightboxOverlay();
  const imgEl   = overlay.querySelector('.site-lightbox-img');
  const counter = overlay.querySelector('.site-lightbox-counter');

  imgEl.classList.remove('loaded');
  imgEl.src = _lbImages[idx].src;
  imgEl.alt = _lbImages[idx].alt;

  imgEl.onload  = () => imgEl.classList.add('loaded');
  imgEl.onerror = () => imgEl.classList.add('loaded'); // show even on error

  counter.textContent = `${idx + 1} / ${_lbImages.length}`;

  overlay.classList.add('is-open');
  overlay.querySelector('.site-lightbox-close').focus();

  // Hide prev/next if only one image
  overlay.querySelector('.site-lightbox-prev').style.display = _lbImages.length > 1 ? '' : 'none';
  overlay.querySelector('.site-lightbox-next').style.display = _lbImages.length > 1 ? '' : 'none';

  document.body.style.overflow = 'hidden';
}

function lightboxStep(dir) {
  if (_lbImages.length === 0) return;
  _lbIndex = (_lbIndex + dir + _lbImages.length) % _lbImages.length;
  showLightboxSlide(_lbIndex);
}

function closeLightbox() {
  if (_lightboxOverlay) _lightboxOverlay.classList.remove('is-open');
  document.body.style.overflow = '';
}

function initLightboxes() {
  // Gallery Grid lightboxes
  document.querySelectorAll('.gallery-grid').forEach(grid => {
    try {
      if (!isLightboxEnabled(grid)) return;
      grid.querySelectorAll('.gallery-grid-item').forEach((item, idx) => {
        item.style.cursor = 'pointer';
        // Remove duplicate listener from initGalleryGrids if any
        const clone = item.cloneNode(true);
        item.parentNode.replaceChild(clone, item);
        clone.addEventListener('click', () => openLightboxForGallery(grid, idx));
      });
    } catch (err) {
      console.warn('Lightbox Grid init error:', err);
    }
  });

  // Gallery Masonry lightboxes
  document.querySelectorAll('.gallery-masonry').forEach(masonry => {
    try {
      if (!isLightboxEnabled(masonry)) return;
      masonry.querySelectorAll('.gallery-masonry-item').forEach((item, idx) => {
        item.style.cursor = 'pointer';
        const clone = item.cloneNode(true);
        item.parentNode.replaceChild(clone, item);
        clone.addEventListener('click', () => openLightboxForGallery(masonry, idx));
      });
    } catch (err) {
      console.warn('Lightbox Masonry init error:', err);
    }
  });
}

/* ============================================================
   7. MOBILE MENU (hamburger toggle)
   ============================================================ */
function initMobileMenu() {
  // Squarespace uses data-controller="Header" with its own JS.
  // Provide a minimal fallback toggle for the hamburger button.
  const hamburgers = document.querySelectorAll(
    '[data-test="hamburger"], .header-burger-btn, [aria-label="Menu"]'
  );
  const navWrappers = document.querySelectorAll(
    '.header-nav, .header-menu, [data-test="header-nav-folder-content"]'
  );

  hamburgers.forEach(btn => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      navWrappers.forEach(nav => nav.classList.toggle('is-open'));
    });
  });
}
