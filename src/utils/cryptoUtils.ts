import CryptoJS from "crypto-js";

export const encryptData = async (
  data: string,
  password: string
): Promise<string> => CryptoJS.AES.encrypt(data, password).toString();

export const decryptData = async (
  data: string,
  password: string
): Promise<string> => CryptoJS.AES.decrypt(data, password).toString();
