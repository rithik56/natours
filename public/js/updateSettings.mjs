import axios from 'axios';
import { displayAlert } from './alerts.mjs';

const updateSettings = async (data, type) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: `/api/v1/users/${type === 'password' ? 'updatePassword' : 'updateUser'}`,
      data,
    });

    if (res.data.status === 'success') {
      displayAlert(
        'success',
        `${type.toUpperCase()} details saved successfully`,
      );
    }
  } catch (err) {
    displayAlert('error', err.response.data.message);
  }
};

export default updateSettings;
