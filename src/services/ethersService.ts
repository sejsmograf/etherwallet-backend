import { ethers } from "ethers";
import axios from "axios";
import { config } from "../config/config";
import {
  Transaction,
  WalletBalance,
  TransactionRequest,
  FiatConversion,
  FiatValue,
} from "../types/wallet";
import { AxiosResponse } from "axios";

export class EthersService {
  private provider: ethers.InfuraProvider;

  constructor() {
    const networkName = this.getNetworkName(config.infura.network);

    this.provider = new ethers.InfuraProvider(
      networkName,
      config.infura.projectId,
    );
  }

  private getNetworkName(network: string): string {
    const networkMap: Record<string, string> = {
      mainnet: "mainnet",
      goerli: "goerli",
      sepolia: "sepolia",
      // Add other networks as needed
    };

    return networkMap[network] || network;
  }

  /**
   * Get wallet balance including optional fiat conversion
   */
  async getWalletBalance(
    address: string,
    fiatCurrency?: string,
  ): Promise<WalletBalance> {
    if (!ethers.isAddress(address)) {
      throw new Error("Invalid Ethereum address");
    }

    const balanceWei = await this.provider.getBalance(address);
    const balanceEth = ethers.formatEther(balanceWei);

    const result: WalletBalance = {
      address,
      balanceWei: balanceWei.toString(),
      balanceEth,
    };

    // Add fiat conversion if requested
    if (fiatCurrency) {
      const fiatValue = await this.convertEthToFiat(balanceEth, fiatCurrency);
      result.fiatValue = fiatValue;
    }

    return result;
  }

  /**
   * Sign and send a transaction
   */
  async sendTransaction(txRequest: TransactionRequest): Promise<string> {
    if (!ethers.isAddress(txRequest.to)) {
      throw new Error("Invalid recipient address");
    }

    if (!txRequest.privateKey) {
      throw new Error("Private key is required");
    }

    // Create wallet from private key
    const wallet = new ethers.Wallet(txRequest.privateKey, this.provider);

    // Check that from address matches wallet address
    if (wallet.address.toLowerCase() !== txRequest.from.toLowerCase()) {
      throw new Error("From address does not match the provided private key");
    }

    // Create transaction
    const tx = {
      to: txRequest.to,
      value: ethers.parseEther(txRequest.value),
      data: txRequest.data || "0x",
      gasLimit: txRequest.gasLimit
        ? ethers.toBigInt(txRequest.gasLimit)
        : undefined,
    };

    // Sign and send transaction
    const txResponse = await wallet.sendTransaction(tx);

    // Wait for one confirmation
    await txResponse.wait(1);

    return txResponse.hash;
  }

  /**
   * Get transaction history for an address
   */
  async getTransactionHistory(
    address: string,
    limit: number = 10,
  ): Promise<Transaction[]> {
    if (!ethers.isAddress(address)) {
      throw new Error("Invalid Ethereum address");
    }

    if (!config.etherscan.apiKey) {
      throw new Error("Etherscan API key is required for transaction history");
    }

    // Use Etherscan API to get transaction history
    const network =
      config.infura.network === "mainnet" ? "" : `-${config.infura.network}`;
    const url = `https://api${network}.etherscan.io/api?module=account&action=txlist&address=${address}&page=1&offset=10&sort=desc&apikey=${config.etherscan.apiKey}`;

    const response: AxiosResponse = await axios.get(url);
    console.log("RESPONSE", response.data);

    const transactions: Transaction[] = [];

    for (const tx of response.data.result) {
      const block = await this.provider.getBlock(BigInt(tx.blockNumber));

      transactions.push({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: ethers.formatEther(tx.value),
        timestamp: block ? Number(block.timestamp) : 0,
        blockNumber: Number(tx.blockNumber),
        gasUsed: tx.gasUsed,
        gasPrice: tx.gasPrice,
        status: tx.txreceipt_status === "1",
      });

      if (transactions.length >= limit) {
        break;
      }
    }

    return transactions;
  }

  /**
   * Get transaction details
   */
  async getTransactionDetails(txHash: string): Promise<Transaction> {
    // Get transaction details
    const tx = await this.provider.getTransaction(txHash);

    if (!tx) {
      throw new Error("Transaction not found");
    }

    // Get receipt for status and gas used
    const receipt = await this.provider.getTransactionReceipt(txHash);

    if (!receipt) {
      throw new Error("Transaction receipt not found");
    }

    // Get block for timestamp
    const block = await this.provider.getBlock(tx.blockNumber as number);

    return {
      hash: tx.hash,
      from: tx.from,
      to: tx.to as string,
      value: ethers.formatEther(tx.value),
      timestamp: block ? Number(block.timestamp) : 0,
      blockNumber: Number(tx.blockNumber),
      gasUsed: receipt.gasUsed.toString(),
      gasPrice: tx.gasPrice ? tx.gasPrice.toString() : "0",
      status: receipt.status === 1,
    };
  }

  /**
   * Convert ETH to fiat currency
   */
  async convertEthToFiat(
    ethAmount: string,
    currency: string = config.defaultFiatCurrency,
  ): Promise<FiatValue> {
    try {
      const response = await axios.get(
        `${config.coingecko.apiUrl}/simple/price?ids=ethereum&vs_currencies=${currency.toLowerCase()}`,
      );

      const exchangeRate = response.data.ethereum[currency.toLowerCase()];
      const ethValue = parseFloat(ethAmount);
      const fiatValue = (ethValue * exchangeRate).toFixed(2);

      return {
        currency: currency.toUpperCase(),
        value: fiatValue,
        exchangeRate,
      };
    } catch (error) {
      throw new Error(`Failed to get ETH to currency conversion rate`);
    }
  }

  /**
   * Create a new wallet
   */
  createWallet(): { address: string; privateKey: string } {
    const wallet = ethers.Wallet.createRandom();

    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
    };
  }
}

// Singleton instance
export const ethersService = new EthersService();
