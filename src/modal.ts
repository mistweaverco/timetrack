function openModal(el) {
  el.classList.add('is-active');
}

function closeModal(el) {
  el.classList.remove('is-active');
}

function closeAllModals() {
  (document.querySelectorAll('.modal') || []).forEach((modal) => {
    closeModal(modal);
  });
}

(document.querySelectorAll('.modal button[data-action-type="cancel"]') || []).forEach((close) => {
  const target = close.closest('.modal');
  close.addEventListener('click', (evt) => {
    evt.preventDefault();
    closeModal(target);
  });
});

// Add a keyboard event to close all modals
document.addEventListener('keydown', (event) => {
  if(event.key === "Escape") {
    closeAllModals();
  }
});
