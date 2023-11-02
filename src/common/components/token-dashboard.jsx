import React from "react";
import get from 'lodash/get';
import cx from 'classnames';

import { formatNumber, formatCurrency, sumCoin, fetchWDTokenTotalSupply } from 'common/helpers/utils';
import { transactionsService } from 'common/services/transaction';
import { stakeService } from 'common/services/stake';
import { blocksService } from 'common/services/block';
import DneroChart from 'common/components/chart';
import Detail from 'common/components/dashboard-detail';
import BigNumber from 'bignumber.js';
import { WEI } from 'common/constants';

export default class TokenDashboard extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      totalStaked: 0,
      holders: { dnero: [], dtoken: [] },
      percentage: { dnero: [], dtoken: [] },
      txTs: [],
      txNumber: [],
      nodeNum: 0,
      dtokenStaked: 0,
      wdtokenLocaked: 0
    };
  }
  componentDidMount() {
    this.getTotalStaked();
    if (this.props.type === 'dnero') {
      this.getAllStakes();
    }
    if (this.props.type === 'dtoken') {
      this.getTransactionHistory();
    }
  }
  getTransactionHistory() {
    transactionsService.getTransactionHistory()
      .then(res => {
        const txHistory = get(res, 'data.body.data');
        let txTs = [];
        let txNumber = []
        txHistory.sort((a, b) => a.timestamp - b.timestamp).forEach(info => {
          txTs.push(new Date(info.timestamp * 1000));
          txNumber.push(info.number);
        })
        this.setState({ txTs, txNumber })
      })
      .catch(err => {
        console.log(err);
      });
  }
  getAllStakes() {
    stakeService.getAllStake(['eenp', 'vcp', 'scp'])
      .then(res => {
        const stakeList = get(res, 'data.body')
        let sum = stakeList.reduce((sum, info) => {
          if (info.type === 'eenp') sum.dtoken = sumCoin(sum.dtoken, info.amount)
          else sum.dnero = sumCoin(sum.dnero, info.amount)
          return sum;
        }, { dnero: 0, dtoken: 0 });
        let newObj = stakeList.reduce((map, obj) => {
          let tmpObj = obj.type === 'eenp' ? map.dtoken : map.dnero;
          if (!tmpObj[obj.holder]) tmpObj[obj.holder] = 0;
          tmpObj[obj.holder] = sumCoin(tmpObj[obj.holder], obj.amount).toFixed()
          return map;
        }, { dnero: {}, dtoken: {} });
        let dneroTopHolderList = getTopHolderList(newObj.dnero, sum.dnero);
        let dtokenTopHolderList = getTopHolderList(newObj.dtoken, sum.dtoken);
        this.setState({
          holders: {
            dnero: dneroTopHolderList.map(obj => { return obj.holder }),
            dtoken: dtokenTopHolderList.map(obj => { return obj.holder }),
          },
          percentage: {
            dnero: dneroTopHolderList.map(obj => { return (obj.percentage - '0') }),
            dtoken: dtokenTopHolderList.map(obj => { return (obj.percentage - '0') })
          }
        });

        function getTopHolderList(newObj, sum) {
          let topStakes = Array.from(Object.keys(newObj), key => {
            return { 'holder': key, 'amount': newObj[key] }
          }).sort((a, b) => {
            return b.amount - a.amount
          }).slice(0, 8)
          let sumPercent = 0;
          let objList = topStakes.map(stake => {
            let obj = {};
            obj.holder = stake.holder;
            obj.percentage = new BigNumber(stake.amount).dividedBy(sum / 100).toFixed(2);
            sumPercent += obj.percentage - '0';
            return obj;
          })
          if (sumPercent === 0) objList = [{ holder: 'No Node', percentage: 100 }];
          else objList = objList.concat({ holder: 'Rest Nodes', 'percentage': (100 - sumPercent).toFixed(2) })
          return objList;
        }
      })
      .catch(err => {
        console.log(err);
      });
  }
  getTotalStaked() {
    const { type } = this.props;
    stakeService.getTotalStake(type)
      .then(async res => {
        const stake = get(res, 'data.body');
        let wdtokenTotalSupply = 0
        if (type === 'dtoken') {
          try {
            wdtokenTotalSupply = await fetchWDTokenTotalSupply();
          } catch (e) {
            console.log('Error in fetch WDToken total supply. Err:', e.message);
          }
        }
        const totalStaked = BigNumber.sum(stake.totalAmount, wdtokenTotalSupply);
        this.setState({
          totalStaked: totalStaked,
          nodeNum: stake.totalNodes,
          dtokenStaked: stake.totalAmount,
          wdtokenLocaked: wdtokenTotalSupply
        });
      })
      .catch(err => {
        console.log(err);
      });
  }
  render() {
    const { totalStaked, holders, percentage, txTs, txNumber, nodeNum, dtokenStaked, wdtokenLocaked } = this.state;
    const { tokenInfo, type } = this.props;
    const icon = type + 'wei';
    const token = type.toUpperCase();
    const isDnero = type === 'dnero';
    return (
      <React.Fragment>
        {tokenInfo && <div className={cx("dashboard-row", type)}>
          <div className="column">
            <div className={cx("currency", icon)}></div>
          </div>
          <div className="column">
            <Detail title={`${token} PRICE (USD)`} value={`\$${tokenInfo.price.toFixed(6)}`} />
            <Detail title={'MARKET CAP (USD)'} value={formatCurrency(tokenInfo.market_cap, 0)} />
          </div>
          <div className="column">
            <Detail title={'24 HR VOLUME (USD)'} value={formatCurrency(tokenInfo.volume_24h, 0)} />
            <Detail title={'CIRCULATING SUPPLY'} value={formatNumber(tokenInfo.circulating_supply)} />
          </div>
          <div className="column">
            <Detail title={isDnero ? 'TOTAL STAKED NODES' : 'TOTAL ELITE NODES'} value={nodeNum} />
            <Detail title={isDnero ? 'DNERO STAKED (%)' : 'DTOKEN STAKED+LOCKED (%)'}
              value={<StakedPercent staked={totalStaked} totalSupply={tokenInfo.circulating_supply} />}
              className={isDnero ? '' : "tooltip"}
              tooltipText={isDnero ? <></> :
                <DTokenTooltip totalSupply={tokenInfo.circulating_supply} staked={dtokenStaked} locked={wdtokenLocaked} />} />
          </div>
          <div className="column pie-charts">
            {type === 'dtoken' ?
              <div className="chart-container">
                <div className="title">DNERO BLOCKCHAIN TRANSACTION HISTORY (14 DAYS)</div>
                <DneroChart chartType={'line'} labels={txTs} data={txNumber} clickType={''} />
              </div> :
              <>
                <div className="chart-container half">
                  <div className="title">DNERO NODES</div>
                  <DneroChart chartType={'doughnut'} labels={holders.dnero} data={percentage.dnero} clickType={'stake'} />
                </div>
                <div className="chart-container half dtoken">
                  <div className="title">ELITE EDGE NODES</div>
                  <DneroChart chartType={'doughnut'} labels={holders.dtoken} data={percentage.dtoken} clickType={'dtokenStake'} />
                </div>
              </>}
          </div>
        </div>}
      </React.Fragment>
    );
  }
}

const TxnNumber = ({ num }) => {
  const duration = 24 * 60 * 60;
  const tps = num / duration;
  return (
    <React.Fragment>
      {`${formatNumber(num)}`}
      {/* <div className="tps">[{tps.toFixed(2)} TPS]</div> */}
    </React.Fragment>
  );
}

const StakedPercent = ({ staked, totalSupply }) => {
  return (
    <React.Fragment>
      {`${new BigNumber(staked).dividedBy(WEI).dividedBy(totalSupply / 100).toFixed(2)}%`}
    </React.Fragment>
  );
}

const DTokenTooltip = ({ staked, locked, totalSupply }) => {
  return <div className="tooltip--text">
    <div>
      DTOKEN STAKED:
      <span>
        {`${new BigNumber(staked).dividedBy(WEI).dividedBy(totalSupply / 100).toFixed(2)}%`}
      </span>
    </div>
    <div>
      WDTOKEN LOCKED:
      <span>
        {`${new BigNumber(locked).dividedBy(WEI).dividedBy(totalSupply / 100).toFixed(2)}%`}
      </span>
    </div>
  </div>
}