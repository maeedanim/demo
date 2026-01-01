import * as dotenv from 'dotenv';
import { Logger } from '@nestjs/common';

const logger = new Logger('AppConfig');

// Load environment variables from .env file
dotenv.config();

interface IAppConfig {
  PORT: number;
  MONGO_URI: string;
  JWT_SECRET: string;
}

const getAppConfig = (): IAppConfig => {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
  const mongoUri = process.env.MONGO_URI || '';
  const jwtSecret = process.env.JWT_SECRET || 'meow';
  return {
    PORT: port,
    MONGO_URI: mongoUri,
    JWT_SECRET: jwtSecret,
  };
};

const AppConfig = getAppConfig();

logger.log('AppConfig:', AppConfig);

export default AppConfig;
