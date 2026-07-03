/**
 * 🔮 SPELLS — Паттерны многоагентной оркестрации
 * 
 * Map-Reduce: разделяй задачу → параллельно обрабатывай → объединяй
 * Router-Experts: маршрутизируй задачу к лучшему агенту
 * Tree-Executor: рекурсивное дерево с суммированием
 * Critic-Loop: генерация → критика → перезапись
 */

export const SPELLS = {
  'map-reduce': {
    name: '🔀 Map-Reduce',
    description: 'Разделить задачу на N частей, обработать параллельно, объединить',
    prompt: `Ты — Map-Reduce调度器.

[MAP]
1) Раздели задачу на N подзадач (N=4)
2) Для каждой подзадачи создай агента и отправь:
   TASK { part_id, content, context }

[REDUCE]
3) Дождись результатов от всех
4) Объедини в финальный ответ`,
    params: { N: 4 },
  },

  'router-experts': {
    name: '🔀 Router-Experts',
    description: 'Маршрутизировать задачу к наиболее подходящему агенту-эксперту',
    prompt: `Ты — Router.

1) Прочитай список существующих агентов (их роли)
2) Маршрутизируй по ключевым словам:
   - код/разработка → role содержит "coder" или "программист"
   - дизайн/UI → role содержит "designer" или "дизайнер"
   - анализ/данные → role содержит "analyst" или "аналитик"
   - исследование → role содержит "researcher" или "исследователь"
3) Если нет подходящего — создай агента с нужной ролью
4) Отправь задачу, дождись результата, верни пользователю`,
  },

  'tree-executor': {
    name: '🌳 Tree-Executor',
    description: 'Рекурсивное дерево: каждый узел вычисляет число и передаёт наверх',
    prompt: `Ты — Tree-Executor.

[ПРОТОКОЛ]
depth = 2
branch = 2
path = "root"

1) Загадай число (1-9)
2) Создай branch дочерних агентов (depth-1)
3) Отправь им тот же протокол
4) Дождись результатов
5) total = my_number + sum(children)
6) Отправь REPORT наверх

[ФОРМАТ ОТЧЁТА]
REPORT { path, my_number, children_sum, total }`,
    params: { depth: 2, branch: 2 },
  },

  'critic-loop': {
    name: '🔄 Critic-Loop',
    description: 'Генерация → критика → перезапись (цикл улучшения)',
    prompt: `Ты — Critic-Loop.

[ROUND 1: GENERATE]
1) Сгенерируй ответ на задачу

[ROUND 2: CRITIC]
2) Создай агента-критика
3) Попроси его найти 3-5 проблем

[ROUND 3: REWRITE]
4) Исправь на основе критики

[ROUND 4: FINAL]
5) Предоставь финальную версию`,
    rounds: 4,
  },
};

export type SpellName = keyof typeof SPELLS;

export function getSpell(name: SpellName) {
  return SPELLS[name];
}

export function listSpells() {
  return Object.entries(SPELLS).map(([id, spell]) => ({
    id,
    name: spell.name,
    description: spell.description,
  }));
}
