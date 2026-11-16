// Точка входу: підключення до MongoDB, API та статичні файли фронтенду
require("dotenv").config();                         // читаємо змінні з файлу .env
const path = require("path");                       // для шляху до папки public
const express = require("express");
const mongoose = require("mongoose");

const authRoutes = require("./routes/auth");        // реєстрація і вхід
const questRoutes = require("./routes/quests");     // квести, прогрес, рейтинг
const shopRoutes = require("./routes/shop");        // крамниця за ягоди

const app = express();
app.use(express.json({ limit: "50kb" }));           // приймаємо JSON (код квесту — невеликий)
app.use(express.static(path.join(__dirname, "public"))); // віддаємо index.html, style.css, app.js

app.use("/api/auth", authRoutes);
app.use("/api/quests", questRoutes);
app.use("/api/shop", shopRoutes);

// Невідомий маршрут API → 404 у форматі JSON
app.use("/api", (req, res) => res.status(404).json({ error: "Не знайдено" }));

// Будь-яка необроблена помилка сервера → 500, щоб застосунок не падав
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Помилка сервера" });
});

const PORT = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`Сервер працює: http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("Не вдалося підключитися до MongoDB:", err.message);
    process.exit(1);
  });