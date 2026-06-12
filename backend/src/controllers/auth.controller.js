import User from "../models/user.model.js";
import Session from "../models/session.model.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const generateTokens = async (userId, ip, userAgent) => {
  // Generate Refresh Token
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

  const session = await Session.create({
    user: userId,
    refreshTokenHash,
    ip,
    userAgent,
  });

  // Generate Access Token
  const accessToken = jwt.sign(
    { id: userId, sessionId: session._id },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  return { accessToken, refreshToken };
};

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const userExists = await User.findOne({ $or: [{ username }, { email }] });

    if (userExists) {
      return res.status(409).json({ message: "Username or Email already exists" });
    }

    const user = await User.create({ username, email, password });

    const { accessToken, refreshToken } = await generateTokens(
      user._id,
      req.ip,
      req.headers["user-agent"]
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      message: "User registered successfully",
      user: { id: user._id, username: user.username, email: user.email },
      accessToken,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const { accessToken, refreshToken } = await generateTokens(
      user._id,
      req.ip,
      req.headers["user-agent"]
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "User logged in successfully",
      user: { id: user._id, username: user.username, email: user.email },
      accessToken,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ message: "Refresh token not found" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const refreshTokenHash = crypto.createHash("sha256").update(token).digest("hex");
    
    const session = await Session.findOne({ refreshTokenHash, revoked: false });
    if (!session) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // Refresh token rotation
    const newRefreshToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    const newRefreshTokenHash = crypto.createHash("sha256").update(newRefreshToken).digest("hex");
    
    session.refreshTokenHash = newRefreshTokenHash;
    await session.save();

    const accessToken = jwt.sign(
      { id: decoded.id, sessionId: session._id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Access token refreshed successfully",
      accessToken,
    });
  } catch (error) {
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

export const logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      const refreshTokenHash = crypto.createHash("sha256").update(token).digest("hex");
      const session = await Session.findOne({ refreshTokenHash, revoked: false });
      if (session) {
        session.revoked = true;
        await session.save();
      }
    }
    res.clearCookie("refreshToken");
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const logoutAllSessions = async (req, res) => {
  try {
    // Requires authenticated user (req.user from middleware)
    await Session.updateMany({ user: req.user._id }, { revoked: true });
    res.clearCookie("refreshToken");
    res.status(200).json({ message: "Logged out from all sessions successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
