import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT) || 3000,

  db: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3306,
    name: process.env.DB_NAME || "brainclash",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "root123",
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10
  }
};