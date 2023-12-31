import { apiService } from './api';

export const priceService = {
  getAllprices() {
    return apiService.get(`price/all`, {});
  },
  getDtokenSupply() {
    return apiService.get(`supply/dtoken`, {});
  }
};
