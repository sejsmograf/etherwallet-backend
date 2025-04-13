import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  infura: {
    projectId: process.env.INFURA_PROJECT_ID || '',
    projectSecret: process.env.INFURA_PROJECT_SECRET,
    network: process.env.INFURA_NETWORK || 'mainnet',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || '',
  },
  coingecko: {
    apiUrl: 'https://api.coingecko.com/api/v3',
  },
  defaultFiatCurrency: process.env.DEFAULT_FIAT_CURRENCY || 'USD',
};
