import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    refreshTokenHash: {
      type: String,
      required: true,
    },
    ip: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    revoked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const sessionModel = mongoose.model("Session", sessionSchema);
export default sessionModel;
