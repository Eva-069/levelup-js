// Перевірка коду користувача на сервері: запуск тестів в окремому контексті з обмеженням часу.
// Важливо: модуль vm — це не повна «пісочниця», тож цей підхід підходить для навчального проєкту,
// але не для публічного сервісу з невідомими користувачами.
const vm = require("vm");

const TIME_LIMIT_MS = 1000;   // 1 секунда на запуск коду і на кожен тест

function show(value) {
  // Рядок для показу результату (undefined теж показуємо зрозуміло)
  if (value === undefined) return "undefined";
  try { return JSON.stringify(value); } catch { return String(value); }
}

function runTests(code, fnName, tests) {
  if (typeof code !== "string" || !code.trim()) return { passed: false, error: "Код порожній", results: [] };
  if (code.length > 20000) return { passed: false, error: "Код занадто довгий", results: [] };

  const context = vm.createContext({});   // окремий «глобальний світ» без доступу до сервера

  try {
    // Виконуємо код і зберігаємо потрібну функцію в контексті
    vm.runInContext(
      `${code}\n;this.__fn = (typeof ${fnName} === "function") ? ${fnName} : null;`,
      context,
      { timeout: TIME_LIMIT_MS }
    );
  } catch (err) {
    return { passed: false, error: errorText(err), results: [] };
  }
  if (!context.__fn) return { passed: false, error: `Функцію ${fnName}(...) не знайдено. Перевір назву.`, results: [] };

  const results = tests.map((t) => {
    const call = `${fnName}(${t.args.map(show).join(", ")})`;
    try {
      // Аргументи передаємо як JSON прямо в код — так вони створюються всередині контексту
      vm.runInContext(`this.__res = this.__fn(...${JSON.stringify(t.args)});`, context, { timeout: TIME_LIMIT_MS });
      const actual = context.__res;
      return { call, actual: show(actual), expected: show(t.expected), pass: show(actual) === show(t.expected) };
    } catch (err) {
      return { call, actual: null, expected: show(t.expected), pass: false, error: errorText(err) };
    }
  });

  return { passed: results.every((r) => r.pass), results };
}

function errorText(err) {
  if (err && err.code === "ERR_SCRIPT_EXECUTION_TIMEOUT") {
    return "Код виконується занадто довго — можливо, нескінченний цикл";
  }
  return err && err.message ? err.message : String(err);
}

module.exports = { runTests };