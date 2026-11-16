// Перевірка JWT-токена: пропускає далі лише авторизованих користувачів
const jwt = require("jsonwebtoken");

module.exports = function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";                    // "Bearer <токен>"
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Потрібно увійти" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);        // перевіряємо підпис і термін дії
    req.userId = payload.userId;                                       // id користувача для наступних обробників
    next();
  } catch {
    res.status(401).json({ error: "Сесія закінчилась, увійдіть ще раз" });
  }
};