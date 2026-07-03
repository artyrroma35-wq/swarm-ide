export const TRANSLATIONS: Record<string, Record<string, string>> = {
  ru: {
    app_name: 'Swarm IDE', chat: 'Чат', agents: 'Агенты', graph: 'Граф',
    settings: 'Настройки', workspace: 'Рабочая область', memory: 'Память',
    send: 'Отправить', stop: 'Стоп', create_agent: 'Создать агента',
    search: 'Поиск', upload: 'Загрузить', delete: 'Удалить', save: 'Сохранить',
    cancel: 'Отмена', confirm: 'Подтвердить', loading: 'Загрузка...',
    error: 'Ошибка', success: 'Успешно', no_results: 'Нет результатов',
    type_message: 'Напишите сообщение...', thinking: 'думает', idle: 'ожидает',
    tools: 'Инструменты', details: 'Детали', profile: 'Профиль',
    dark_theme: 'Тёмная тема', light_theme: 'Светлая тема',
  },
  en: {
    app_name: 'Swarm IDE', chat: 'Chat', agents: 'Agents', graph: 'Graph',
    settings: 'Settings', workspace: 'Workspace', memory: 'Memory',
    send: 'Send', stop: 'Stop', create_agent: 'Create Agent',
    search: 'Search', upload: 'Upload', delete: 'Delete', save: 'Save',
    cancel: 'Cancel', confirm: 'Confirm', loading: 'Loading...',
    error: 'Error', success: 'Success', no_results: 'No results',
    type_message: 'Type a message...', thinking: 'thinking', idle: 'idle',
    tools: 'Tools', details: 'Details', profile: 'Profile',
    dark_theme: 'Dark Theme', light_theme: 'Light Theme',
  },
};

export type Lang = 'ru' | 'en';
export function t(key: string, lang: Lang = 'ru'): string {
  return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['ru']?.[key] || key;
}
declare global { var __lang: Lang | undefined; }
export function getLang(): Lang { return globalThis.__lang || 'ru'; }
export function setLang(l: Lang) { globalThis.__lang = l; }
