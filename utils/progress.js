// Спільні функції прогресу: дати, XP, рівні, серія днів, комбо, блокування квестів, досягнення
const { LEVELS, CHAPTERS, ALL_QUESTS, SECRET_QUEST, BADGES, SHOP_ITEMS } = require("../data/gameData");

/** Дата у форматі РРРР-ММ-ДД (за місцевим часом сервера) */
function todayStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Дата n днів тому */
function daysAgoStr(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return todayStr(d);
}

/** Загальний XP: сума XP виконаних квестів + бонуси */
function computeXp(user) {
  const done = new Set(user.completedQuestIds);
  const all = [...ALL_QUESTS, SECRET_QUEST, ...user.customQuests];
  const base = all.filter((q) => done.has(q.id)).reduce((sum, q) => sum + q.xp, 0);
  return base + (user.xpBonus || 0);
}

function currentLevel(xp) {
  let level = LEVELS[0];
  for (const l of LEVELS) if (xp >= l.xp) level = l;
  return level;
}

function nextLevel(level) {
  const idx = LEVELS.findIndex((l) => l.name === level.name);
  return LEVELS[idx + 1] || null;
}

/** Серія днів поспіль: +1, якщо вчора була активність, інакше починаємо з 1 */
function updateStreak(user) {
  const today = todayStr();
  if (user.lastActiveDate === today) return;
  user.streakCount = user.lastActiveDate === daysAgoStr(1) ? user.streakCount + 1 : 1;
  user.lastActiveDate = today;
}

/** Комбо: 3 квести за день → +15 XP один раз на день. Повертає бонус або null */
function updateCombo(user) {
  const today = todayStr();
  if (user.comboDate !== today) {
    user.comboDate = today;
    user.comboCount = 0;
    user.comboClaimed = false;
  }
  user.comboCount += 1;
  if (user.comboCount >= 3 && !user.comboClaimed) {
    user.comboClaimed = true;
    user.comboEverClaimed = true;
    user.xpBonus = (user.xpBonus || 0) + 15;
    return 15;
  }
  return null;
}

/** Записуємо зароблений сьогодні XP — для календаря активності і тижневого рейтингу */
function addActivity(user, xp) {
  if (!xp || xp <= 0) return;
  const key = todayStr();
  user.activity.set(key, (user.activity.get(key) || 0) + xp);
}

/** XP за останні 7 днів */
function weeklyXp(user) {
  let sum = 0;
  for (let i = 0; i < 7; i++) sum += user.activity.get(daysAgoStr(i)) || 0;
  return sum;
}

/** Глава відкрита, якщо це перша глава або здолано хранителя попередньої */
function isChapterUnlocked(user, chapterIndex) {
  if (chapterIndex === 0) return true;
  const prev = CHAPTERS[chapterIndex - 1];
  return user.completedQuestIds.includes(prev.quests[prev.quests.length - 1].id);
}

/** Таємний квест видно після фінального хранителя */
function isSecretVisible(user) {
  return user.completedQuestIds.includes("boss-summit");
}

/** Квест відкритий: глава відкрита і попередній квест у главі виконано */
function isQuestUnlocked(user, questId) {
  if (questId === SECRET_QUEST.id) return isSecretVisible(user);
  for (let ci = 0; ci < CHAPTERS.length; ci++) {
    const qi = CHAPTERS[ci].quests.findIndex((q) => q.id === questId);
    if (qi === -1) continue;
    if (!isChapterUnlocked(user, ci)) return false;
    return qi === 0 || user.completedQuestIds.includes(CHAPTERS[ci].quests[qi - 1].id);
  }
  return false;
}

/** Знайти квест глави або таємний квест за id */
function findQuest(questId) {
  if (questId === SECRET_QUEST.id) return SECRET_QUEST;
  return ALL_QUESTS.find((q) => q.id === questId) || null;
}

/** Розраховуємо стан для досягнень і повертаємо список з позначкою unlocked */
function computeBadges(user, xp) {
  const starValues = [...user.stars.values()];
  const state = {
    xp,
    doneCount: user.completedQuestIds.length,
    completed: new Set(user.completedQuestIds),
    streak: user.streakCount,
    comboEverClaimed: user.comboEverClaimed,
    threeStars: starValues.filter((s) => s === 3).length,
    fastSolve: [...user.bestTimes.values()].some((ms) => ms < 60000),
    purchases: user.purchases.length,
  };
  return BADGES.map((b) => ({ id: b.id, name: b.name, desc: b.desc, icon: b.icon, unlocked: b.check(state) }));
}

/** Що зараз надіто: рамка і текст титулу */
function equippedView(user) {
  const titleItem = SHOP_ITEMS.find((i) => i.id === user.equipped.title);
  return {
    frame: user.equipped.frame || "frame-none",
    title: titleItem ? titleItem.text : "",
    theme: user.equipped.theme || "theme-karelia",
  };
}

module.exports = {
  todayStr, daysAgoStr, computeXp, currentLevel, nextLevel, updateStreak, updateCombo,
  addActivity, weeklyXp, isChapterUnlocked, isSecretVisible, isQuestUnlocked, findQuest,
  computeBadges, equippedView,
};