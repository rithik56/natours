/* eslint-disable */

import '@babel/polyfill';
import { login, logout } from './login.mjs';
import updateSettings from './updateSettings.mjs';
import createCheckoutSession from './createCheckoutSession.mjs';
import { displayMap } from './mapbox.mjs';

// DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.login-form');
const logoutBtn = document.querySelector('.nav__el--logout');
const submitForm = document.querySelector('.form-user-data');
const passwordForm = document.querySelector('.form-user-password');
const bookTourBtn = document.getElementById('book-tour-btn');

if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (loginForm)
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });

if (logoutBtn) logoutBtn.addEventListener('click', logout);

if (submitForm)
  submitForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    updateSettings(form, 'data');
  });

if (passwordForm)
  passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    document.querySelector('.btn--save-password').textContent = 'Updating...';

    const currentPassword = document.getElementById('password-current').value;
    const newPassword = document.getElementById('password').value;
    const newPasswordConfirm =
      document.getElementById('password-confirm').value;
    await updateSettings(
      { currentPassword, newPassword, newPasswordConfirm },
      'password',
    );

    document.querySelector('.btn--save-password').textContent = 'Save password';

    document.getElementById('password-current').textContent = '';
    document.getElementById('password').textContent = '';
    document.getElementById('password-confirm').textContent = '';
  });

if (bookTourBtn) {
  bookTourBtn.addEventListener('click', async (e) => {
    e.target.textContent = 'Processing...';
    const { tourId } = e.target.dataset;
    await createCheckoutSession(tourId);
  });
}
