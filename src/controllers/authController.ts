// src/controllers/authController.ts
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
// import jwt from "jsonwebtoken";
import pool from "../db/database";
import { ethersService } from "../services/ethersService";
// import { encryptData } from "../utils/cryptoUtils";
import { PoolConnection, RowDataPacket } from "mysql2/promise";
import { config } from "../config/config";
import axios from "axios";
import CryptoJS from "crypto-js";
import crypto from "crypto";

const SALT_ROUNDS = 10;
interface UserRecord extends RowDataPacket {
  id: number;
  username: string;
  password_hash: string;
  wallet_address: string;
}
export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { username, password } = req.body;
  let connection: PoolConnection | null = null;

  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
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
      "SELECT id FROM users WHERE username = ?",
      [username]
    );

    if (existingUsers.length > 0) {
      res.status(409).json({ error: "Username already exists" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const wallet = await ethersService.createWallet(username);
    const { address: walletAddress, privateKey } = wallet;

    const encryptedPrivateKey = await CryptoJS.AES.encrypt(
      privateKey,
      password
    ).toString();

    await connection.query(
      "INSERT INTO users (username, password_hash, wallet_address, encrypted_private_key, salt) VALUES (?, ?, ?, ?, ?)",
      [username, passwordHash, walletAddress, encryptedPrivateKey, ""]
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
  const { username, password } = req.body;
  let connection: PoolConnection | null = null;

  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  try {
    connection = await pool.getConnection();

    const [users] = await connection.query<UserRecord[]>(
      "SELECT id, username, password_hash, wallet_address, encrypted_private_key FROM users WHERE username = ?",
      [username]
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

    const decryptedPrivateKey = await CryptoJS.AES.decrypt(
      user.encrypted_private_key,
      password
    ).toString(CryptoJS.enc.Utf8);

    const randomDigits = String(await crypto.randomInt(100000, 999999));
    const telegramBaseUrl = "https://gatewayapi.telegram.org/";

    const headers = {
      Authorization: `Bearer ${config.telegram.apiKey}`,
      "Content-Type": "application/json",
    };

    await axios.post(
      `${telegramBaseUrl}sendVerificationMessage`,
      {
        phone_number: user.username,
        code: randomDigits,
      },
      {
        headers,
      }
    );

    const verificationCodeEncryptedPrivateKey = await CryptoJS.AES.encrypt(
      decryptedPrivateKey,
      randomDigits
    ).toString();

    console.debug("DEBUG: ", randomDigits);

    // const payload = {
    //   userId: user.id,
    //   username: user.username,
    //   walletAddress: user.wallet_address,
    //   privateKey: verificationCodeEncryptedPrivateKey,
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
