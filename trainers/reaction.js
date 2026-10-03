// Reaction trainer — the v1 game, same look and feel.
// The whole screen is the button: purple = wait, yellow = tap, calm grey-blue = too soon.
// No rounds: play for as long as you like.

import { MIN_MS, mean } from '../js/stats.js';

export default {
  id: 'reaction',
  name: 'Reaction',
  blurb: 'Wait for yellow, then tap. Play as long as you like.',

  /**
   * @param {HTMLElement} el      container to draw into
   * @param {(r: {ms?: number, early?: boolean}) => void} onResult
   * @param {{ setStatus?: (text: string) => void }} ctx
   * @returns {() => void} unmount
   */
  mount(el, onResult, ctx = {}) {
    el.innerHTML = `
      <div class="rx-pad" tabindex="0" role="button" aria-live="polite">
        <div class="rx-big">Tap</div>
        <div class="rx-hint">When the screen turns yellow, tap as fast as you can. Play as long as you like.</div>
      </div>
      <div class="rx-strip">
        <div class="rx-stat"><span class="label">Last 5 avg</span><b data-avg>–</b></div>
        <div class="rx-bars" aria-hidden="true"></div>
        <div class="rx-stat" style="text-align:right"><span class="label">Best so far</span><b data-best>–</b></div>
      </div>`;

    const pad = el.querySelector('.rx-pad');
    const main = el.querySelector('.rx-big');
    const hint = el.querySelector('.rx-hint');
    const avgEl = el.querySelector('[data-avg]');
    const bestEl = el.querySelector('[data-best]');
    const bars = el.querySelector('.rx-bars');
    const setStatus = ctx.setStatus || (() => {});

    let state = 'idle', timer = null, t0 = 0, raf = 0;
    const times = []; // only the ones that count (>= MIN_MS)

    function show(cls, big, small) {
      pad.className = 'rx-pad' + (cls ? ' ' + cls : '');
      el.dataset.state = cls;
      main.innerHTML = big;
      hint.textContent = small;
    }

    function startWait() {
      state = 'waiting';
      show('waiting', 'Wait…', 'Hold still. It turns yellow at a random moment.');
      const delay = 1200 + Math.random() * 3300;
      timer = setTimeout(() => {
        state = 'go';
        show('go', 'Now!', '');
        // Start the clock now, then move it to the frame the yellow is actually painted
        // (if frames are paused, the game still never gets stuck on "Now!").
        t0 = performance.now();
        raf = requestAnimationFrame(() => { if (state === 'go') t0 = performance.now(); });
      }, delay);
    }

    function render() {
      setStatus(times.length + (times.length === 1 ? ' tap' : ' taps'));
      if (!times.length) return;
      avgEl.textContent = Math.round(mean(times.slice(-5))) + ' ms';
      bestEl.textContent = Math.min(...times) + ' ms';
      const last = times.slice(-16), max = Math.max(...last, 400);
      bars.innerHTML = last.map(t => `<i style="height:${Math.max(6, Math.round(t / max * 40))}px"></i>`).join('');
    }

    function press(e) {
      if (e) e.preventDefault();
      if (state === 'idle' || state === 'result' || state === 'early') return startWait();
      if (state === 'waiting') {
        clearTimeout(timer);
        state = 'early';
        show('early', 'Too soon', 'No big deal. Tap to go again.');
        onResult({ early: true });
        return;
      }
      if (state === 'go') {
        if (!t0) return; // yellow not painted yet
        const ms = Math.round(performance.now() - t0);
        t0 = 0;
        state = 'result';
        if (ms < MIN_MS) {
          show('', `${ms}<small>ms</small>`, 'Quicker than a reaction can be, so it is left out of your numbers. Tap to go again.');
        } else {
          times.push(ms);
          show('', `${ms}<small>ms</small>`, 'Tap to go again.');
        }
        onResult({ ms });
        render();
      }
    }

    function onKey(e) {
      if (e.code !== 'Space' && e.code !== 'Enter') return;
      if (e.target instanceof Element && e.target.closest('button, a, summary, input')) return;
      if (!e.repeat) press(e); else e.preventDefault();
    }

    pad.addEventListener('pointerdown', press);
    document.addEventListener('keydown', onKey);
    render();
    pad.focus({ preventScroll: true });

    return function unmount() {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey);
      el.innerHTML = '';
      delete el.dataset.state;
    };
  },
};
