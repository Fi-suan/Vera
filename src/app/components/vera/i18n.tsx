import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

/* ------------------------------------------------------------------ */
/* Trilingual: Russian (default), Kazakh, English.                     */
/* Lightweight t() — components call t("key"). Lang persists.          */
/* ------------------------------------------------------------------ */

export type Lang = "ru" | "kz" | "en";
export const LANGS: { id: Lang; label: string }[] = [
  { id: "ru", label: "РУС" },
  { id: "kz", label: "ҚАЗ" },
  { id: "en", label: "ENG" },
];

type Dict = Record<string, [ru: string, kz: string, en: string]>;

const D: Dict = {
  // auth
  welcome: ["С возвращением", "Қайта келдіңіз", "Welcome back"],
  signinSub: ["Войдите по имени и коду доступа.", "Атыңыз бен кіру кодын енгізіңіз.", "Sign in with your name and access code."],
  fullName: ["Полное имя", "Толық аты", "Full name"],
  namePh: ["Ваше имя", "Атыңыз", "Your name"],
  accessCode: ["Код доступа", "Кіру коды", "Access code"],
  codePh: ["Введите код", "Кодты енгізіңіз", "Enter your code"],
  continue: ["Продолжить", "Жалғастыру", "Continue"],
  protected: ["Защищено · код не покидает точку", "Қорғалған · код нүктеден шықпайды", "Protected · codes never leave the point"],
  chooseRole: ["Как вы работаете сегодня?", "Бүгін қалай жұмыс істейсіз?", "How are you working today?"],
  back: ["Назад", "Артқа", "Back"],
  onFloor: ["На точке", "Нүктеде", "On the floor"],
  onFloorSub: ["Списания голосом", "Дауыспен есептен шығару", "Report write-offs by voice"],
  runningPoint: ["Управление точкой", "Нүктені басқару", "Running the point"],
  runningPointSub: ["Проверка, решения, аналитика", "Тексеру, шешім, аналитика", "Review, decide, analyse loss"],
  // nav
  home: ["Главная", "Басты", "Home"],
  capture: ["Запись", "Жазу", "Capture"],
  requests: ["Заявки", "Өтінімдер", "Requests"],
  products: ["Товары", "Тауарлар", "Products"],
  profile: ["Профиль", "Профиль", "Profile"],
  overview: ["Обзор", "Шолу", "Overview"],
  queue: ["Очередь", "Кезек", "Queue"],
  records: ["Записи", "Жазбалар", "Records"],
  team: ["Команда", "Команда", "Team"],
  iiko: ["Iiko", "Iiko", "Iiko"],
  hi: ["Привет", "Сәлем", "Hi"],
  employeeRole: ["Сотрудник", "Қызметкер", "Employee"],
  managerRole: ["Менеджер", "Менеджер", "Manager"],
  // employee dashboard
  goodMorning: ["Доброе утро", "Қайырлы таң", "Good morning"],
  goodAfternoon: ["Добрый день", "Қайырлы күн", "Good afternoon"],
  goodEvening: ["Добрый вечер", "Қайырлы кеш", "Good evening"],
  voiceFirst: ["Голосом", "Дауыспен", "Voice first"],
  tapToTell: ["Нажмите, чтобы сказать VERA", "VERA-ға айту үшін басыңыз", "Tap to tell VERA"],
  tapSub: ["Назовите товар, количество и причину — VERA оформит списание.", "Тауар, саны мен себебін айтыңыз — VERA рәсімдейді.", "Say the product, quantity and reason — it structures the write-off."],
  pending: ["В ожидании", "Күтуде", "Pending"],
  approved: ["Одобрено", "Мақұлданған", "Approved"],
  rejected: ["Отклонено", "Қабылданбады", "Rejected"],
  loggedWeek: ["Списано за неделю", "Апта бойы", "Logged this week"],
  ofCap: ["от лимита", "лимиттен", "of cap"],
  quickActions: ["Быстрые действия", "Жылдам әрекеттер", "Quick actions"],
  recentActivity: ["Недавняя активность", "Соңғы әрекеттер", "Recent activity"],
  manualEntry: ["Ручной ввод", "Қолмен енгізу", "Manual entry"],
  manualSub: ["Ввести списание вручную", "Қолмен енгізу", "Type a write-off by hand"],
  productsSub: ["Открыть каталог", "Каталогты ашу", "Browse the catalogue"],
  requestsSub: ["Отслеживать заявки", "Өтінімдерді қадағалау", "Track every submission"],
  myRequests: ["Мои заявки", "Менің өтінімдерім", "My requests"],
  myRequestsSub: ["Все ваши списания и их статус.", "Барлық списаниелер және мәртебесі.", "Every write-off you've sent, and where it stands."],
  all: ["Все", "Барлығы", "All"],
  nothingHere: ["Здесь пока ничего нет.", "Әзірге ештеңе жоқ.", "Nothing here yet."],
  noWriteoffs: ["Списаний пока нет — нажмите, чтобы создать первое.", "Әзірге списание жоқ — біріншісін жасаңыз.", "No write-offs yet — tap to capture your first one."],
  productsTitle: ["Товары", "Тауарлар", "Products"],
  productsCatalogSub: ["Справочный каталог из бэкенда.", "Бэкендтен синхрондалатын каталог.", "Reference catalogue, synced from your backend."],
  noProducts: ["Товаров пока нет — они синхронизируются из бэкенда.", "Тауарлар әзірге жоқ — бэкендтен синхрондалады.", "No products yet — they sync in from your backend."],
  searchProducts: ["Поиск товаров…", "Тауарларды іздеу…", "Search products…"],
  preferences: ["Настройки", "Параметрлер", "Preferences"],
  switchRole: ["Сменить роль", "Рөлді ауыстыру", "Switch role"],
  writeoffs: ["Списаний", "Списание", "Write-offs"],
  totalLogged: ["Всего списано", "Барлығы", "Total logged"],
  // profile settings
  profileTitle: ["Профиль", "Профиль", "Profile"],
  haptics: ["Виброотклик", "Дірілмен жауап", "Haptic feedback"],
  hapticsSub: ["Лёгкая вибрация при записи и отправке", "Жазу мен жіберуде діріл", "Subtle buzz on capture and submit"],
  voiceHints: ["Голосовые подсказки", "Дауыс кеңестері", "Voice hints"],
  voiceHintsSub: ["Показывать примеры фраз при записи", "Жазу кезінде мысал тіркестер", "Show example phrasing while recording"],
  autoPhoto: ["Авто-камера", "Авто-камера", "Auto-open camera"],
  autoPhotoSub: ["Сразу к фото после распознавания", "Танудан кейін бірден фотоға", "Jump straight to photo after extraction"],
  // manager
  overviewSub: ["Потери, одобрения и синхронизация по всем точкам.", "Барлық нүктелер бойынша шолу.", "Loss, approvals and sync health across all points."],
  pendingReview: ["На проверке", "Тексеруде", "Pending review"],
  lossWeek: ["Потери за неделю", "Апта шығыны", "Loss this week"],
  approvalRate: ["Одобрено, %", "Мақұлдау, %", "Approval rate"],
  syncIssues: ["Ошибки синхр.", "Синхр. қателер", "Sync issues"],
  review: ["Проверить", "Тексеру", "Review"],
  lossTrend: ["Потери · 7 дней", "Шығын · 7 күн", "Loss trend · 7 days"],
  byPoint: ["По точкам", "Нүктелер бойынша", "By trade point"],
  byCategory: ["По категориям", "Санаттар бойынша", "Loss by category"],
  needsAttention: ["Требует внимания", "Назар аудару", "Needs attention"],
  queueClearShort: ["Очередь пуста — проверять нечего.", "Кезек бос.", "Queue is clear — nothing to review."],
  reviewQueueTitle: ["Очередь проверки", "Тексеру кезегі", "Review queue"],
  reviewQueueSub: ["Поймите каждую заявку за пять секунд.", "Әр өтінімді 5 секундта түсініңіз.", "Understand each request in five seconds."],
  waiting: ["в ожидании", "күтуде", "waiting"],
  queueEmpty: ["Очередь пуста. Новые списания появятся здесь.", "Кезек бос. Жаңа списаниелер осында.", "Queue is clear. New voice write-offs land here."],
  recordsTitle: ["Все записи", "Барлық жазбалар", "All records"],
  teamTitle: ["Команда", "Команда", "Team"],
  teamSub: ["Кто что списывает и сколько это стоит.", "Кім не списание жасайды.", "Who's reporting what, and how much it costs."],
  noTeam: ["Активности пока нет.", "Әзірге белсенділік жоқ.", "No team activity yet."],
  iikoTitle: ["Синхронизация Iiko", "Iiko синхрондау", "Iiko sync"],
  iikoSub: ["Одобренные списания уходят в Iiko.", "Мақұлданғандар Iiko-ға кетеді.", "Approved write-offs flow into Iiko."],
  approveSync: ["Одобрить", "Мақұлдау", "Approve & sync"],
  rejectAction: ["Отклонить", "Қабылдамау", "Reject"],
};

let current: Lang = ((): Lang => {
  try {
    const s = localStorage.getItem("vera.lang") as Lang | null;
    if (s === "ru" || s === "kz" || s === "en") return s;
  } catch {}
  return "ru";
})();

const idx = { ru: 0, kz: 1, en: 2 } as const;
function liveLang(): Lang {
  try {
    const s = localStorage.getItem("vera.lang") as Lang | null;
    if (s === "ru" || s === "kz" || s === "en") return s;
  } catch {}
  return current;
}
export function translate(key: string, lang: Lang = liveLang()): string {
  const row = D[key];
  return row ? row[idx[lang]] : key;
}

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: string) => string } | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(current);
  const setLang = useCallback((l: Lang) => {
    current = l;
    try { localStorage.setItem("vera.lang", l); } catch {}
    setLangState(l);
  }, []);
  const t = useCallback((k: string) => translate(k, lang), [lang]);
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useLang() {
  const c = useContext(Ctx);
  if (!c) return { lang: current, setLang: (_: Lang) => {}, t: (k: string) => translate(k) };
  return c;
}
