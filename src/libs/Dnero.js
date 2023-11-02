import { BigNumber } from 'bignumber.js';
import DneroJS from './dnerojs.esm';
import Config from '../config';

export default class Dnero {
  static _chainId = Config.defaultDneroChainID;

  static get chainId() {
    return this._chainId;
  }

  static getTransactionFee() {
    //10^12 DTokenWei
    return 0.000001;
  }

  static unsignedSmartContractTx(txData, sequence) {
    let { from, to, data, value, transactionFee, gasLimit } = txData;

    const ten18 = (new BigNumber(10)).pow(18); // 10^18, 1 Dnero = 10^18 DneroWei, 1 Gamma = 10^ DTokenWei
    const feeInDTokenWei = (new BigNumber(transactionFee)).multipliedBy(ten18); // Any fee >= 10^12 DTokenWei should work, higher fee yields higher priority
    const senderSequence = sequence;
    const gasPrice = feeInDTokenWei;

    let tx = new DneroJS.SmartContractTx(from, to, gasLimit, gasPrice, data, value, senderSequence);

    return tx;
  }
}
