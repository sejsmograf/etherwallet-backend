export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  blockNumber: number;
  gasUsed: string;
  gasPrice: string;
  status: boolean;
}

export interface WalletBalance {
  address: string;
  balanceWei: string;
  balanceEth: string;
  fiatValue?: FiatValue;
}

export interface TransactionRequest {
  from: string;
  to: string;
  value: string; // ETH amount
  data?: string;
  gasLimit?: string;
  privateKey: string;
}

export interface FiatValue {
  currency: string;
  value: string;
  exchangeRate: number;
}

export interface FiatConversion {
  eth: string;
  currency: string;
  value: string;
  exchangeRate: number;
  timestamp: number;
}
