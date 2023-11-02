import React from 'react';
import { Link } from "react-router-dom";
import { formatQuantity } from 'common/helpers/utils';
import { TokenIcons } from 'common/constants';
import { hash, age } from 'common/helpers/transactions';
import cx from 'classnames';
import map from 'lodash/map';
import get from 'lodash/get';
import _truncate from 'lodash/truncate';
import { formatCoin } from '../helpers/utils';


const TokenTxsTable = ({ transactions, type, className, address, tabType, tokenMap }) => {
  const NUM_TRANSACTIONS = type === 'DTOKEN' ? 30 : 25;
  return (
    <table className={cx("data txn-table", className)}>
      <thead>
        <tr>
          <th className="hash">Txn Hash</th>
          <th className="age">Age</th>
          <th className="from">From</th>
          {tabType !== "token" && <th className="icon"></th>}
          <th className="to">To</th>
          {type === 'DNC-721' && <th className="tokenId">TokenId</th>}
          {(type === 'DNC-20' || type === 'DTOKEN') && <th className="quantity">Quantity</th>}
          {type !== 'DTOKEN' && tabType !== 'token' && <th>Token</th>}
        </tr>
      </thead>
      <tbody>
        {map(transactions, (txn, i) => {
          const source = !address ? 'none' : address === txn.from ? 'from' : 'to';
          const name = get(tokenMap, `${txn.contract_address}.name`) || txn.name || "";
          const decimals = get(tokenMap, `${txn.contract_address}.decimals`);
          const quantity = decimals ? formatQuantity(txn.value, decimals) : txn.value;
          return (
            <tr key={i}>
              <td className="hash overflow"><Link to={`/txs/${txn.hash}`}>{hash(txn, 30)}</Link></td>
              <React.Fragment>
                <td className="age">{age(txn)}</td>
                <td className={cx({ 'dim': source === 'to' }, "from")}>
                  <AddressDNS hash={txn.from} dns={txn.fromDns} truncate={NUM_TRANSACTIONS} />
                </td>
                {tabType !== "token" && <td className={cx(source, "icon")}></td>}
                <td className={cx({ 'dim': source === 'from' }, "to")}>
                  <AddressDNS hash={txn.to} dns={txn.toDns} truncate={NUM_TRANSACTIONS} />
                </td>
                {type === 'DNC-721' && <td className="tokenId">
                  <Link to={`/token/${txn.contract_address}?a=${txn.token_id}`}>{txn.token_id}</Link>
                </td>}
                {type === 'DTOKEN' && <td className="quantity">
                  <div className="currency dtoken">
                    {formatCoin(txn.value, 2)}
                  </div>
                </td>}
                {type === 'DNC-20' && <td className="quantity">{quantity}</td>}
                {type !== 'DTOKEN' && tabType !== 'token' && <TokenName name={name} address={txn.contract_address} />}

              </React.Fragment>
            </tr>);
        })}
      </tbody>
    </table>
  );
}

const AddressDNS = ({ hash, dns, truncate = false }) => {
  if (dns) {
    return (
      <div className="value tooltip">
        <div className="tooltip--text">
          <p>{dns}</p>
          <p>({hash})</p>
        </div>
        <Link to={`/account/${hash}`}>{truncate ? _truncate(dns, { length: truncate }) : dns}</Link>
      </div>);
  }
  return (<Link to={`/account/${hash}`}>{truncate ? _truncate(hash, { length: truncate }) : hash}</Link>)
}

const TokenName = (props) => {
  const { name, address } = props;
  const isTruncated = name.length > 12;
  const tokenName = isTruncated ? _truncate(name, { length: 12 }) : name;
  return <td className="token">
    {isTruncated ?
      <div className={cx("tooltip", TokenIcons[name], { "currency": name })}>
        <Link to={`/token/${address}`}>{tokenName}</Link>
        <div className='tooltip--text'>{name}</div>
      </div> :
      <div className={cx(TokenIcons[name], { "currency": name })}>
        <Link to={`/token/${address}`}>{tokenName}</Link>
      </div>
    }
  </td>
}

export default TokenTxsTable;