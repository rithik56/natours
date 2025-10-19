import axios from 'axios';
import { displayAlert } from './alerts.mjs';

const createCheckoutSession = async (tourId) => {
  try {
    const res = await axios({
      method: 'GET',
      url: `/api/v1/bookings/checkout-session/${tourId}`,
    });

    if (res.data.status === 'success') {
      // 2) Create checkout form + redirect to checkout
      window.location.href = res.data.session.url;
    }
  } catch (err) {
    displayAlert('error', err.response.data.message);
  }
};

export default createCheckoutSession;
