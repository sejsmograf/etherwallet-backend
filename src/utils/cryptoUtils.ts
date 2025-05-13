// // src/utils/cryptoUtils.ts
// import crypto from "crypto";
// import util from "util";

// // Konwertujemy funkcje callbackowe na Promise dla łatwiejszego użycia z async/await
// const scrypt = util.promisify(crypto.scrypt);
// const randomBytes = util.promisify(crypto.randomBytes);

// const ALGORITHM = "aes-256-gcm"; // Używamy AES-GCM
// const IV_LENGTH = 16; // Długość IV dla AES-GCM
// const SALT_LENGTH = 16; // Długość soli dla scrypt
// const KEY_LENGTH = 32; // Długość klucza dla AES-256 (32 bajty)
// const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1 }; // Opcje dla scrypt (można dostosować)

// /**
//  * Szyfruje dane (np. klucz prywatny) używając hasła.
//  * Zwraca zaszyfrowane dane w formacie: salt:iv:encryptedData (hex)
//  */
// export const encryptData = async (
//     data: string,
//     password: string,
// ): Promise<string> => {
//     const salt = await randomBytes(SALT_LENGTH);
//     const iv = await randomBytes(IV_LENGTH);

//     const derivedKey = (await scrypt(
//         password,
//         salt,
//         KEY_LENGTH
//     )) as Buffer;

//     const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);

//     let encrypted = cipher.update(data, "utf8", "hex");
//     encrypted += cipher.final("hex");
//     const authTag = cipher.getAuthTag().toString("hex");

//     return `${salt.toString("hex")}:${iv.toString("hex")}:${authTag}:${encrypted}`;
// };

// /**
//  * Deszyfruje dane zaszyfrowane przez encryptData.
//  * Oczekuje danych w formacie: salt:iv:authTag:encryptedData (hex)
//  */
// export const decryptData = async (
//     encryptedString: string,
//     password: string,
// ): Promise<string | null> => {
//     try {
//         const parts = encryptedString.split(":");
//         if (parts.length !== 4) {
//             throw new Error("Invalid encrypted data format");
//         }
//         const [saltHex, ivHex, authTagHex, encryptedDataHex] = parts;

//         const salt = Buffer.from(saltHex, "hex");
//         const iv = Buffer.from(ivHex, "hex");
//         const authTag = Buffer.from(authTagHex, "hex");

//         const derivedKey = (await scrypt(
//             password,
//             salt,
//             KEY_LENGTH
//         )) as Buffer;

//         const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
//         decipher.setAuthTag(authTag);

//         let decrypted = decipher.update(encryptedDataHex, "hex", "utf8");
//         decrypted += decipher.final("utf8");

//         return decrypted;
//     } catch (error) {
//         console.error("Decryption failed:", error);
//         return null;
//     }
// };
