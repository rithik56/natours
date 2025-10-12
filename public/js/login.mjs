/* eslint-disable */

import axios from 'axios';
import { displayAlert } from './alerts.mjs';

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: {
        email,
        password,
      },
    });

    if (res.data.status === 'success') {
      displayAlert('success', 'Logged in successfully!');
      setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    console.log('<<<< err', err);
    displayAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout',
    });
    if (res.data.status === 'success') location.assign('/');
  } catch (err) {}
};
