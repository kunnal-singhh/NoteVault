import { Router } from "express";
import {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  softDeleteNote,
  getTrash,
  restoreNote,
  permanentDeleteNote,
} from "../controllers/note.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

// All note routes require authentication
router.use(protect);

router.route("/")
  .get(getNotes)
  .post(createNote);

router.route("/trash")
  .get(getTrash);

router.route("/trash/:id")
  .put(restoreNote)
  .delete(permanentDeleteNote);

router.route("/:id")
  .get(getNoteById)
  .put(updateNote)
  .delete(softDeleteNote);

export default router;
