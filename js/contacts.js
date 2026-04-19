function copyContact(e, value) {
  e.preventDefault();
  e.stopPropagation();
  navigator.clipboard.writeText(value);
  const btn = e.currentTarget.querySelector('.copy-btn') || e.target.closest('.copy-btn');
  const original = btn.innerHTML;
  btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  btn.classList.add('copied');
  setTimeout(() => { btn.innerHTML = original; btn.classList.remove('copied'); }, 1500);
}
