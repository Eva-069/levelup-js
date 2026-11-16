// Квести: головні дані, підказки, перевірка рішень на сервері, власні задачі, рейтинг
const express = require("express");
const User = require("../models/User");
const requireAuth = require("../middleware/auth");
const { LEVELS, CHAPTERS, SECRET_QUEST } = require("../data/gameData");
const { runTests } = require("../utils/runTests");
const P = require("../utils/progress");

const router = express.Router();
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next); // помилки async → обробник у server.js

const MAX_CUSTOM = 10;        // максимум власних задач
const MAX_CUSTOM_XP = 20;     // максимум XP за власну задачу (щоб не «накручувати» рейтинг)

/** Квест для клієнта: без правильної відповіді квізу і без невідкритих підказок */
function publicQuest(q, user, chapterId) {
  const used = user.hintsUsed.get(q.id) || 0;
  return {
    id: q.id,
    chapterId,
    title: q.title,
    desc: q.desc,
    type: q.type,
    xp: q.xp,
    boss: !!q.boss,
    secret: !!q.secret,
    prompt: q.prompt,
    starter: q.starter || "",
    fnName: q.fnName || null,
    tests: q.type === "code" ? q.tests : [],
    options: q.type === "quiz" ? q.options : [],
    hintsTotal: (q.hints || []).length,
    hintsUsed: used,
    hintsShown: (q.hints || []).slice(0, used),   // уже відкриті підказки
    done: user.completedQuestIds.includes(q.id),
    locked: !P.isQuestUnlocked(user, q.id),
    stars: user.stars.get(q.id) || 0,
    bestTime: user.bestTimes.get(q.id) || null,
  };
}

/** Щоденний виклик: одна відкрита задача (не бос), спершу — ще не виконані */
function ensureDailyQuest(user) {
  const today = P.todayStr();
  if (user.dailyQuest && user.dailyQuest.date === today) return;

  const open = CHAPTERS.flatMap((ch) => ch.quests)
    .filter((q) => !q.boss && P.isQuestUnlocked(user, q.id));
  const notDone = open.filter((q) => !user.completedQuestIds.includes(q.id));
  const pool = notDone.length ? notDone : open;

  // Детермінований «випадковий» вибір: однаковий протягом дня для одного користувача
  const str = user.username + today;
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) % 1000000007;
  user.dailyQuest = { date: today, questId: pool[hash % pool.length].id, claimed: false };
}

/** GET /api/quests — усі дані для головного екрана */
router.get("/", requireAuth, wrap(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: "Користувача не знайдено" });

  ensureDailyQuest(user);
  await user.save();

  const xp = P.computeXp(user);
  const level = P.currentLevel(xp);
  const next = P.nextLevel(level);

  // Глави з квестами і прогресом
  const chapters = CHAPTERS.map((ch, idx) => {
    const quests = ch.quests.map((q) => publicQuest(q, user, ch.id));
    return {
      id: ch.id,
      number: idx + 1,
      title: ch.title,
      topic: ch.topic,
      desc: ch.desc,
      unlocked: P.isChapterUnlocked(user, idx),
      done: quests.filter((q) => q.done).length,
      total: quests.length,
      stars: quests.reduce((s, q) => s + q.stars, 0),
      maxStars: quests.length * 3,
      bossDone: quests[quests.length - 1].done,
      quests,
    };
  });

  const secret = P.isSecretVisible(user) ? publicQuest(SECRET_QUEST, user, "secret") : null;

  const customQuests = user.customQuests.map((q) => ({
    id: q.id, title: q.title, xp: q.xp, done: user.completedQuestIds.includes(q.id),
  }));

  // Щоденний виклик
  const dailyQuest = P.findQuest(user.dailyQuest.questId);
  const dailyChapter = CHAPTERS.find((ch) => ch.quests.some((q) => q.id === user.dailyQuest.questId));
  const daily = dailyQuest
    ? {
        questId: dailyQuest.id,
        title: dailyQuest.title,
        chapter: dailyChapter ? dailyChapter.title : "",
        xp: dailyQuest.xp,
        bonusXp: Math.round(dailyQuest.xp * 0.5),
        bonusBerries: 10,
        claimed: user.dailyQuest.claimed,
      }
    : null;

  // Календар активності: останні 84 дні (12 тижнів)
  const activity = [];
  for (let i = 83; i >= 0; i--) {
    const date = P.daysAgoStr(i);
    activity.push({ date, xp: user.activity.get(date) || 0 });
  }

  const allQuests = [...chapters.flatMap((c) => c.quests), ...(secret ? [secret] : [])];
  const completedList = allQuests.filter((q) => q.done).map((q) => ({ title: q.title, xp: q.xp, stars: q.stars }))
    .concat(customQuests.filter((q) => q.done).map((q) => ({ title: q.title, xp: q.xp, stars: 0 })));

  res.json({
    username: user.username,
    memberSince: user.createdAt,
    xp,
    level: level.name,
    next: next ? { name: next.name, xp: next.xp } : null,
    levelFloor: level.xp,
    levels: LEVELS,
    berries: user.berries,
    streak: user.streakCount,
    equipped: P.equippedView(user),
    chapters,
    secret,
    customQuests,
    badges: P.computeBadges(user, xp),
    daily,
    activity,
    completedList,
    stats: {
      questsDone: allQuests.filter((q) => q.done).length,
      questsTotal: allQuests.length,
      stars: allQuests.reduce((s, q) => s + q.stars, 0),
      maxStars: allQuests.length * 3,
    },
  });
}));

/** POST /api/quests/:id/hint — відкрити наступну підказку (кожна підказка мінус одна зірка) */
router.post("/:id/hint", requireAuth, wrap(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: "Користувача не знайдено" });

  const quest = P.findQuest(req.params.id);
  if (!quest) return res.status(404).json({ error: "Такого квесту не існує" });
  if (!P.isQuestUnlocked(user, quest.id)) return res.status(403).json({ error: "Квест ще закритий" });

  const used = user.hintsUsed.get(quest.id) || 0;
  if (used >= quest.hints.length) return res.status(400).json({ error: "Підказок більше немає" });

  user.hintsUsed.set(quest.id, used + 1);
  await user.save();
  res.json({ hint: quest.hints[used], hintsUsed: used + 1, hintsTotal: quest.hints.length });
}));

/** POST /api/quests/:id/submit — сервер сам перевіряє рішення і нараховує нагороди */
router.post("/:id/submit", requireAuth, wrap(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: "Користувача не знайдено" });

  const quest = P.findQuest(req.params.id);
  if (!quest) return res.status(404).json({ error: "Такого квесту не існує" });
  if (!P.isQuestUnlocked(user, quest.id)) return res.status(403).json({ error: "Квест ще закритий" });

  // 1. Перевірка відповіді
  let check;
  if (quest.type === "quiz") {
    const answer = Number(req.body.answer);
    check = { passed: answer === quest.correct, results: [] };
  } else {
    check = runTests(req.body.code, quest.fnName, quest.tests);
  }
  if (!check.passed) return res.json({ passed: false, error: check.error || null, results: check.results });

  // 2. Нагороди
  const today = P.todayStr();
  const firstTime = !user.completedQuestIds.includes(quest.id);
  const hints = user.hintsUsed.get(quest.id) || 0;
  let xpGain = 0;
  let berriesGain = 0;
  let comboBonus = null;
  let dailyBonus = null;

  if (firstTime) {
    const stars = Math.max(1, 3 - hints);              // 3 без підказок, 2 з однією, 1 з двома
    user.completedQuestIds.push(quest.id);
    user.stars.set(quest.id, stars);
    xpGain = quest.xp;
    berriesGain = stars * 5 + (quest.boss ? 20 : 0);    // хранитель дає ще 20 ягід
    P.updateStreak(user);
    comboBonus = P.updateCombo(user);
  }

  // Рекорд часу (приймаємо розумні значення: від 1 секунди до 3 годин)
  const timeMs = Math.round(Number(req.body.timeMs));
  let newRecord = false;
  if (timeMs >= 1000 && timeMs <= 3 * 60 * 60 * 1000) {
    const best = user.bestTimes.get(quest.id);
    if (!best || timeMs < best) {
      user.bestTimes.set(quest.id, timeMs);
      newRecord = !!best;                                 // «новий рекорд» — лише якщо був попередній
    }
  }

  // Щоденний виклик: бонус, якщо розв'язано саме сьогоднішню задачу
  if (user.dailyQuest.date === today && user.dailyQuest.questId === quest.id && !user.dailyQuest.claimed) {
    const bonusXp = Math.round(quest.xp * 0.5);
    user.dailyQuest.claimed = true;
    user.xpBonus = (user.xpBonus || 0) + bonusXp;
    berriesGain += 10;
    dailyBonus = { xp: bonusXp, berries: 10 };
    if (!firstTime) P.updateStreak(user);
  }

  user.berries += berriesGain;
  P.addActivity(user, xpGain + (comboBonus || 0) + (dailyBonus ? dailyBonus.xp : 0));
  await user.save();

  res.json({
    passed: true,
    results: check.results,
    firstTime,
    stars: user.stars.get(quest.id) || 0,
    xpGain,
    berriesGain,
    comboBonus,
    dailyBonus,
    newRecord,
    bestTime: user.bestTimes.get(quest.id) || null,
    boss: !!quest.boss,
  });
}));

/** POST /api/quests/custom — додати власну задачу */
router.post("/custom", requireAuth, wrap(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: "Користувача не знайдено" });

  const title = String(req.body.title || "").trim();
  if (!title) return res.status(400).json({ error: "Вкажіть назву завдання" });
  if (title.length > 60) return res.status(400).json({ error: "Назва занадто довга" });
  if (user.customQuests.length >= MAX_CUSTOM) return res.status(400).json({ error: `Максимум ${MAX_CUSTOM} власних задач` });

  const xp = Math.max(1, Math.min(MAX_CUSTOM_XP, Math.round(Number(req.body.xp)) || 10));
  const id = "custom-" + Date.now();
  user.customQuests.push({ id, title, desc: "Власне завдання", xp });
  await user.save();
  res.json({ id });
}));

/** POST /api/quests/custom/:id/toggle — позначити/зняти позначку (лише для власних задач) */
router.post("/custom/:id/toggle", requireAuth, wrap(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: "Користувача не знайдено" });

  const quest = user.customQuests.find((q) => q.id === req.params.id);
  if (!quest) return res.status(404).json({ error: "Такої задачі немає" });

  const pos = user.completedQuestIds.indexOf(quest.id);
  let comboBonus = null;
  if (pos >= 0) {
    user.completedQuestIds.splice(pos, 1);
  } else {
    user.completedQuestIds.push(quest.id);
    P.updateStreak(user);
    comboBonus = P.updateCombo(user);
    P.addActivity(user, quest.xp + (comboBonus || 0));
  }
  await user.save();
  res.json({ done: pos < 0, comboBonus });
}));

/** DELETE /api/quests/custom/:id — видалити власну задачу */
router.delete("/custom/:id", requireAuth, wrap(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: "Користувача не знайдено" });

  user.customQuests = user.customQuests.filter((q) => q.id !== req.params.id);
  user.completedQuestIds = user.completedQuestIds.filter((id) => id !== req.params.id);
  await user.save();
  res.json({ ok: true });
}));

/** GET /api/quests/leaderboard?period=week|all — рейтинг гравців */
router.get("/leaderboard", requireAuth, wrap(async (req, res) => {
  const period = req.query.period === "week" ? "week" : "all";
  const users = await User.find({});
  const rows = users
    .map((u) => {
      const total = P.computeXp(u);
      const eq = P.equippedView(u);
      return {
        username: u.username,
        xp: period === "week" ? P.weeklyXp(u) : total,
        level: P.currentLevel(total).name,
        title: eq.title,
        frame: eq.frame,
      };
    })
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 20);
  res.json(rows);
}));

module.exports = router;