/* eslint-disable */

const showAlert = (type, msg) => {
  const markup = `<div class="alert alert--${type}">${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  window.setTimeout(() => {
    document.querySelector('.alert').remove();
  }, 5000);
};

// type is 'success' or 'error'
const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
};

export const displayAlert = (type, msg) => {
  hideAlert();
  showAlert(type, msg);
};
