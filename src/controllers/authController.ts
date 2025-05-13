import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import pool from "../db/database";
import { ethersService } from "../services/ethersService";
import { PoolConnection, RowDataPacket } from "mysql2/promise";
import crypto from "crypto";
import { telegramService } from "../services/telegramService";
import { decryptData, encryptData } from "../utils/cryptoUtils";

const SALT_ROUNDS = 10;
interface UserRecord extends RowDataPacket {
  id: number;
  phone_number: string;
  password_hash: string;
  wallet_address: string;
}
export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { phoneNumber, password } = req.body;
  let connection: PoolConnection | null = null;

  if (!phoneNumber || !password) {
    res.status(400).json({ error: "phoneNumber and password are required" });
    return;
  }
  if (password.length < 8) {
    res
      .status(400)
      .json({ error: "Password must be at least 8 characters long" });
    return;
  }

  try {
    connection = await pool.getConnection();

    const [existingUsers] = await connection.query<RowDataPacket[]>(
      "SELECT id FROM users WHERE phone_number = ?",
      [phoneNumber]
    );

    if (existingUsers.length > 0) {
      res.status(409).json({ error: "phone number already exists" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const wallet = await ethersService.createWallet(phoneNumber);
    const { address: walletAddress, privateKey } = wallet;

    const encryptedPrivateKey = await encryptData(privateKey, password);

    await connection.query(
      "INSERT INTO users (phone_number, password_hash, wallet_address, encrypted_private_key, salt) VALUES (?, ?, ?, ?, ?)",
      [phoneNumber, passwordHash, walletAddress, encryptedPrivateKey, ""]
    );
    res.status(201).json(wallet);
  } catch (error) {
    console.error("Error during user registration:", error);
    next(error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { phoneNumber: phoneNumber, password } = req.body;
  let connection: PoolConnection | null = null;

  if (!phoneNumber || !password) {
    res.status(400).json({ error: "phoneNumber and password are required" });
    return;
  }

  try {
    connection = await pool.getConnection();

    const [users] = await connection.query<UserRecord[]>(
      "SELECT id, phone_number, password_hash, wallet_address, encrypted_private_key FROM users WHERE phone_number = ?",
      [phoneNumber]
    );

    if (users.length === 0) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const user = users[0];

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const decryptedPrivateKey = await decryptData(
      user.encrypted_private_key,
      password
    );

    const randomDigits = String(await crypto.randomInt(100000, 999999));

    await telegramService.sendVerificationMessage(
      phoneNumber,
      undefined,
      randomDigits
    );

    const verificationCodeEncryptedPrivateKey = await encryptData(
      decryptedPrivateKey,
      randomDigits
    );

    // TODO: require jwt for getBalance route and etc.?
    // const payload = {
    //   userId: user.id,
    //   walletAddress: user.wallet_address,
    // };

    // const options = {
    //   expiresIn: 3600,
    // };

    // const token = jwt.sign(payload, config.session.secret, options);

    res.status(200).json({
      address: user.wallet_address,
      privateKey: verificationCodeEncryptedPrivateKey,
    });
  } catch (error) {
    console.error("Error during user login:", error);
    next(error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};
