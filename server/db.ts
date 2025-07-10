import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

if (!process.env.DATABASE_USER || !process.env.DATABASE_PASSWORD || !process.env.DATABASE_NAME || !process.env.DATABASE_HOST || !process.env.DATABASE_PORT) {
  throw new Error("DATABASE environment variables are not defined");
}

const DATABASE_URL = `postgres://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`;

const client = postgres(DATABASE_URL, {
  max: 10,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  connect_timeout: 10,
  idle_timeout: 20,
});

console.log("Initializing PostgreSQL connection...");

client.unsafe("SELECT 1")
  .then(() => console.log("Successfully connected to PostgreSQL database"))
  .catch(err => console.error("Failed to connect to PostgreSQL database:", err));

export const db = drizzle(client);
export { client as sql };
