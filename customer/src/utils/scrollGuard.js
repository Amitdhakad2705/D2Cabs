
export function resetPageScrollLock() {
  document.documentElement.style.overflowY = 'auto';
  document.documentElement.style.height = 'auto';
  document.body.style.overflowY = 'auto';
  document.body.style.height = 'auto';

  document.body.classList.remove('no-scroll', 'modal-open', 'menu-open');
}
