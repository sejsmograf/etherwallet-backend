// src/routes/authRoutes.ts
import { Router } from "express";
import * as authController from "../controllers/authController";

const router = Router();

// POST /api/auth/register
router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);

export default router;
