/* global __dirname */
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const source = readFileSync(path.resolve(__dirname, '../site/assets/site.js'), 'utf8');

class Element {
  constructor() {
    this.listeners = new Map();
    this.hidden = true;
    this.disabled = false;
    this.textContent = '';
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  dispatch(type, properties = {}) {
    const event = { target: this, prevented: false,
      preventDefault() { this.prevented = true; }, ...properties };
    for (const listener of this.listeners.get(type) || []) listener(event);
    return event;
  }

  click() {
    if (!this.disabled && !this.hidden) this.dispatch('click');
  }
}

// The fixture supplies browser geometry and events, but deliberately does not
// calculate navigation targets or mutate scrollLeft during smooth scrolling.
function fixture({ width = 340, reduced = false, language = 'en', observer = true } = {}) {
  const previous = new Element();
  const next = new Element();
  const status = new Element();
  status.dataset = { label: language === 'es'
    ? 'Capturas {start} a {end} de {total}' : 'Screenshots {start} to {end} of {total}' };
  const track = new Element();
  const inset = 8;
  track.clientWidth = width + inset * 2;
  track.clientLeft = 2;
  track.scrollWidth = 700 + inset * 2;
  track.scrollLeft = 0;
  track.getBoundingClientRect = () => ({ left: 70 });
  track.children = Array.from({ length: 6 }, (_, index) => ({
    tagName: 'FIGURE',
    getBoundingClientRect: () => ({ left: 72 + inset + index * 120 - track.scrollLeft, width: 100 }),
  }));
  const requests = [];
  track.scrollTo = (request) => {
    requests.push(request);
    if (request.behavior !== 'smooth') {
      track.scrollLeft = request.left;
      track.dispatch('scroll');
    }
  };
  const elements = { '[data-carousel-track]': track, '[data-carousel-prev]': previous,
    '[data-carousel-next]': next, '[data-carousel-status]': status };
  const carousel = { querySelector: (selector) => elements[selector] };
  const timers = new Map();
  let timerId = 0;
  const motion = { matches: reduced };
  const window = new Element();
  window.matchMedia = () => motion;
  window.setTimeout = (callback) => { timers.set(++timerId, callback); return timerId; };
  window.clearTimeout = (id) => timers.delete(id);
  let resizeObserver;
  if (observer) window.ResizeObserver = class {
    constructor(callback) { resizeObserver = callback; }
    observe(element) { assert.equal(element, track); }
  };
  const document = {
    getElementById: () => ({ textContent: '[]' }),
    querySelectorAll: (selector) => selector === '[data-carousel]' ? [carousel] : [],
  };
  vm.runInNewContext(source, { document, window });
  return {
    previous, next, status, track, requests, motion,
    finish(left = requests.at(-1)?.left ?? track.scrollLeft, { scrollend = true } = {}) {
      track.scrollLeft = left;
      track.dispatch('scroll');
      if (scrollend) track.dispatch('scrollend');
    },
    flushTimers() {
      const callbacks = [...timers.values()];
      timers.clear();
      for (const callback of callbacks) callback();
    },
    resize(nextWidth, viaObserver = false) {
      track.clientWidth = nextWidth + inset * 2;
      track.scrollLeft = Math.min(track.scrollLeft, Math.max(0, track.scrollWidth - track.clientWidth));
      if (viaObserver) resizeObserver();
      else window.dispatch('resize');
    },
  };
}

test('enhancement reveals controls, describes the viewport, and never advances on its own', () => {
  const ui = fixture();
  assert.equal(ui.previous.hidden, false);
  assert.equal(ui.next.hidden, false);
  assert.equal(ui.previous.disabled, true);
  assert.equal(ui.next.disabled, false);
  assert.equal(ui.status.textContent, 'Screenshots 1 to 3 of 6');
  ui.flushTimers();
  assert.equal(ui.requests.length, 0);
  assert.equal(ui.track.children.length, 6);
});

test('rapid clicks advance deterministically before smooth scrolling catches up and clamp at each end', () => {
  const ui = fixture();
  ui.next.click();
  ui.next.click();
  ui.next.click();
  ui.next.click();
  assert.deepEqual(ui.requests.map((request) => request.left), [120, 240, 360]);
  assert.equal(ui.track.scrollLeft, 0, 'The browser has not yet moved');
  assert.equal(ui.next.disabled, true);
  ui.finish();
  assert.equal(ui.status.textContent, 'Screenshots 4 to 6 of 6');
  assert.equal(ui.previous.disabled, false);
  ui.previous.click();
  ui.previous.click();
  ui.previous.click();
  ui.previous.click();
  assert.deepEqual(ui.requests.slice(3).map((request) => request.left), [240, 120, 0]);
  ui.finish();
  assert.equal(ui.previous.disabled, true);
  assert.equal(ui.status.textContent, 'Screenshots 1 to 3 of 6');
});

test('reversing direction while an animation is pending starts from the queued destination', () => {
  const ui = fixture();
  ui.next.click();
  ui.next.click();
  ui.previous.click();
  assert.deepEqual(ui.requests.map((request) => request.left), [120, 240, 120]);
});

test('native swipe interrupts a queued move and synchronizes the next navigation after settling', () => {
  const ui = fixture();
  ui.next.click();
  ui.track.dispatch('pointerdown');
  ui.finish(245);
  assert.equal(ui.status.textContent, 'Screenshots 3 to 5 of 6');
  assert.equal(ui.previous.disabled, false);
  assert.equal(ui.next.disabled, false);
  ui.next.click();
  assert.equal(ui.requests.at(-1).left, 360);
  ui.finish();
  assert.equal(ui.next.disabled, true);
});

test('trackpad scrolling updates controls and announces only after the fallback settles', () => {
  const ui = fixture({ observer: false });
  ui.track.dispatch('wheel');
  ui.finish(360, { scrollend: false });
  assert.equal(ui.next.disabled, true);
  assert.equal(ui.status.textContent, 'Screenshots 1 to 3 of 6');
  ui.flushTimers();
  assert.equal(ui.status.textContent, 'Screenshots 4 to 6 of 6');
  ui.previous.click();
  assert.equal(ui.requests.at(-1).left, 240);
});

test('keyboard navigation works only on the focused track without modifiers', () => {
  const ui = fixture();
  for (const properties of [
    { target: {} }, { altKey: true }, { ctrlKey: true }, { metaKey: true }, { shiftKey: true },
  ]) assert.equal(ui.track.dispatch('keydown', { key: 'ArrowRight', ...properties }).prevented, false);
  assert.equal(ui.track.dispatch('keydown', { key: 'PageDown' }).prevented, false);
  assert.equal(ui.requests.length, 0);
  for (const [key, target] of [['End', 360], ['Home', 0], ['ArrowRight', 120], ['ArrowLeft', 0]]) {
    assert.equal(ui.track.dispatch('keydown', { key }).prevented, true);
    assert.equal(ui.requests.at(-1).left, target);
  }
});

test('reduced motion is respected on each navigation and mobile preview is excluded from announcements', () => {
  const ui = fixture({ width: 125, reduced: true, language: 'es' });
  assert.equal(ui.status.textContent, 'Capturas 1 a 1 de 6');
  ui.next.click();
  assert.notEqual(ui.requests.at(-1).behavior, 'smooth');
  ui.flushTimers();
  assert.equal(ui.track.scrollLeft, 120);
  assert.equal(ui.status.textContent, 'Capturas 2 a 2 de 6');
  ui.motion.matches = false;
  ui.next.click();
  assert.equal(ui.requests.at(-1).behavior, 'smooth');
  ui.finish();
  assert.equal(ui.status.textContent, 'Capturas 3 a 3 de 6');
});

test('responsive resize recomputes boundaries and visible range, including a track that fits all slides', () => {
  const ui = fixture({ width: 125 });
  ui.track.dispatch('keydown', { key: 'End' });
  assert.equal(ui.requests.at(-1).left, 575);
  ui.finish();
  assert.equal(ui.status.textContent, 'Screenshots 6 to 6 of 6');
  ui.resize(340);
  assert.equal(ui.next.disabled, true);
  assert.equal(ui.status.textContent, 'Screenshots 4 to 6 of 6');
  ui.resize(700, true);
  assert.equal(ui.previous.disabled, true);
  assert.equal(ui.next.disabled, true);
  assert.equal(ui.status.textContent, 'Screenshots 1 to 6 of 6');
  ui.resize(125, true);
  assert.equal(ui.next.disabled, false);
  ui.next.click();
  assert.equal(ui.requests.at(-1).left, 120);
});
