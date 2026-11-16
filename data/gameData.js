// Ігрові дані «Рівнів складності»: рівні, глави-локації, квести, досягнення, крамниця.
// Квести — реальні задачі з тестами. Підказки наводять на думку, але не дають готового рішення.

const LEVELS = [
  { name: "Стажер", xp: 0 },
  { name: "Junior JS", xp: 100 },
  { name: "JS-розробник", xp: 250 },
  { name: "Middle JS", xp: 400 },
  { name: "Senior JS", xp: 550 },
  { name: "Tech Lead", xp: 700 },
];

// Глави — це локації на стежці. Остання задача кожної глави — хранитель (бос).
// Наступна глава відкривається, коли здолано хранителя попередньої.
const CHAPTERS = [
  {
    id: "uzlissia",
    title: "Узлісся",
    topic: "Основи: типи і функції",
    desc: "Початок стежки. Ліс ще світлий, а задачі — прості.",
    quests: [
      {
        id: "types", title: "Типи даних", xp: 10, type: "code", fnName: "describeType",
        desc: "Визнач тип значення",
        prompt: "Напиши функцію describeType(value), яка визначає тип переданого значення (typeof) і повертає його українською: 'число', 'рядок' або 'логічне'.",
        starter: "function describeType(value) {\n  // твій код тут\n}",
        tests: [
          { args: [5], expected: "число" },
          { args: ["привіт"], expected: "рядок" },
          { args: [true], expected: "логічне" },
        ],
        hints: [
          "typeof value поверне рядок з англійською назвою типу — наприклад 'number'.",
          "Порівняй результат typeof з 'number', 'string', 'boolean' і поверни відповідний український варіант.",
        ],
      },
      {
        id: "funcs", title: "Функції", xp: 15, type: "code", fnName: "sum3",
        desc: "Функція для трьох чисел",
        prompt: "Напиши функцію sum3(a, b, c), яка повертає суму трьох переданих чисел.",
        starter: "function sum3(a, b, c) {\n  // твій код тут\n}",
        tests: [
          { args: [1, 2, 3], expected: 6 },
          { args: [10, -5, 5], expected: 10 },
          { args: [0, 0, 0], expected: 0 },
        ],
        hints: [
          "Функція приймає три параметри — просто склади їх.",
          "Не забудь ключове слово return, інакше результат нікуди не повернеться.",
        ],
      },
      {
        id: "q-typeof-null", title: "Підступний typeof", xp: 10, type: "quiz",
        desc: "Питання про типи",
        prompt: "Що поверне вираз typeof null?",
        options: ["'undefined'", "'object'", "'null'", "'boolean'"],
        correct: 1,
        hints: [
          "Це відома історична особливість JavaScript, яку так і не виправили.",
          "Відповідь — не 'null', хоча так здається логічним.",
        ],
      },
      {
        id: "boss-uzlissia", title: "Хранитель узлісся", xp: 40, type: "code", fnName: "average", boss: true,
        desc: "Виправ зламаний калькулятор",
        prompt: "Функція average(a, b, c) має повертати середнє арифметичне трьох чисел, але рахує неправильно. Знайди і виправ помилку.",
        starter: "function average(a, b, c) {\n  return a + b + c / 3\n}",
        tests: [
          { args: [3, 3, 3], expected: 3 },
          { args: [1, 2, 3], expected: 2 },
          { args: [0, 0, 9], expected: 3 },
        ],
        hints: [
          "Згадай пріоритет операторів: ділення виконується раніше за додавання.",
          "Яку частину виразу треба взяти в дужки, щоб спочатку додати, а потім поділити?",
        ],
      },
    ],
  },
  {
    id: "labyrinth",
    title: "Лабіринт умов",
    topic: "Умовні оператори",
    desc: "Кам'яний лабіринт серед сосон. Лише правильні рішення відкривають прохід.",
    quests: [
      {
        id: "q-compare", title: "Просте запитання", xp: 10, type: "quiz",
        desc: "Результат порівняння",
        prompt: "Що виведе console.log(5 > 3);?",
        options: ["5 > 3", "false", "true", "undefined"],
        correct: 2,
        hints: [
          "Оператор > порівнює два значення і завжди повертає логічне значення — true або false.",
          "5 дійсно більше за 3 — подумай, яким буде результат цього порівняння.",
        ],
      },
      {
        id: "q-if-syntax", title: "Правильний синтаксис", xp: 10, type: "quiz",
        desc: "Знайди правильний if",
        prompt: "Який варіант написаний із правильним синтаксисом умовного оператора в JavaScript?",
        options: [
          "if age >= 18 {\n  console.log('Дорослий');\n} else {\n  console.log('Дитина');\n}",
          "if (age >= 18) then {\n  console.log('Дорослий');\n} else {\n  console.log('Дитина');\n}",
          "if (age >= 18):\n  console.log('Дорослий')\nelse:\n  console.log('Дитина')",
          "if (age >= 18) {\n  console.log('Дорослий');\n} else {\n  console.log('Дитина');\n}",
        ],
        correct: 3,
        hints: [
          "В JavaScript умова обов'язково береться в круглі дужки ( ).",
          "Ключового слова then і двокрапок : (як у Python) у синтаксисі JS немає.",
        ],
      },
      {
        id: "is-even", title: "Парне чи непарне", xp: 20, type: "code", fnName: "isEven",
        desc: "Перевір парність числа",
        prompt: "Напиши функцію isEven(n), яка повертає рядок 'парне', якщо число парне, і 'непарне' — якщо ні.",
        starter: "function isEven(n) {\n  // твій код тут\n}",
        tests: [
          { args: [4], expected: "парне" },
          { args: [7], expected: "непарне" },
          { args: [0], expected: "парне" },
          { args: [-3], expected: "непарне" },
        ],
        hints: [
          "Залишок від ділення на 2 (оператор %) допоможе визначити парність.",
          "Обгорни перевірку в if / else і поверни (return) потрібний рядок з кожної гілки.",
        ],
      },
      {
        id: "is-positive", title: "Знайди помилку", xp: 20, type: "code", fnName: "isPositive",
        desc: "Функція завжди каже «нуль»",
        prompt: "У коді нижче є помилка — функція для будь-якого числа повертає 'нуль'. Знайди і виправ її.",
        starter: "function isPositive(n) {\n  if (n = 0) {\n    return 'нуль';\n  } else if (n > 0) {\n    return 'додатне';\n  } else {\n    return \"від'ємне\";\n  }\n}",
        tests: [
          { args: [0], expected: "нуль" },
          { args: [5], expected: "додатне" },
          { args: [-5], expected: "від'ємне" },
        ],
        hints: [
          "Уважно подивись на перше порівняння в дужках — це справді порівняння, чи присвоєння значення?",
          "Для порівняння значень використовується === (або ==), а не одинарне =.",
        ],
      },
      {
        id: "boss-labyrinth", title: "Страж лабіринту", xp: 45, type: "code", fnName: "grade", boss: true,
        desc: "Оцінка через switch",
        prompt: "Напиши функцію grade(score), яка через switch повертає оцінку: 90 і більше — 'A', 80–89 — 'B', 70–79 — 'C', 60–69 — 'D', менше 60 — 'F'.",
        starter: "function grade(score) {\n  // твій код тут\n}",
        tests: [
          { args: [95], expected: "A" },
          { args: [82], expected: "B" },
          { args: [71], expected: "C" },
          { args: [65], expected: "D" },
          { args: [40], expected: "F" },
        ],
        hints: [
          "Звичайний switch(score) перевіряє точний збіг значення, а тут потрібні діапазони.",
          "Спробуй switch (true): тоді кожен case може бути умовою, наприклад case score >= 90.",
        ],
      },
    ],
  },
  {
    id: "river",
    title: "Річка циклів",
    topic: "Цикли",
    desc: "Річка петляє між пагорбами — як цикл, що повторює дію знову і знову.",
    quests: [
      {
        id: "sum-to", title: "Сума до n", xp: 15, type: "code", fnName: "sumTo",
        desc: "Склади числа від 1 до n",
        prompt: "Напиши функцію sumTo(n), яка повертає суму всіх цілих чисел від 1 до n. Для n = 0 результат — 0.",
        starter: "function sumTo(n) {\n  // твій код тут\n}",
        tests: [
          { args: [5], expected: 15 },
          { args: [1], expected: 1 },
          { args: [0], expected: 0 },
        ],
        hints: [
          "Створи змінну для суми зі значенням 0 і цикл for від 1 до n включно.",
          "На кожному кроці додавай поточне число до суми через +=.",
        ],
      },
      {
        id: "count-char", title: "Лічильник символів", xp: 20, type: "code", fnName: "countChar",
        desc: "Скільки разів трапляється символ",
        prompt: "Напиши функцію countChar(str, ch), яка повертає, скільки разів символ ch трапляється в рядку str.",
        starter: "function countChar(str, ch) {\n  // твій код тут\n}",
        tests: [
          { args: ["банан", "а"], expected: 2 },
          { args: ["ліс", "x"], expected: 0 },
          { args: ["ааа", "а"], expected: 3 },
        ],
        hints: [
          "Рядок можна перебрати циклом for так само, як масив: str[i] — це i-й символ.",
          "Збільшуй лічильник, коли str[i] === ch.",
        ],
      },
      {
        id: "q-loop-count", title: "Скільки разів?", xp: 10, type: "quiz",
        desc: "Питання про цикл for",
        prompt: "Скільки разів виконається тіло циклу for (let i = 0; i < 3; i++) { ... }?",
        options: ["3 рази", "2 рази", "4 рази", "Жодного разу"],
        correct: 0,
        hints: [
          "Випиши значення i по черзі: з якого числа починаємо і коли умова i < 3 стане хибною?",
          "Перевір кожне значення: i = 0, i = 1, i = 2, i = 3 — для якого з них умова вже не виконується?",
        ],
      },
      {
        id: "boss", title: "Зламаний кошик", xp: 45, type: "code", fnName: "calculateTotal", boss: true,
        desc: "Дві помилки в циклі",
        prompt: "У функції calculateTotal(prices) є дві помилки — вона неправильно рахує суму цін у масиві. Знайди і виправ обидві.",
        starter: "function calculateTotal(prices) {\n  let total = 0\n  for (let i = 0; i < prices.length - 1; i++) {\n    total = prices[i]\n  }\n  return total\n}",
        tests: [
          { args: [[10, 20, 30]], expected: 60 },
          { args: [[5]], expected: 5 },
          { args: [[]], expected: 0 },
        ],
        hints: [
          "Уважно подивись на межі циклу — чи враховується останній елемент масиву?",
          "Як накопичується сума на кожному кроці — додаванням (+=) чи перезаписом (=)?",
        ],
      },
    ],
  },
  {
    id: "lakes",
    title: "Озерний край",
    topic: "Масиви",
    desc: "Тисячі озер, як елементи масиву. Час навчитися їх перебирати й фільтрувати.",
    quests: [
      {
        id: "arrays", title: "Парні числа", xp: 20, type: "code", fnName: "sumEven",
        desc: "Сума парних чисел масиву",
        prompt: "Напиши функцію sumEven(arr), яка повертає суму лише парних чисел масиву.",
        starter: "function sumEven(arr) {\n  // твій код тут\n}",
        tests: [
          { args: [[1, 2, 3, 4]], expected: 6 },
          { args: [[5, 7, 9]], expected: 0 },
          { args: [[2, 4, 6]], expected: 12 },
        ],
        hints: [
          "filter() відбере тільки парні числа: перевір n % 2 === 0.",
          "reduce() підсумує елементи, що залишились після filter().",
        ],
      },
      {
        id: "max-of", title: "Найбільше озеро", xp: 20, type: "code", fnName: "maxOf",
        desc: "Знайди максимум",
        prompt: "Напиши функцію maxOf(arr), яка повертає найбільше число з непорожнього масиву.",
        starter: "function maxOf(arr) {\n  // твій код тут\n}",
        tests: [
          { args: [[3, 9, 2]], expected: 9 },
          { args: [[-5, -2, -9]], expected: -2 },
          { args: [[7]], expected: 7 },
        ],
        hints: [
          "Почни з першого елемента як «поточного максимуму», а потім порівнюй з рештою.",
          "Обережно: якщо почати з 0, масив лише з від'ємних чисел дасть неправильну відповідь.",
        ],
      },
      {
        id: "q-map", title: "Що повертає map?", xp: 10, type: "quiz",
        desc: "Питання про методи масиву",
        prompt: "Що повертає метод arr.map(fn)?",
        options: [
          "Перший елемент, для якого fn поверне true",
          "Новий масив з результатами виклику fn",
          "Нічого (undefined), лише викликає fn",
          "Той самий масив, змінений на місці",
        ],
        correct: 1,
        hints: [
          "map не змінює вихідний масив.",
          "Довжина результату map завжди дорівнює довжині вихідного масиву.",
        ],
      },
      {
        id: "boss-lakes", title: "Озерний дух", xp: 50, type: "code", fnName: "uniqueValues", boss: true,
        desc: "Прибери повтори",
        prompt: "Напиши функцію uniqueValues(arr), яка повертає новий масив без повторів, зберігаючи порядок першої появи елементів.",
        starter: "function uniqueValues(arr) {\n  // твій код тут\n}",
        tests: [
          { args: [[1, 2, 2, 3, 1]], expected: [1, 2, 3] },
          { args: [[]], expected: [] },
          { args: [["ліс", "ліс", "озеро"]], expected: ["ліс", "озеро"] },
        ],
        hints: [
          "Створи порожній масив-результат і додавай елемент лише тоді, коли його там ще немає.",
          "Перевірити наявність елемента в масиві допоможе метод includes().",
        ],
      },
    ],
  },
  {
    id: "seids",
    title: "Сейди",
    topic: "Об'єкти і рядки",
    desc: "Мовчазні камені-хранителі на схилах. Вони стережуть об'єкти й рядки.",
    quests: [
      {
        id: "dom", title: "Рядок для DOM", xp: 20, type: "code", fnName: "makeListItem",
        desc: "Розмітка елемента списку",
        prompt: "Напиши функцію makeListItem(text), яка повертає рядок вигляду '<li>текст</li>' — саме так формують HTML-розмітку перед вставкою в DOM.",
        starter: "function makeListItem(text) {\n  // твій код тут\n}",
        tests: [
          { args: ["Купити хліб"], expected: "<li>Купити хліб</li>" },
          { args: ["Зробити ДЗ"], expected: "<li>Зробити ДЗ</li>" },
        ],
        hints: [
          "Рядок зручно зібрати через шаблонний рядок зі зворотними лапками.",
          "Функція має повернути (return) готовий рядок, а не вивести його в консоль.",
        ],
      },
      {
        id: "full-name", title: "Повне ім'я", xp: 15, type: "code", fnName: "getFullName",
        desc: "Дані з об'єкта",
        prompt: "Напиши функцію getFullName(user), яка приймає об'єкт з властивостями firstName і lastName та повертає рядок 'Ім'я Прізвище' через пробіл.",
        starter: "function getFullName(user) {\n  // твій код тут\n}",
        tests: [
          { args: [{ firstName: "Олена", lastName: "Коваль" }], expected: "Олена Коваль" },
          { args: [{ firstName: "Ivan", lastName: "Petrenko" }], expected: "Ivan Petrenko" },
        ],
        hints: [
          "До властивості об'єкта звертаються через крапку: user.firstName.",
          "Між іменем і прізвищем потрібен один пробіл.",
        ],
      },
      {
        id: "validation", title: "Валідація логіна", xp: 25, type: "code", fnName: "isValidUsername",
        desc: "Перевір коректність логіна",
        prompt: "Напиши функцію isValidUsername(str), яка повертає true, якщо рядок має довжину від 3 символів і не містить пробілів, інакше — false.",
        starter: "function isValidUsername(str) {\n  // твій код тут\n}",
        tests: [
          { args: ["ліс"], expected: true },
          { args: ["ev a"], expected: false },
          { args: ["ab"], expected: false },
          { args: ["stezhka2026"], expected: true },
        ],
        hints: [
          "Довжину рядка перевіряють через str.length.",
          "Наявність пробілу можна перевірити через str.includes(' ').",
        ],
      },
      {
        id: "q-object", title: "Властивість об'єкта", xp: 10, type: "quiz",
        desc: "Питання про об'єкти",
        prompt: "Як отримати значення властивості name об'єкта user?",
        options: ["user->name", "user(name)", "user.get('name')", "user.name"],
        correct: 3,
        hints: [
          "Стрілка -> використовується в інших мовах, але не в JavaScript.",
          "Найпоширеніший спосіб — через крапку після назви об'єкта.",
        ],
      },
      {
        id: "boss-seids", title: "Сейд-хранитель", xp: 55, type: "code", fnName: "wordFrequency", boss: true,
        desc: "Порахуй слова",
        prompt: "Напиши функцію wordFrequency(str), яка повертає об'єкт: ключі — слова з рядка (розділені пробілом), значення — скільки разів кожне слово трапляється.",
        starter: "function wordFrequency(str) {\n  // твій код тут\n}",
        tests: [
          { args: ["кіт пес кіт"], expected: { "кіт": 2, "пес": 1 } },
          { args: ["ліс ліс ліс"], expected: { "ліс": 3 } },
          { args: ["один"], expected: { "один": 1 } },
        ],
        hints: [
          "Розбий рядок на масив слів методом split(' ').",
          "Для кожного слова: якщо ключа ще немає в об'єкті — постав 1, інакше збільш на 1.",
        ],
      },
    ],
  },
  {
    id: "summit",
    title: "Вершина",
    topic: "Фінальне випробування",
    desc: "Найвища точка стежки. Тут тайга відступає, а лишаються вітер і тиша.",
    quests: [
      {
        id: "capitalize", title: "Великі літери", xp: 25, type: "code", fnName: "capitalizeWords",
        desc: "Кожне слово — з великої",
        prompt: "Напиши функцію capitalizeWords(str), яка повертає рядок, де кожне слово починається з великої літери.",
        starter: "function capitalizeWords(str) {\n  // твій код тут\n}",
        tests: [
          { args: ["тиха стежка"], expected: "Тиха Стежка" },
          { args: ["js"], expected: "Js" },
          { args: ["ліс і річка"], expected: "Ліс І Річка" },
        ],
        hints: [
          "Розбий рядок на слова через split(' '), а потім знову склей через join(' ').",
          "Для кожного слова: перша літера через word[0].toUpperCase() плюс решта через word.slice(1).",
        ],
      },
      {
        id: "boss-summit", title: "Дзеркальне озеро", xp: 60, type: "code", fnName: "isPalindrome", boss: true,
        desc: "Фінальний хранитель",
        prompt: "Напиши функцію isPalindrome(str), яка повертає true, якщо рядок читається однаково в обидва боки без урахування регістру і пробілів, інакше — false.",
        starter: "function isPalindrome(str) {\n  // твій код тут\n}",
        tests: [
          { args: ["Радар"], expected: true },
          { args: ["А роза упала на лапу Азора"], expected: true },
          { args: ["ліс"], expected: false },
        ],
        hints: [
          "Спочатку приведи рядок до нижнього регістру і прибери всі пробіли.",
          "Розвернути рядок можна так: split(''), reverse(), join('').",
        ],
      },
    ],
  },
];

// Таємний квест — з'являється лише після фінального хранителя
const SECRET_QUEST = {
  id: "secret", title: "Таємний квест: Рекурсія", xp: 40, type: "code", fnName: "factorial", secret: true,
  desc: "🗝️ Відкрито після вершини",
  prompt: "Напиши функцію factorial(n), яка рекурсивно обчислює факторіал числа n.",
  starter: "function factorial(n) {\n  // твій код тут (рекурсія)\n}",
  tests: [
    { args: [0], expected: 1 },
    { args: [1], expected: 1 },
    { args: [5], expected: 120 },
  ],
  hints: [
    "Рекурсивна функція викликає саму себе з меншим аргументом, поки не дійде до базового випадку.",
    "Базовий випадок для факторіала: factorial(0) дорівнює 1.",
  ],
};

// Усі квести глав одним списком (з позначкою, до якої глави належать)
const ALL_QUESTS = CHAPTERS.flatMap((ch) => ch.quests.map((q) => ({ ...q, chapterId: ch.id })));

// Досягнення. check(s) отримує стан: { xp, doneCount, completed: Set, streak, comboEverClaimed,
// threeStars, fastSolve, purchases }
const BADGES = [
  { id: "first-step", name: "Перший крок", desc: "1 виконаний квест", icon: "🥾", check: (s) => s.doneCount >= 1 },
  { id: "five-in-row", name: "П'ять квестів", desc: "5 виконаних квестів", icon: "⭐", check: (s) => s.doneCount >= 5 },
  { id: "pathfinder", name: "Слідопит", desc: "15 виконаних квестів", icon: "🧭", check: (s) => s.doneCount >= 15 },
  { id: "first-guardian", name: "Перший хранитель", desc: "Здолано хранителя узлісся", icon: "🌲", check: (s) => s.completed.has("boss-uzlissia") },
  { id: "labyrinth", name: "Майстер умов", desc: "Пройдено Лабіринт умов", icon: "🧩", check: (s) => s.completed.has("boss-labyrinth") },
  { id: "bug-hunter", name: "Мисливець за багами", desc: "Полагоджено зламаний кошик", icon: "🐞", check: (s) => s.completed.has("boss") },
  { id: "summit", name: "Підкорювач вершини", desc: "Здолано фінального хранителя", icon: "🏔️", check: (s) => s.completed.has("boss-summit") },
  { id: "secret-solved", name: "Мисливець за таємницями", desc: "Пройдено таємний квест", icon: "🗝️", check: (s) => s.completed.has("secret") },
  { id: "perfectionist", name: "Перфекціоніст", desc: "5 квестів на 3 зірки", icon: "🌟", check: (s) => s.threeStars >= 5 },
  { id: "speedrunner", name: "Швидкий як вітер", desc: "Квест швидше ніж за 60 секунд", icon: "💨", check: (s) => s.fastSolve },
  { id: "combo", name: "Комбо дня", desc: "3 квести за один день", icon: "🎯", check: (s) => s.comboEverClaimed },
  { id: "collector", name: "Збирач ягід", desc: "Перша покупка в крамниці", icon: "🫐", check: (s) => s.purchases >= 1 },
  { id: "junior", name: "Junior JS", desc: "Досягнуто рівня Junior JS", icon: "🌱", check: (s) => s.xp >= 100 },
  { id: "middle", name: "Middle JS", desc: "Досягнуто рівня Middle JS", icon: "🚀", check: (s) => s.xp >= 400 },
  { id: "legend", name: "Легенда стежки", desc: "Досягнуто рівня Tech Lead", icon: "👑", check: (s) => s.xp >= 700 },
  { id: "streak-3", name: "Серія 3 дні", desc: "3 дні поспіль з активністю", icon: "🔥", check: (s) => s.streak >= 3 },
  { id: "streak-7", name: "Тижневий марафон", desc: "7 днів поспіль з активністю", icon: "📅", check: (s) => s.streak >= 7 },
];

// Крамниця: лише косметика за ігрові ягоди, жодних переваг у грі
const SHOP_ITEMS = [
  { id: "frame-none", type: "frame", name: "Без рамки", desc: "Звичайна аватарка", price: 0 },
  { id: "frame-moss", type: "frame", name: "Мох", desc: "М'яка зелена рамка", price: 30 },
  { id: "frame-birch", type: "frame", name: "Береста", desc: "Світла рамка з темним краєм", price: 50 },
  { id: "frame-aurora", type: "frame", name: "Північне сяйво", desc: "Рамка, що світиться", price: 90 },

  { id: "title-none", type: "title", name: "Без титулу", desc: "Лише рівень", price: 0, text: "" },
  { id: "title-tracker", type: "title", name: "Слідопит", desc: "Титул під іменем", price: 25, text: "Слідопит" },
  { id: "title-silence", type: "title", name: "Тиша лісу", desc: "Титул під іменем", price: 40, text: "Тиша лісу" },
  { id: "title-guardian", type: "title", name: "Хранитель сейдів", desc: "Титул під іменем", price: 70, text: "Хранитель сейдів" },

  { id: "theme-karelia", type: "theme", name: "Карелія", desc: "Туманний хвойний ліс (темна)", price: 0 },
  { id: "theme-white-nights", type: "theme", name: "Білі ночі", desc: "Світла тема", price: 0 },
  { id: "theme-aurora", type: "theme", name: "Північне сяйво", desc: "Фіолетово-бірюзова", price: 80 },
  { id: "theme-taiga", type: "theme", name: "Осіння тайга", desc: "Теплі бурштинові тони", price: 80 },
];

module.exports = { LEVELS, CHAPTERS, ALL_QUESTS, SECRET_QUEST, BADGES, SHOP_ITEMS };