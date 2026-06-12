import rateLimit from "express-rate-limit";

// Limit to 30 requests per minute
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP or User to 30 requests per `window` (here, per minute)
  message: {
    message: "Too many requests from this IP/User, please try again after a minute",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req) => {
    // If user is authenticated, limit by user ID, otherwise by IP
    if (req.user && req.user._id) {
      return req.user._id.toString();
    }
    return req['ip'];
  },
});
