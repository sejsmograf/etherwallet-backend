import { Router } from 'express';
import * as walletController from '../controllers/walletController';

const router = Router();

// Wallet balance
router.get('/balance/:address', walletController.getBalance);

// Transaction operations
router.post('/transaction', walletController.sendTransaction);
router.get('/transactions/:address', walletController.getTransactionHistory);
router.get('/transaction/:txHash', walletController.getTransactionDetails);

// Fiat conversion
router.get('/convert/:ethAmount', walletController.convertToFiat);

// Wallet creation
router.post('/create', walletController.createWallet);

export default router;
