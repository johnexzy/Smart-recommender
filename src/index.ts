import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
import express from "express";
import { Client } from "pg";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
dotenv.config();

const apiKey = process.env.API_KEY as string;
const genAI = new GoogleGenerativeAI(apiKey);

const app = express();
app.use(express.json());

const client = new Client({
  connectionString: process.env.DATABASE_URL as string,
});
client.connect();

const authenticateToken = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string, (err, user) => {
    if (err) return res.sendStatus(403);
    (req as any).user = user; // Type assertion to avoid TypeScript error
    next();
  });
};

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await client.query("SELECT * FROM users WHERE name = $1", [
    username,
  ]);
  
  if (user.rows.length === 0)
    return res.status(400).json({ error: "User not found" });

  const validPassword = await bcrypt.compare(password, user.rows[0].password);
  if (!validPassword)
    return res.status(400).json({ error: "Invalid password" });

  const accessToken = jwt.sign(
    { userId: user.rows[0].user_id },
    process.env.ACCESS_TOKEN_SECRET as string,
    { expiresIn: "1h" }
  );
  res.json({ accessToken });
});

app.post("/embed", authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;
    const userId = (req as any).user.userId; // Extract userId from the authenticated token

    console.log("Embedding text:", req.body);
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    const embedding = result.embedding;

    await client.query(
      "INSERT INTO embeddings (user_id, text, vector) VALUES ($1, $2, $3)",
      [userId, text, JSON.stringify(embedding.values)]
    );
    res.json({ userId, text, embedding: embedding.values });
  } catch (error) {
    console.error("Error embedding text:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/similarity", authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    const targetEmbedding = result.embedding.values;

    const queryResult = await client.query(
      "SELECT text, vector, (vector <-> $1::vector) AS distance FROM embeddings ORDER BY distance LIMIT 5",
      [JSON.stringify(targetEmbedding)]
    );
    res.json(queryResult.rows);
  } catch (error) {
    console.error("Error calculating similarity:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/recommend", authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    const targetEmbedding = result.embedding.values;

    const queryResult = await client.query("SELECT text, vector FROM embeddings");
    const embeddings = queryResult.rows.map(row => ({
      text: row.text,
      embedding: JSON.parse(row.vector)
    }));

    const recommendations = embeddings
      .map(item => ({
        text: item.text,
        similarity: cosineSimilarity(targetEmbedding, item.embedding)
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5); // Limit to top 5 recommendations

    res.json(recommendations);
  } catch (error) {
    console.error("Error recommending texts:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/user", async (req, res) => {
  try {
    const { name, password, preferences } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4(); // Auto-generate userId
    await client.query(
      "INSERT INTO users (user_id, name, password, preferences) VALUES ($1, $2, $3, $4)",
      [userId, name, hashedPassword, JSON.stringify(preferences)]
    );
    res.json({ userId, name, preferences });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(9000, () => {
  console.log("Server is running on port 9000");
});
