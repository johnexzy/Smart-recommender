"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const generative_ai_1 = require("@google/generative-ai");
const dotenv = __importStar(require("dotenv"));
const express_1 = __importDefault(require("express"));
const pg_1 = require("pg");
const uuid_1 = require("uuid");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const multer_1 = __importDefault(require("multer"));
dotenv.config();
const apiKey = process.env.API_KEY;
const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
const app = (0, express_1.default)();
app.use(express_1.default.json());
const client = new pg_1.Client({
    connectionString: process.env.DATABASE_URL,
});
client.connect();
// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (token == null)
        return res.sendStatus(401);
    jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err)
            return res.sendStatus(403);
        req.user = user; // Type assertion to avoid TypeScript error
        next();
    });
};
// Function to calculate cosine similarity between two vectors
function cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
}
const upload = (0, multer_1.default)();
// Endpoint for user login
app.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    const user = yield client.query("SELECT * FROM users WHERE name = $1", [
        username,
    ]);
    if (user.rows.length === 0)
        return res.status(400).json({ error: "User not found" });
    const validPassword = yield bcrypt_1.default.compare(password, user.rows[0].password);
    if (!validPassword)
        return res.status(400).json({ error: "Invalid password" });
    const accessToken = jsonwebtoken_1.default.sign({ userId: user.rows[0].user_id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" });
    res.json({ accessToken });
}));
// Endpoint to embed text and store the embedding
app.post("/embed", authenticateToken, upload.none(), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { text } = req.body;
        const userId = req.user.userId; // Extract userId from the authenticated token
        console.log("Embedding text:", req.body);
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const result = yield model.embedContent(text);
        const embedding = result.embedding;
        yield client.query("INSERT INTO embeddings (user_id, text, vector) VALUES ($1, $2, $3)", [userId, text, JSON.stringify(embedding.values)]);
        res.json({ userId, text, embedding: embedding.values });
    }
    catch (error) {
        console.error("Error embedding text:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
// Endpoint to calculate similarity between input text and stored embeddings
app.post("/similarity", authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { text } = req.body;
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const result = yield model.embedContent(text);
        const targetEmbedding = result.embedding.values;
        const queryResult = yield client.query("SELECT text, vector, (vector <-> $1::vector) AS distance FROM embeddings ORDER BY distance LIMIT 5", [JSON.stringify(targetEmbedding)]);
        res.json(queryResult.rows);
    }
    catch (error) {
        console.error("Error calculating similarity:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
// Endpoint to recommend similar texts based on input text
app.post("/recommend", authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { text } = req.body;
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const result = yield model.embedContent(text);
        const targetEmbedding = result.embedding.values;
        const queryResult = yield client.query("SELECT text, vector, (vector <-> $1::vector) AS distance FROM embeddings ORDER BY distance LIMIT 5", [JSON.stringify(targetEmbedding)]);
        const recommendations = queryResult.rows.map(row => ({
            text: row.text,
            similarity: 1 - row.distance // Assuming distance is normalized, convert to similarity
        }));
        res.json(recommendations);
    }
    catch (error) {
        console.error("Error recommending texts:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
// Endpoint to create a new user
app.post("/user", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, password, preferences } = req.body;
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        const userId = (0, uuid_1.v4)(); // Auto-generate userId
        yield client.query("INSERT INTO users (user_id, name, password, preferences) VALUES ($1, $2, $3, $4)", [userId, name, hashedPassword, JSON.stringify(preferences)]);
        res.json({ userId, name, preferences });
    }
    catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
// Start the server
app.listen(9000, () => {
    console.log("Server is running on port 9000");
});
