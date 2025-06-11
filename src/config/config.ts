import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  infura: {
    projectId: process.env.INFURA_PROJECT_ID || "",
    projectSecret: process.env.INFURA_PROJECT_SECRET,
    network: process.env.INFURA_NETWORK || "mainnet",
  },
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"],
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
  },
  coingecko: {
    apiUrl: "https://api.coingecko.com/api/v3",
  },
  defaultFiatCurrency: process.env.DEFAULT_FIAT_CURRENCY || "USD",

  mysql: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306", 10),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "ether_wallet_db",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  },
  session: {
    secret:
      process.env.SESSION_SECRET || "aK3$sP9!zQ7*gH2@fD5&jL1^cN6_bV8+mX4=wW5",
  },
  telegram: {
    apiKey: process.env.TELEGRAM_API_KEY || "",
  },
};
