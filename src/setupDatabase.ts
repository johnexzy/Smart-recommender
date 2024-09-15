import { Client } from "pg";
import * as dotenv from "dotenv";
dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function setupDatabase() {
  try {
    await client.connect();
    console.log("Connected to the database successfully");

    await client.query("CREATE EXTENSION IF NOT EXISTS vector");
    await client.query(`
            CREATE TABLE IF NOT EXISTS embeddings (
                id SERIAL PRIMARY KEY,
                text TEXT,
                vector VECTOR(768) -- Adjust the dimension based on your model
            )
        `);
    await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                user_id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                password VARCHAR(255) NOT NULL,
                preferences JSONB
            )
        `);
    console.log("Database setup complete");
  } catch (err) {
    console.error("Error setting up database:", err);
  } finally {
    await client.end();
  }
}

setupDatabase().catch((err) => console.error("Unexpected error:", err));
