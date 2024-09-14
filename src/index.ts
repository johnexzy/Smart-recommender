import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
import express from "express";
import { Client } from "pg";
dotenv.config();

const apiKey = process.env.API_KEY as string;
const genAI = new GoogleGenerativeAI(apiKey);

const app = express();
app.use(express.json());

const client = new Client({
  connectionString: process.env.DATABASE_URL as string,
});
client.connect();


app.post("/embed", async (req, res) => {
  try {
    console.log("Embedding text:", req.body);
    const { text } = req.body;
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    const embedding = result.embedding;

    await client.query("INSERT INTO embeddings (text, vector) VALUES ($1, $2)", [
      text,
      JSON.stringify(embedding.values),
    ]);
    res.json({ text, embedding: embedding.values });
  } catch (error) {
    console.error("Error embedding text:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/similarity", async (req, res) => {
  const { vector } = req.body;
  const result = await client.query(
    "SELECT text, vector, (vector <-> $1::vector) AS distance FROM embeddings ORDER BY distance LIMIT 5",
    [JSON.stringify(vector)]
  );
  res.json(result.rows);
});

app.listen(9000, () => {
  console.log("Server is running on port 9000");
});

// run();
