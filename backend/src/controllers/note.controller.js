import Note from "../models/note.model.js";

// Create note
export const createNote = async (req, res) => {
  try {
    const { title, body, tags } = req.body;
    const note = await Note.create({
      title,
      body,
      tags,
      userId: req.user._id,
    });
    res.status(201).json(note);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all active notes (with search)
export const getNotes = async (req, res) => {
  try {
    const { search } = req.query;
    let query = { userId: req.user._id, isDeleted: false };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    const notes = await Note.find(query).sort({ updatedAt: -1 });
    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single note
export const getNoteById = async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isDeleted: false,
    });

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.status(200).json(note);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update note
export const updateNote = async (req, res) => {
  try {
    const { title, body, tags } = req.body;
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, isDeleted: false },
      { title, body, tags },
      { new: true, runValidators: true }
    );

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.status(200).json(note);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Soft delete note
export const softDeleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.status(200).json({ message: "Note moved to trash" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get trash
export const getTrash = async (req, res) => {
  try {
    const notes = await Note.find({
      userId: req.user._id,
      isDeleted: true,
    }).sort({ deletedAt: -1 });
    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Restore note
export const restoreNote = async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, isDeleted: true },
      { isDeleted: false, deletedAt: null },
      { new: true }
    );

    if (!note) {
      return res.status(404).json({ message: "Note not found in trash" });
    }

    res.status(200).json({ message: "Note restored successfully", note });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Permanent delete note
export const permanentDeleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
      isDeleted: true,
    });

    if (!note) {
      return res.status(404).json({ message: "Note not found in trash" });
    }

    res.status(200).json({ message: "Note permanently deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
