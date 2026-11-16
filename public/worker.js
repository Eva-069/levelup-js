// Web Worker: запускає тести коду в окремому потоці.
// Якщо код зависне (нескінченний цикл), головна сторінка просто зупинить цей worker — і сайт не «замерзне».

function show(value) {
  // Рядок для показу результату (undefined теж показуємо зрозуміло)
  if (value === undefined) return "undefined";
  try { return JSON.stringify(value); } catch (e) { return String(value); }
}

self.onmessage = (event) => {
  const { code, fnName, tests } = event.data;

  // 1. Створюємо функцію з коду користувача
  let fn;
  try {
    const factory = new Function(code + "\nreturn typeof " + fnName + " === 'function' ? " + fnName + " : null;");
    fn = factory();
  } catch (err) {
    self.postMessage({ error: "Помилка в коді: " + err.message, results: [] });
    return;
  }
  if (!fn) {
    self.postMessage({ error: "Функцію " + fnName + "(...) не знайдено. Перевір назву.", results: [] });
    return;
  }

  // 2. Проганяємо кожен тест
  const results = tests.map((t) => {
    const call = fnName + "(" + t.args.map(show).join(", ") + ")";
    try {
      const args = JSON.parse(JSON.stringify(t.args));   // копія, щоб код не змінив дані тесту
      const actual = fn(...args);
      return { call, actual: show(actual), expected: show(t.expected), pass: show(actual) === show(t.expected) };
    } catch (err) {
      return { call, actual: null, expected: show(t.expected), pass: false, error: err.message };
    }
  });

  self.postMessage({ results });
};