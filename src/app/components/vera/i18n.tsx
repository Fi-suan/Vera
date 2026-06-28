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
  signinSub: ["Войдите по email и паролю.", "Email және құпиясөзбен кіріңіз.", "Sign in with your email and password."],
  fullName: ["Полное имя", "Толық аты", "Full name"],
  namePh: ["Ваше имя", "Атыңыз", "Your name"],
  accessCode: ["Код доступа", "Кіру коды", "Access code"],
  codePh: ["Введите код", "Кодты енгізіңіз", "Enter your code"],
  emailLabel: ["Email", "Email", "Email"],
  emailPh: ["you@vera.demo", "you@vera.demo", "you@vera.demo"],
  passwordLabel: ["Пароль", "Құпиясөз", "Password"],
  passwordPh: ["Введите пароль", "Құпиясөзді енгізіңіз", "Enter your password"],
  signinError: ["Не удалось войти. Проверьте email и пароль.", "Кіру мүмкін болмады. Email мен құпиясөзді тексеріңіз.", "Could not sign in. Check your email and password."],
  continue: ["Продолжить", "Жалғастыру", "Continue"],
  // sign up
  signupTitle: ["Создать аккаунт", "Аккаунт құру", "Create account"],
  signupSub: ["Заполните данные и выберите роль.", "Деректерді толтырып, рөлді таңдаңыз.", "Fill in your details and pick a role."],
  createAccount: ["Создать аккаунт", "Аккаунт құру", "Create account"],
  noAccountQ: ["Нет аккаунта?", "Аккаунт жоқ па?", "No account?"],
  haveAccountQ: ["Уже есть аккаунт?", "Аккаунт бар ма?", "Have an account?"],
  signInLink: ["Войти", "Кіру", "Sign in"],
  signUpLink: ["Создать", "Құру", "Sign up"],
  signupError: ["Не удалось создать аккаунт. Возможно, email уже занят.", "Аккаунт құру мүмкін болмады. Email бос емес шығар.", "Could not create the account. The email may already be taken."],
  passwordHint: ["Минимум 8 символов", "Кемінде 8 таңба", "At least 8 characters"],
  roleSection: ["Я работаю как", "Мен былай жұмыс істеймін", "I work as"],
  // profile — trade point
  yourTradePoint: ["Ваша точка", "Сіздің нүктеңіз", "Your trade point"],
  yourTradePointSub: ["Подставляется при записи списания.", "Списание жазғанда автоматты қойылады.", "Pre-filled when you capture a write-off."],
  notSet: ["Не выбрана", "Таңдалмаған", "Not set"],
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
  // dashboard leftovers
  ofCapPct: ["от лимита", "лимиттен", "of cap"],
  per: ["за", "бір", "per"],
  syncingShort: ["Синхронизация…", "Синхрондау…", "Syncing…"],
  syncedShort: ["Синхронизировано", "Синхрондалды", "Synced"],
  syncFailedShort: ["Ошибка синхр.", "Синхр. қатесі", "Sync failed"],
  // shared field labels
  fieldProduct: ["Товар", "Тауар", "Product"],
  fieldQuantity: ["Количество", "Саны", "Quantity"],
  fieldTradePoint: ["Точка", "Нүкте", "Trade point"],
  fieldReason: ["Причина", "Себеп", "Reason"],
  fieldDeduction: ["Удержание", "Ұстау", "Deduction"],
  withDeduction: ["С удержанием", "Ұстаумен", "With deduction"],
  withoutDeduction: ["Без удержания", "Ұстаусыз", "Without deduction"],
  estLoss: ["Оценка потерь", "Болжамды шығын", "Est. loss"],
  // capture flow — record
  listening: ["Слушаю…", "Тыңдап тұрмын…", "Listening…"],
  tellVera: ["Расскажите VERA, что случилось", "VERA-ға не болғанын айтыңыз", "Tell VERA what happened"],
  tellVeraSub: ["Товар, количество, точка и тип списания.", "Тауар, саны, нүкте және есептен шығару түрі.", "Product, quantity, trade point, and deduction type."],
  recordingTapFinish: ["Запись… нажмите микрофон, чтобы закончить.", "Жазу… аяқтау үшін микрофонды басыңыз.", "Recording… tap the mic to finish."],
  transcribingShort: ["Распознаю…", "Тануда…", "Transcribing…"],
  tapMicSpeak: ["Нажмите микрофон и говорите свободно.", "Микрофонды басып, еркін сөйлеңіз.", "Tap the mic and speak naturally."],
  finishRecording: ["Завершить запись", "Жазуды аяқтау", "Finish recording"],
  typeInstead: ["Ввести вручную", "Қолмен енгізу", "Type instead"],
  voiceHintTitle: ["Например, скажите:", "Мысалы, айтыңыз:", "For example, say:"],
  voiceHintEx1: ["«3 котлеты упали на пол в Aktau Mall, без удержания»", "«3 котлета Aktau Mall-да еденге түсті, ұстаусыз»", "“3 cutlets fell on the floor at Aktau Mall, no deduction”"],
  voiceHintEx2: ["«Списать 2 кг лосося — истёк срок»", "«2 кг лосось — мерзімі өтті»", "“Write off 2 kg of salmon — expired”"],
  // capture flow — transcript
  yourWords: ["Ваши слова", "Сіздің сөздеріңіз", "Your words"],
  reviewTranscript: ["Проверьте текст", "Мәтінді тексеріңіз", "Review the transcript"],
  reviewTranscriptSub: ["Отредактируйте при необходимости, затем VERA структурирует.", "Қажет болса өңдеңіз, содан кейін VERA құрылымдайды.", "Edit if needed, then let VERA structure it."],
  transcriptHint: ["VERA могла ослышаться — поправьте товар, число или причину, если что-то не так.", "VERA қате естуі мүмкін — тауарды, санды немесе себепті түзетіңіз.", "VERA can mishear — fix the product, number or reason if anything's off."],
  transcriptPh: [
    "напр. Списать 3 котлеты, упали на пол в Aktau Mall, без удержания.",
    "мыс. 3 котлетаны есептен шығару, Aktau Mall-да еденге түсті, ұстаусыз.",
    "e.g. Write off 3 beef cutlets, fell on the floor at Aktau Mall, without deduction.",
  ],
  structuring: ["Структурирую…", "Құрылымдауда…", "Structuring…"],
  structureWithVera: ["Структурировать с VERA", "VERA-мен құрылымдау", "Structure with VERA"],
  // capture flow — extract
  veraStructured: ["VERA структурировала заявку", "VERA өтінімді құрылымдады", "VERA structured your request"],
  confident: ["уверенность", "сенімділік", "confident"],
  checkDetails: ["Проверьте детали", "Деректерді тексеріңіз", "Check the details"],
  cleanedComment: ["Обработанный комментарий", "Өңделген түсініктеме", "Cleaned comment"],
  addMissingDetails: ["Добавить детали", "Деректерді қосу", "Add missing details"],
  looksCorrect: ["Всё верно", "Бәрі дұрыс", "Looks correct"],
  // capture flow — missing
  fillMissing: ["Заполните недостающее", "Жетпегенін толтырыңыз", "Fill the missing details"],
  fillMissingSub: ["Нажмите, чтобы заполнить — быстрее, чем печатать.", "Толтыру үшін басыңыз — теруден жылдам.", "Tap to fill — faster than typing."],
  // capture flow — photo
  attachPhoto: ["Прикрепите фото-подтверждение", "Фото-дәлел тіркеңіз", "Attach photo proof"],
  attachPhotoSub: ["Сделайте или загрузите снимок, где чётко видно товар и повреждение.", "Тауар мен зақымды анық көрсететін суретті түсіріңіз немесе жүктеңіз.", "Take or upload a shot that clearly shows the product and damage."],
  tapTakeUpload: ["Нажмите, чтобы снять или загрузить", "Түсіру немесе жүктеу үшін басыңыз", "Tap to take or upload"],
  retake: ["Переснять", "Қайта түсіру", "Retake"],
  // capture flow — confirm / done
  readyToSend: ["Готово к отправке", "Жіберуге дайын", "Ready to send"],
  editStep: ["Изменить", "Өңдеу", "Edit"],
  submitForApproval: ["Отправить на проверку", "Тексеруге жіберу", "Submit for approval"],
  sending: ["Отправка…", "Жіберуде…", "Sending…"],
  sentToManager: ["Отправлено менеджеру", "Менеджерге жіберілді", "Sent to manager"],
  sentToManagerSub: ["Заявка в очереди проверки. Решение появится в ваших заявках.", "Өтінім тексеру кезегінде. Шешім өтінімдеріңізде көрінеді.", "It's in the review queue. You'll see the decision in your requests."],
  // capture flow — errors
  micUnavailable: ["Микрофон недоступен — введите вручную, что случилось.", "Микрофон қолжетімсіз — не болғанын қолмен енгізіңіз.", "Microphone unavailable — type what happened instead."],
  transcribeFailed: ["Не удалось распознать — введите или отредактируйте текст ниже.", "Тану мүмкін болмады — төмендегі мәтінді енгізіңіз немесе өңдеңіз.", "Couldn't transcribe — type or edit the text below."],
  extractionFailed: ["Не удалось структурировать", "Құрылымдау мүмкін болмады", "Extraction failed"],
  couldNotSubmit: ["Не удалось отправить", "Жіберу мүмкін болмады", "Could not submit"],
  // manager — misc
  attentionTag: ["внимание", "назар", "attention"],
  searchRecordsPh: ["Поиск: товар, сотрудник, точка…", "Іздеу: тауар, қызметкер, нүкте…", "Search product, employee, point…"],
  recordsSubCount: ["списаний по всем точкам.", "нүктелер бойынша списаниелер.", "write-offs across every point."],
  // manager — team
  teamMemberWriteoffs: ["списаний", "списание", "write-offs"],
  statTotal: ["Всего", "Барлығы", "Total"],
  statLoss: ["Потери", "Шығын", "Loss"],
  // manager — sync center
  syncInProgress: ["В процессе", "Орындалуда", "In progress"],
  retrySyncAction: ["Повторить", "Қайталау", "Retry"],
  nothingApproved: ["Одобренных пока нет — они появятся здесь для синхронизации.", "Әзірге мақұлданғандар жоқ — олар синхрондау үшін осында көрінеді.", "Nothing approved yet — approvals will appear here to sync."],
  // manager — drawer
  fieldEmployee: ["Сотрудник", "Қызметкер", "Employee"],
  fieldDocument: ["Документ", "Құжат", "Document"],
  aiComment: ["Комментарий ИИ", "ЖИ түсініктемесі", "AI comment"],
  originalTranscript: ["Исходный текст", "Бастапқы мәтін", "Original transcript"],
  rejectReasonTitle: ["Причина отклонения", "Қабылдамау себебі", "Reason for rejection"],
  rejectNotePh: ["Короткий комментарий для сотрудника…", "Қызметкерге қысқа түсініктеме…", "Add a short note for the employee…"],
  cancel: ["Отмена", "Бас тарту", "Cancel"],
  sendRejection: ["Отправить отказ", "Бас тартуды жіберу", "Send rejection"],
  rejPhotoUnclear: ["Фото нечёткое", "Фото анық емес", "Photo unclear"],
  rejWrongProduct: ["Неверный товар", "Қате тауар", "Wrong product"],
  rejMissingInfo: ["Не хватает данных", "Деректер жетіспейді", "Missing information"],
  rejOther: ["Другое", "Басқа", "Other"],
  syncToIiko: ["Синхронизация с Iiko…", "Iiko-мен синхрондау…", "Syncing to Iiko…"],
  syncedToIiko: ["Синхронизировано с Iiko", "Iiko-мен синхрондалды", "Synced to Iiko"],
  syncFailedRetry: ["Ошибка синхр. — повторите в Iiko-центре", "Синхр. қатесі — Iiko орталығында қайталаңыз", "Sync failed — retry in Iiko center"],
  approvedLabel: ["Одобрено", "Мақұлданды", "Approved"],
  // backend status -> localized chip label
  stDraft: ["Черновик", "Жоба", "Draft"],
  stMissingInfo: ["Не хватает данных", "Деректер жетіспейді", "Missing info"],
  // relative time
  justNow: ["только что", "жаңа ғана", "just now"],
  minAgo: ["мин назад", "мин бұрын", "min ago"],
  hAgo: ["ч назад", "сағ бұрын", "h ago"],
  dAgo: ["дн назад", "күн бұрын", "d ago"],
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
