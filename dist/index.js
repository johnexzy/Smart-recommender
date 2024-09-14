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
dotenv.config();
const apiKey = process.env.API_KEY;
const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
const app = (0, express_1.default)();
app.use(express_1.default.json());
const client = new pg_1.Client({
    connectionString: process.env.DATABASE_URL,
});
client.connect();
app.post("/embed", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Embedding text:", req.body);
        const { text } = req.body;
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const result = yield model.embedContent(text);
        const embedding = result.embedding;
        yield client.query("INSERT INTO embeddings (text, vector) VALUES ($1, $2)", [
            text,
            JSON.stringify(embedding.values),
        ]);
        res.json({ text, embedding: embedding.values });
    }
    catch (error) {
        console.error("Error embedding text:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
app.post("/similarity", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { vector } = req.body;
    const result = yield client.query("SELECT text, vector, (vector <-> $1::vector) AS distance FROM embeddings ORDER BY distance LIMIT 5", [JSON.stringify(vector)]);
    res.json(result.rows);
}));
app.listen(9000, () => {
    console.log("Server is running on port 9000");
});
// run();
