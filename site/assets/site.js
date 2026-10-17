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
