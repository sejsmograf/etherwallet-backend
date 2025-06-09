import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import pool from "../db/database";
import { ethersService } from "../services/ethersService";
import { PoolConnection, RowDataPacket } from "mysql2/promise";
import crypto from "crypto";
import { telegramService } from "../services/telegramService";
import { decryptData, encryptData } from "../utils/cryptoUtils";
import * as fs from "node:fs";

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
  const { phoneNumber, password: encryptedPassword } = req.body;

  if (!phoneNumber || !encryptedPassword) {
    res.status(400).json({ error: "phoneNumber and encrypted password are required" });
    return;
  }

  let password: string;
  try {
    const privateKey = fs.readFileSync("private.pem", "utf8");
    const decryptedBuffer = crypto.privateDecrypt(
        {
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: "sha256",
        },
        Buffer.from(encryptedPassword, "base64")
    );
    password = decryptedBuffer.toString("utf8");
  } catch (err) {
    console.error("RSA decryption failed:", err);
    res.status(400).json({ error: "Invalid encrypted password format" });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters long" });
    return;
  }

  let connection: PoolConnection | null = null;
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
  const { phoneNumber, password: encryptedPassword } = req.body;

  if (!phoneNumber || !encryptedPassword) {
    res.status(400).json({ error: "phoneNumber and encrypted password are required" });
    return;
  }

  let password: string;
  try {
    const privateKey = fs.readFileSync("private.pem", "utf8");
    const decryptedBuffer = crypto.privateDecrypt(
        {
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: "sha256",
        },
        Buffer.from(encryptedPassword, "base64")
    );
    password = decryptedBuffer.toString("utf8");
  } catch (err) {
    console.error("RSA decryption failed:", err);
    res.status(400).json({ error: "Invalid encrypted password format" });
    return;
  }

  let connection: PoolConnection | null = null;
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

    console.log("Decrypted password:", password);
    console.log("Hashed in DB:", user.password_hash);


    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const decryptedPrivateKey = await decryptData(user.encrypted_private_key, password);

    const verificationCode = String(await crypto.randomInt(100000, 999999));
    await telegramService.sendVerificationMessage(phoneNumber, undefined, verificationCode);

    const encryptedPrivateKeyForCode = await encryptData(decryptedPrivateKey, verificationCode);

    res.status(200).json({
      address: user.wallet_address,
      privateKey: encryptedPrivateKeyForCode,
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

