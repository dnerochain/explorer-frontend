import React from "react";
import { Link } from 'react-router-dom';
import get from 'lodash/get';

import TransactionsTable from "common/components/transactions-table";
import BlocksTable from "common/components/blocks-table";
import TokenDashboard from "common/components/token-dashboard";
import DashboardRow from "common/components/dashboard-row";
import { priceService } from 'common/services/price';

export default class Dashboard extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      dneroInfo: null,
      dtokenInfo: null
    };
  }
  componentDidMount() {
    this.getPrices();
  }
  getPrices(counter = 0) {
    priceService.getAllprices()
      .then(async res => {
        const prices = get(res, 'data.body');
        let dneroInfo, dtokenInfo;
        prices.forEach(info => {
          if (info._id === 'DNERO') dneroInfo = info;
          else if (info._id === 'DTOKEN') dtokenInfo = info;
        })
        try {
          let res = await priceService.getDtokenSupply();
          dtokenInfo.circulating_supply = get(res, 'data.circulation_supply')
          this.setState({ dneroInfo, dtokenInfo })
        } catch (err) {
          console.log(err);
        }
      })
      .catch(err => {
        console.log(err);
      });
    setTimeout(() => {
      let { dneroInfo, dtokenInfo } = this.state;
      if ((!dneroInfo || !dtokenInfo) && counter++ < 4) {
        this.getPrices(counter);
      }
    }, 1000);
  }
  render() {
    const { dneroInfo, dtokenInfo } = this.state;
    const { backendAddress } = this.props;
    return (
      <div className="content home">
        <div className="dashboard-wrap">
          <TokenDashboard type='dnero' tokenInfo={dneroInfo} />
          <TokenDashboard type='dtoken' tokenInfo={dtokenInfo} />
          <DashboardRow />
        </div>
        <div className="overview">
          <div>
            <h2 className="page-title blocks"><Link to="/blocks">Blocks</Link></h2>
            <BlocksTable
              updateLive={true}
              backendAddress={backendAddress}
              truncateHash={true}
              includeDetails={false}
              truncate={50} />
            <Link to="/blocks" className="more">View More</Link>
          </div>

          <div>
            <h2 className="page-title transactions"><Link to="/txs">Transactions</Link></h2>
            <TransactionsTable
              updateLive={true}
              backendAddress={backendAddress}
              includeDetails={false}
              truncate={40} />
            <Link to="/txs" className="more">View More</Link>
          </div>

        </div>
      </div>
    );
  }
}