// Модель користувача: обліковий запис + весь ігровий прогрес
const mongoose = require("mongoose");

// Власна задача, яку користувач додає сам
const customQuestSchema = new mongoose.Schema(
  { id: String, title: String, desc: String, xp: Number },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String },          // хеш пароля (bcrypt)
    password: { type: String },              // старе поле з попередньої версії (якщо було) — лише для входу

    completedQuestIds: { type: [String], default: [] },  // id виконаних квестів
    customQuests: { type: [customQuestSchema], default: [] },
    xpBonus: { type: Number, default: 0 },   // бонусний XP (щоденний виклик, комбо)
    berries: { type: Number, default: 0 },   // ягоди — ігрова валюта для крамниці

    stars: { type: Map, of: Number, default: {} },      // id квесту → зірки (1–3)
    bestTimes: { type: Map, of: Number, default: {} },  // id квесту → найкращий час, мс
    hintsUsed: { type: Map, of: Number, default: {} },  // id квесту → скільки підказок відкрито
    activity: { type: Map, of: Number, default: {} },   // "РРРР-ММ-ДД" → XP, зароблений цього дня

    purchases: { type: [String], default: [] },          // куплені товари крамниці
    equipped: {
      frame: { type: String, default: "frame-none" },
      title: { type: String, default: "title-none" },
      theme: { type: String, default: "theme-karelia" },
    },

    streakCount: { type: Number, default: 0 },          // серія днів поспіль
    lastActiveDate: { type: String, default: "" },
    comboDate: { type: String, default: "" },           // комбо: 3 квести за день
    comboCount: { type: Number, default: 0 },
    comboClaimed: { type: Boolean, default: false },
    comboEverClaimed: { type: Boolean, default: false },

    dailyQuest: {
      date: { type: String, default: "" },
      questId: { type: String, default: "" },
      claimed: { type: Boolean, default: false },
    },
  },
  { timestamps: true }                                   // createdAt = «на платформі з…»
);

module.exports = mongoose.model("User", userSchema);