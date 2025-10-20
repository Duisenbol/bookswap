import { Router } from "express";
import { User } from "../models/User";

const router = Router();

// Получить всех пользователей
router.get("/", async (_, res) => {
  const users = await User.find();
  res.json(users);
});

// Получить профиль по email
router.get("/:email", async (req, res) => {
  const user = await User.findOne({ email: req.params.email });
  res.json(user);
});

export default router;