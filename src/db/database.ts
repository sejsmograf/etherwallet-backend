// src/db/database.ts
import mysql from "mysql2/promise";
import { config } from "../config/config";


console.log("--- MySQL Config Used ---");
console.log("Host:", config.mysql.host);
console.log("Port:", config.mysql.port);
console.log("User:", config.mysql.user);
console.log("Password Raw (DEBUG ONLY):", config.mysql.password);
console.log("Database:", config.mysql.database);
console.log("-------------------------");
const pool = mysql.createPool({
    host: config.mysql.host,
    port: config.mysql.port,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database,
    waitForConnections: config.mysql.waitForConnections,
    connectionLimit: config.mysql.connectionLimit,
    queueLimit: config.mysql.queueLimit,
});

export const testConnection = async (): Promise<void> => {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log("Successfully connected to the MySQL database.");
    } catch (error) {
        console.error("Error connecting to the MySQL database:", error);
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

export default pool;
