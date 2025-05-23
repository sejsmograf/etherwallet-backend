import { Request, Response } from "express";
import { ethersService } from "../services/ethersService";
import { config } from "../config/config";
import { ethers } from "ethers";

export const getBalance = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { address } = req.params;
    const { currency } = req.query;

    if (!ethers.isAddress(address)) {
      res.status(400).json({ error: "Invalid Ethereum address" });
      return;
    }

    const fiatCurrency = currency
      ? String(currency).toUpperCase()
      : config.defaultFiatCurrency;
    const balance = await ethersService.getWalletBalance(address, fiatCurrency);

    res.json(balance);
  } catch (error: any) {
    console.error("Error getting balance:", error);
    res.status(500).json({ error: error.message || "Failed to get balance" });
  }
};

export const sendTransaction = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { from, to, value, data, gasLimit, privateKey } = req.body;

    if (!from || !to || !value || !privateKey) {
      res.status(400).json({
        error: "Missing required fields: from, to, value, privateKey",
      });
      return;
    }

    if (!ethers.isAddress(from) || !ethers.isAddress(to)) {
      res.status(400).json({ error: "Invalid Ethereum address" });
      return;
    }

    const txHash = await ethersService.sendTransaction({
      from,
      to,
      value,
      data,
      gasLimit,
      privateKey,
    });

    res.json({ txHash });
  } catch (error: any) {
    console.error("Error sending transaction:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to send transaction" });
  }
};

export const getTransactionHistory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { address } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    if (!ethers.isAddress(address)) {
      res.status(400).json({ error: "Invalid Ethereum address" });
      return;
    }

    const transactions = await ethersService.getTransactionHistory(
      address,
      limit
    );

    res.json(transactions);
  } catch (error: any) {
    console.error("Error getting transaction history:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to get transaction history" });
  }
};

export const getTransactionDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { txHash } = req.params;

    const transaction = await ethersService.getTransactionDetails(txHash);

    res.json(transaction);
  } catch (error: any) {
    console.error("Error getting transaction details:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to get transaction details" });
  }
};

export const convertToFiat = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { ethAmount } = req.params;
    const { currency } = req.query;

    const amount = parseFloat(ethAmount);

    if (isNaN(amount)) {
      res.status(400).json({ error: "Invalid ETH amount" });
      return;
    }

    const fiatCurrency = currency
      ? String(currency).toUpperCase()
      : config.defaultFiatCurrency;
    const conversion = await ethersService.convertEthToFiat(
      ethAmount,
      fiatCurrency
    );

    res.json({
      eth: ethAmount,
      ...conversion,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error("Error converting to fiat:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to convert to fiat" });
  }
};

export const createWallet = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const wallet = await ethersService.createWallet(req.body.phoneNumber);
    if (!wallet) {
      res.status(400).json({ error: "Failed to create wallet" });
      return;
    }
    res.json(wallet);
  } catch (error: any) {
    console.error("Error creating wallet:", error);
    res.status(500).json({ error: error.message || "Failed to create wallet" });
  }
};
