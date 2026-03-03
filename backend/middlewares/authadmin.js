const jwt = require("jsonwebtoken");
const {
  JWT_SECRET,
  PLATFORM_MANAGER_EMAIL,
  PLATFORM_MANAGER_PASSWORD,
  PLATFORM_MANAGER_PASSKEY,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  ADMIN_PASSKEY,
} = require("../config/constants");

module.exports = async function authAdmin(req, res, next) {
  try {
    if (req.path === "/admin/login" || req.url === "/admin/login") {
      const { email, password, passKey, role } = req.body;
      const requestedRole = role === "platform_manager" ? "platform_manager" : "admin";

      const creds = requestedRole === "platform_manager"
        ? {
            email: PLATFORM_MANAGER_EMAIL,
            password: PLATFORM_MANAGER_PASSWORD,
            passKey: PLATFORM_MANAGER_PASSKEY,
          }
        : {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            passKey: ADMIN_PASSKEY,
          };

      if (email === creds.email && password === creds.password && passKey === creds.passKey) {
        const token = jwt.sign({ role: requestedRole }, JWT_SECRET, {
          expiresIn: "1h",
        });
        res.cookie("admin_token", token, {
          httpOnly: true,
          sameSite: "lax",
          secure: false,
          maxAge: 60 * 60 * 1000,
          path: "/",
        });
        const msg = requestedRole === "platform_manager" ? "Platform manager authenticated" : "Admin authenticated";
        return res.json({ message: msg, token, role: requestedRole });
      }

      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    const headerToken = req.header("Authorization")?.replace("Bearer ", "");
    const cookieToken = req.cookies?.admin_token;
    const token = headerToken || cookieToken;

    if (!token) {
      const err = new Error("Access Denied: No token provided");
      err.status = 401;
      return next(err);
    }

    const verified = jwt.verify(token, JWT_SECRET);
    if (verified.role !== "platform_manager" && verified.role !== "admin") {
      const err = new Error("Forbidden: Not an admin");
      err.status = 403;
      return next(err);
    }

    req.admin = verified;
    next();
  } catch (err) {
    const error = new Error("Invalid or expired token");
    error.status = 401;
    return next(error);
  }
};
