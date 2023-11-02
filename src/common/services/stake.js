import { apiService } from './api';

export const stakeService = {
  getAllStake(types) {
    return apiService.get(`stake/all`, { params: { types } });
  },
  getTotalStake(type) {
    return apiService.get(`stake/totalAmount`, { params: { type } })
  },
  getStakeByAddress(address, types = ['vcp', 'scp', 'eenp']) {	  
    if (!address) {
      throw Error('Missing argument');
    }
    return apiService.get(`stake/${address}`, { params: { types } });
  },
  getStakeReturnTime(height) {
    return apiService.get(`stake/returnTime`, { params: { return_height: height } })
  },
  getTotalDTokenStake() {
    return apiService.get(`stake/totalAmount`, { params: { type: 'dtoken' } })
  }
};
