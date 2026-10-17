(() => {
  const copy = JSON.parse(document.getElementById('loop-copy').textContent);
  const buttons = Array.from(document.querySelectorAll('[data-mode]'));
  for (const button of buttons) {
    button.addEventListener('click', () => {
      const mode = Number(button.dataset.mode);
      for (const other of buttons) other.setAttribute('aria-pressed', String(other === button));
      document.querySelectorAll('[data-loop]').forEach((element, index) => {
        element.textContent = copy[mode][index];
      });
    });
  }
})();

(() => {
  for (const carousel of document.querySelectorAll('[data-carousel]')) {
    const track = carousel.querySelector('[data-carousel-track]');
    const previous = carousel.querySelector('[data-carousel-prev]');
    const next = carousel.querySelector('[data-carousel-next]');
    const status = carousel.querySelector('[data-carousel-status]');
    if (!track || !previous || !next || !status) continue;
    const slides = Array.from(track.children).filter((child) => child.tagName === 'FIGURE');
    if (!slides.length) continue;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let destination = null;
    let settleTimer;

    const maximum = () => Math.max(0, track.scrollWidth - track.clientWidth);
    const position = () => Math.max(0, Math.min(track.scrollLeft, maximum()));
    const slideBounds = () => {
      const left = track.getBoundingClientRect().left + track.clientLeft;
      return slides.map((slide) => {
        const bounds = slide.getBoundingClientRect();
        return { left: bounds.left - left + track.scrollLeft, width: bounds.width };
      });
    };
    const stops = () => {
      const bounds = slideBounds();
      // Preserve the track's leading inset and its matching scroll padding.
      return [...new Set(bounds.map((slide) =>
        Math.max(0, Math.min(slide.left - bounds[0].left, maximum()))))];
    };

    function updateButtons() {
      const left = destination ?? position();
      previous.disabled = left <= 1;
      next.disabled = left >= maximum() - 1;
    }

    function announce() {
      const left = position();
      const right = left + track.clientWidth;
      const visible = slideBounds().flatMap((slide, index) => {
        const overlap = Math.max(0, Math.min(right, slide.left + slide.width) - Math.max(left, slide.left));
        // Ignore the small preview of the next screenshot on narrow screens.
        return overlap >= Math.min(slide.width, track.clientWidth) / 2 ? [index + 1] : [];
      });
      if (!visible.length) return;
      const label = status.dataset.label
        .replace('{start}', String(visible[0]))
        .replace('{end}', String(visible[visible.length - 1]))
        .replace('{total}', String(slides.length));
      if (status.textContent !== label) status.textContent = label;
    }

    function settle() {
      window.clearTimeout(settleTimer);
      destination = null;
      updateButtons();
      announce();
    }

    function navigate(direction) {
      const points = stops();
      const left = destination ?? position();
      let target;
      if (direction === 'start') target = 0;
      else if (direction === 'end') target = maximum();
      else if (direction > 0) target = points.find((point) => point > left + 1) ?? maximum();
      else target = points.findLast((point) => point < left - 1) ?? 0;
      destination = target;
      updateButtons();
      track.scrollTo({ left: target, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
      // A debounce also supports browsers that do not emit scrollend.
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(settle, 180);
    }

    previous.addEventListener('click', () => navigate(-1));
    next.addEventListener('click', () => navigate(1));
    track.addEventListener('keydown', (event) => {
      if (event.target !== track || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const directions = { ArrowLeft: -1, ArrowRight: 1, Home: 'start', End: 'end' };
      if (!Object.hasOwn(directions, event.key)) return;
      event.preventDefault();
      navigate(directions[event.key]);
    });
    track.addEventListener('scroll', () => {
      updateButtons();
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(settle, 180);
    }, { passive: true });
    track.addEventListener('scrollend', settle);
    const releaseDestination = () => { destination = null; };
    track.addEventListener('pointerdown', releaseDestination, { passive: true });
    track.addEventListener('wheel', releaseDestination, { passive: true });
    window.addEventListener('resize', settle);
    if ('ResizeObserver' in window) new window.ResizeObserver(settle).observe(track);
    settle();
    previous.hidden = false;
    next.hidden = false;
  }
})();
