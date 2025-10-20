import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config(); // Загружает переменные из .env

const app = express();
app.use(express.json()); // Позволяет работать с JSON-запросами

// Подключение к MongoDB
mongoose.connect(process.env.MONGODB_URI!)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.log("❌ MongoDB error:", err));

// Пример маршрута
app.get("/", (_, res) => res.send("📘 BookSwap API running"));

// Запуск сервера
app.listen(process.env.PORT, () =>
  console.log(`🚀 Server running on port ${process.env.PORT}`)
);

import { connectDB } from "./config/db";
connectDB();

import userRoutes from "./routes/userRoutes";
app.use("/api/users", userRoutes);