// Крамниця: купівля і вибір косметики за ягоди (без реальних грошей і без ігрових переваг)
const express = require("express");
const User = require("../models/User");
const requireAuth = require("../middleware/auth");
const { SHOP_ITEMS } = require("../data/gameData");

const router = express.Router();
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

/** Товар належить користувачу, якщо він безкоштовний або куплений */
function owns(user, item) {
  return item.price === 0 || user.purchases.includes(item.id);
}

function shopView(user) {
  return {
    berries: user.berries,
    items: SHOP_ITEMS.map((item) => ({
      id: item.id,
      type: item.type,
      name: item.name,
      desc: item.desc,
      price: item.price,
      text: item.text || "",
      owned: owns(user, item),
      equipped: user.equipped[item.type] === item.id,
    })),
  };
}

/** GET /api/shop — товари з позначками «куплено» і «обрано» */
router.get("/", requireAuth, wrap(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: "Користувача не знайдено" });
  res.json(shopView(user));
}));

/** POST /api/shop/:id/buy — купити товар (одразу й обираємо його) */
router.post("/:id/buy", requireAuth, wrap(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: "Користувача не знайдено" });

  const item = SHOP_ITEMS.find((i) => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: "Такого товару немає" });
  if (owns(user, item)) return res.status(400).json({ error: "Цей товар уже твій" });
  if (user.berries < item.price) return res.status(400).json({ error: "Не вистачає ягід" });

  user.berries -= item.price;
  user.purchases.push(item.id);
  user.equipped[item.type] = item.id;
  await user.save();
  res.json(shopView(user));
}));

/** POST /api/shop/:id/equip — обрати вже свій товар */
router.post("/:id/equip", requireAuth, wrap(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: "Користувача не знайдено" });

  const item = SHOP_ITEMS.find((i) => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: "Такого товару немає" });
  if (!owns(user, item)) return res.status(400).json({ error: "Спочатку купи цей товар" });

  user.equipped[item.type] = item.id;
  await user.save();
  res.json(shopView(user));
}));

module.exports = router;