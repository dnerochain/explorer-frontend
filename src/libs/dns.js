import DNS from 'dns-resolver';
import Config from '../config';

const endpoint = Config.ethRPCEndpoint || "https://eth-rpc-api.dnerochain.xyz/rpc";

const dns = new DNS({ customRpcEndpoint: endpoint });

export default dns;
