import { Router } from "express";
import {
  register,
  login,
  refreshToken,
  logout,
  logoutAllSessions,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/refresh-token", refreshToken);
router.get("/logout", logout);
router.post("/logout-all", protect, logoutAllSessions);

export default router;
