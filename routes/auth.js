// Реєстрація і вхід
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next); // ловимо помилки async-обробників

// Логін: 3–20 символів, лише літери (лат./укр.), цифри та _ — без HTML і пробілів
const USERNAME_RE = /^[a-zA-Z0-9_а-яА-ЯіІїЇєЄґҐ]{3,20}$/;

function makeToken(user) {
  return jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

/** POST /api/auth/register */
router.post("/register", wrap(async (req, res) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "");

  if (!USERNAME_RE.test(username)) {
    return res.status(400).json({ error: "Логін: 3–20 символів, лише літери, цифри та _" });
  }
  if (password.length < 4) return res.status(400).json({ error: "Пароль: мінімум 4 символи" });

  const exists = await User.findOne({ username });
  if (exists) return res.status(409).json({ error: "Такий логін уже зайнятий" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ username, passwordHash });
  res.json({ token: makeToken(user) });
}));

/** POST /api/auth/login */
router.post("/login", wrap(async (req, res) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "");

  const user = await User.findOne({ username });
  const hash = user && (user.passwordHash || user.password);   // підтримка старого поля password
  const ok = hash ? await bcrypt.compare(password, hash) : false;
  if (!ok) return res.status(401).json({ error: "Невірний логін або пароль" });

  res.json({ token: makeToken(user) });
}));

module.exports = router;