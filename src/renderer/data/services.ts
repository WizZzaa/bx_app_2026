// Каталог полезных сервисов для бухгалтера РУз — набор в бандле.
// Дополняется/переопределяется облачными записями (bx_services) через
// lib/db/servicesRepo.ts. Страница «Сервисы» и админ-панель читают отсюда.

export interface ServiceItem {
  icon: string;
  title: string;
  desc: string;
  url: string;
  tag?: string;
  hot?: boolean;       // часто используется
  cloudId?: string;    // id записи в bx_services (для облачных)
}

export interface ServiceSection {
  id: string;
  title: string;
  items: ServiceItem[];
}

export const SECTIONS: ServiceSection[] = [
  {
    id: 'tax',
    title: '💳 ГНК и налоговые сервисы',
    items: [
      { icon: '🏠', title: 'my.soliq.uz', desc: 'Личный кабинет налогоплательщика — декларации, оплата, задолженность', url: 'https://my.soliq.uz', tag: 'ЛКН', hot: true },
      { icon: '📣', title: 'soliq.uz', desc: 'Официальный сайт ГНК: новости, разъяснения, формы и НПА', url: 'https://soliq.uz', tag: 'ГНК', hot: true },
      { icon: '📤', title: 'Электронные декларации', desc: 'Раздел my.soliq.uz: сдача налоговой отчётности онлайн', url: 'https://my.soliq.uz/declaration', tag: 'Отчёт' },
      { icon: '💰', title: 'Оплата налогов (my.soliq)', desc: 'Оплата налогов и сборов через Личный кабинет ГНК', url: 'https://my.soliq.uz/payment', tag: 'Оплата' },
      { icon: '🔎', title: 'Проверка задолженности', desc: 'Проверить долг по налогам по ИНН на портале ГНК', url: 'https://my.soliq.uz', tag: 'Долги' },
      { icon: '📋', title: 'Реестр плательщиков НДС', desc: 'Проверить, является ли контрагент плательщиком НДС', url: 'https://my.soliq.uz', tag: 'НДС' },
      { icon: '📱', title: 'Telegram: @soliqda_yangilik', desc: 'Официальный Telegram-канал ГНК — оперативные изменения', url: 'https://t.me/soliqda_yangilik', tag: 'TG', hot: true },
      { icon: '📱', title: 'Telegram: @gnk_info', desc: 'Информационный канал ГНК РУз', url: 'https://t.me/gnk_info', tag: 'TG' },
    ],
  },
  {
    id: 'gov',
    title: '🏛 Государственные порталы',
    items: [
      { icon: '🇺🇿', title: 'my.gov.uz', desc: 'Единый портал интерактивных государственных услуг РУз', url: 'https://my.gov.uz', tag: 'ЕПИГУ', hot: true },
      { icon: '💼', title: 'business.gov.uz', desc: 'Портал для предпринимателей: регистрация, лицензии, разрешения', url: 'https://business.gov.uz', tag: 'Бизнес' },
      { icon: '⚖️', title: 'lex.uz', desc: 'Законодательство РУз — НК, ТК, ГК, все НПА онлайн', url: 'https://lex.uz', tag: 'НПА', hot: true },
      { icon: '📰', title: 'regulation.gov.uz', desc: 'Портал обсуждения проектов НПА — следить за изменениями', url: 'https://regulation.gov.uz', tag: 'НПА' },
      { icon: '🏢', title: 'minjust.gov.uz', desc: 'Министерство юстиции: регистрация юрлиц, нотариат', url: 'https://minjust.gov.uz', tag: 'Минюст' },
      { icon: '📂', title: 'register.uz', desc: 'ЕГРПО — единый государственный реестр предприятий', url: 'https://register.uz', tag: 'ЕГРПО' },
      { icon: '🔐', title: 'license.gov.uz', desc: 'Система лицензирования — получение и проверка лицензий', url: 'https://license.gov.uz', tag: 'Лицензии' },
      { icon: '🛡', title: 'antimon.uz', desc: 'Антимонопольный комитет: жалобы, реестры, контроль цен', url: 'https://antimon.uz', tag: 'АМК' },
      { icon: '⚡', title: 'energoinspeksiya.uz', desc: 'Энергоинспекция: тарифы, нормативы, потребление', url: 'https://energoinspeksiya.uz', tag: 'ЖКУ' },
      { icon: '🏗', title: 'uzinfocom.uz', desc: 'Узинфоком: ИТ-инфраструктура, ЕГИСЗ, реестры', url: 'https://uzinfocom.uz', tag: 'ИТ' },
    ],
  },
  {
    id: 'finance',
    title: '📊 Регуляторы и министерства',
    items: [
      { icon: '🏦', title: 'cbu.uz', desc: 'Центральный банк РУз: курсы валют, ставка рефинансирования, нормативы', url: 'https://cbu.uz', tag: 'ЦБ', hot: true },
      { icon: '💼', title: 'mf.uz', desc: 'Министерство финансов: бюджет, КБК, бюджетная классификация', url: 'https://mf.uz', tag: 'Минфин' },
      { icon: '🏛', title: 'xazina.uz', desc: 'Главное казначейство: бюджетные платежи, лицевые счета', url: 'https://xazina.uz', tag: 'Казнач.' },
      { icon: '📊', title: 'stat.uz', desc: 'Агентство статистики: статотчётность, классификаторы ОКЭД', url: 'https://stat.uz', tag: 'Статистика', hot: true },
      { icon: '🌐', title: 'uzse.uz', desc: 'Узбекская фондовая биржа — котировки ценных бумаг, эмитенты', url: 'https://uzse.uz', tag: 'Биржа' },
      { icon: '📈', title: 'invest.gov.uz', desc: 'Агентство по продвижению и защите инвестиций (АИПИ)', url: 'https://invest.gov.uz', tag: 'Инвест.' },
    ],
  },
  {
    id: 'labor',
    title: '👔 Труд, занятость и социальная защита',
    items: [
      { icon: '👷', title: 'mehnat.uz', desc: 'Министерство занятости: МРОТ, трудовые нормы, инспекция', url: 'https://mehnat.uz', tag: 'Труд', hot: true },
      { icon: '🔍', title: 'ish.uz', desc: 'Национальная биржа труда — поиск вакансий, регистрация безработных', url: 'https://ish.uz', tag: 'Вакансии' },
      { icon: '🧑‍🦳', title: 'pension.uz', desc: 'Внебюджетный пенсионный фонд: взносы, пенсионные начисления', url: 'https://pension.uz', tag: 'ПФ' },
      { icon: '💊', title: 'ssv.uz', desc: 'Фонд социального страхования: больничные, взносы ГФСН', url: 'https://ssv.uz', tag: 'ГФСН' },
      { icon: '👨‍⚖️', title: 'inspector.uz', desc: 'Государственная инспекция по труду: проверки, жалобы', url: 'https://inspector.uz', tag: 'Инсп.' },
    ],
  },
  {
    id: 'edo',
    title: '📋 ЭДО, ЭЦП и электронная отчётность',
    items: [
      { icon: '🔏', title: 'e-imzo.uz', desc: 'E-Imzo — плагин ЭЦП, загрузка, диагностика, обновление', url: 'https://e-imzo.uz', tag: 'ЭЦП', hot: true },
      { icon: '🔗', title: 'didox.uz', desc: 'Система ЭДО: электронные счета-фактуры, акты, накладные', url: 'https://didox.uz', tag: 'ЭДО', hot: true },
      { icon: '📦', title: 'faktura.uz', desc: 'Платформа ЭСФ: выставление и получение электронных счетов', url: 'https://faktura.uz', tag: 'ЭСФ', hot: true },
      { icon: '📮', title: 'epost.uz', desc: 'Официальная электронная почта юрлиц для получения госписем', url: 'https://epost.uz', tag: 'Почта' },
      { icon: '📑', title: 'xujjat.uz', desc: 'Электронный документооборот Министерства юстиции', url: 'https://xujjat.uz', tag: 'ЭДО' },
      { icon: '📲', title: 'unidoc.uz', desc: 'UniDoc — система ЭДО для корпоративного документооборота', url: 'https://unidoc.uz', tag: 'ЭДО' },
      { icon: '🗂', title: 'my.gov.uz — Госпочта', desc: 'Получение официальных уведомлений через ЕПИГУ', url: 'https://my.gov.uz', tag: 'Уведомл.' },
    ],
  },
  {
    id: 'customs',
    title: '🚢 ВЭД, таможня и сертификация',
    items: [
      { icon: '🛃', title: 'customs.uz', desc: 'Государственный таможенный комитет: тарифы, декларирование', url: 'https://customs.uz', tag: 'ГТК', hot: true },
      { icon: '🏛', title: 'tppuz.uz', desc: 'Торгово-промышленная палата РУз: сертификаты происхождения', url: 'https://tppuz.uz', tag: 'ТПП' },
      { icon: '✅', title: 'uzstandard.gov.uz', desc: 'Агентство по стандартизации, метрологии и сертификации', url: 'https://uzstandard.gov.uz', tag: 'Серт.' },
      { icon: '📊', title: 'uztrade.uz', desc: 'Торговые представительства РУз, реестр экспортёров', url: 'https://uztrade.uz', tag: 'ВЭД' },
      { icon: '🌐', title: 'ved.gov.uz', desc: 'Информационный портал ВЭД — лицензии, квоты, регламенты', url: 'https://ved.gov.uz', tag: 'ВЭД' },
      { icon: '🚛', title: 'uzlogistics.uz', desc: 'Логистика и транспорт — маршруты, ставки, брокеры', url: 'https://uzlogistics.uz', tag: 'Логист.' },
    ],
  },
  {
    id: 'banks',
    title: '🏦 Банки Узбекистана',
    items: [
      { icon: '🏦', title: 'nbu.uz (Нацбанк)', desc: 'Национальный банк РУз — ЛКН, кредиты, депозиты', url: 'https://nbu.uz', tag: 'Банк', hot: true },
      { icon: '🏦', title: 'kapitalbank.uz', desc: 'Капиталбанк — один из крупнейших банков, корп. обслуживание', url: 'https://kapitalbank.uz', tag: 'Банк' },
      { icon: '🏦', title: 'hamkorbank.uz', desc: 'Хамкорбанк — SME, ВЭД, агробизнес', url: 'https://hamkorbank.uz', tag: 'Банк' },
      { icon: '🏦', title: 'asaka.uz', desc: 'АСАКАбанк — автокредиты, корпоративный сегмент', url: 'https://asaka.uz', tag: 'Банк' },
      { icon: '🏦', title: 'ipak-yuli.uz', desc: 'Ипак Йули банк — обслуживание бизнеса, ВЭД', url: 'https://ipak-yuli.uz', tag: 'Банк' },
      { icon: '🏦', title: 'agrobank.uz', desc: 'АгроБанк — сельское хозяйство, малый бизнес', url: 'https://agrobank.uz', tag: 'Банк' },
      { icon: '🏦', title: 'aloqabank.uz', desc: 'Алоқабанк — телеком-сектор, МСБ, платежи', url: 'https://aloqabank.uz', tag: 'Банк' },
      { icon: '🏦', title: 'ipoteka-bank.uz', desc: 'Ипотека банк — жилищное и коммерческое кредитование', url: 'https://ipoteka-bank.uz', tag: 'Банк' },
      { icon: '🏦', title: 'turonbank.uz', desc: 'Туронбанк — корпоративное обслуживание, торговое финансирование', url: 'https://turonbank.uz', tag: 'Банк' },
      { icon: '🏦', title: 'davr-bank.uz', desc: 'Давр банк — частный банк, быстрые платежи', url: 'https://davr-bank.uz', tag: 'Банк' },
      { icon: '🏦', title: 'universalbank.uz', desc: 'Универсал банк — розница и корпоратив', url: 'https://universalbank.uz', tag: 'Банк' },
      { icon: '🏦', title: 'mikrokreditbank.uz', desc: 'Микрокредитбанк — государственный, господдержка МСБ', url: 'https://mikrokreditbank.uz', tag: 'Банк' },
      { icon: '🏦', title: 'ziraatbank.uz', desc: 'Зираат банк (Турция) — ВЭД с Турцией, LC, аккредитивы', url: 'https://ziraatbank.uz', tag: 'Банк' },
      { icon: '🏦', title: 'kdb.uz', desc: 'КДБ Банк Узбекистан (Корея) — ВЭД с Кореей, финансирование', url: 'https://kdb.uz', tag: 'Банк' },
    ],
  },
  {
    id: 'payments',
    title: '💳 Платёжные системы',
    items: [
      { icon: '✅', title: 'click.uz', desc: 'Click Business — оплата налогов, ГАИ, ЖКУ, зарплатные карты', url: 'https://click.uz', tag: 'Платежи', hot: true },
      { icon: '💳', title: 'business.payme.uz', desc: 'Payme Business — эквайринг, переводы, массовые выплаты', url: 'https://business.payme.uz', tag: 'Платежи', hot: true },
      { icon: '🔄', title: 'paynet.uz', desc: 'Paynet — приём платежей, терминалы, агентская сеть', url: 'https://paynet.uz', tag: 'Платежи' },
      { icon: '💳', title: 'uzcard.uz', desc: 'UzCard — национальная карточная система, интернет-эквайринг', url: 'https://uzcard.uz', tag: 'Карты' },
      { icon: '💳', title: 'multicard.uz', desc: 'Multicard — эквайринг, терминалы, корпоративные карты', url: 'https://multicard.uz', tag: 'Карты' },
      { icon: '📲', title: 'upay.uz', desc: 'Upay — мобильные платежи и переводы физлицам', url: 'https://upay.uz', tag: 'Платежи' },
      { icon: '🌐', title: 'nspk.uz', desc: 'Национальная межбанковская процессинговая система', url: 'https://nspk.uz', tag: 'НМПС' },
    ],
  },
  {
    id: 'software',
    title: '💻 Программное обеспечение для бухгалтера',
    items: [
      { icon: '🟡', title: '1c.uz', desc: '1С Узбекистан — дистрибьютор, обновления, патчи, поддержка', url: 'https://1c.uz', tag: '1С', hot: true },
      { icon: '🟡', title: 'inpro.uz', desc: 'ИН-ПРО — ведущий партнёр 1С в РУз, внедрение, обучение', url: 'https://inpro.uz', tag: '1С' },
      { icon: '🟡', title: 'bestcomp.uz', desc: 'Бест Компьютерс — партнёр 1С, ERP-решения для РУз', url: 'https://bestcomp.uz', tag: '1С' },
      { icon: '⚙️', title: 'perfectum.uz', desc: 'Perfectum ERP — облачная система учёта для бизнеса в РУз', url: 'https://perfectum.uz', tag: 'ERP' },
      { icon: '⚙️', title: 'unicon.uz', desc: 'Юникон — автоматизация учёта, консалтинг, аудит', url: 'https://unicon.uz', tag: 'Учёт' },
      { icon: '☁️', title: 'assistent.uz', desc: '1С Ассистент онлайн — справки, поддержка пользователей 1С', url: 'https://assistent.uz', tag: '1С' },
      { icon: '📊', title: 'galaktika.uz', desc: 'Галактика ERP — комплексная автоматизация крупного бизнеса', url: 'https://galaktika.uz', tag: 'ERP' },
    ],
  },
  {
    id: 'resources',
    title: '📚 Профессиональные ресурсы и Telegram',
    items: [
      { icon: '📖', title: 'buxgalter.uz', desc: 'Главный портал бухгалтеров РУз: статьи, консультации, шаблоны', url: 'https://buxgalter.uz', tag: 'Учёт', hot: true },
      { icon: '📰', title: 'norma.uz', desc: 'Norma — НПА с комментариями, правовой консалтинг', url: 'https://norma.uz', tag: 'НПА', hot: true },
      { icon: '💬', title: 'review.uz', desc: 'Аналитика и разъяснения налогового законодательства РУз', url: 'https://review.uz', tag: 'Аналит.' },
      { icon: '📝', title: 'nalog.uz', desc: 'Nalog.uz — практические советы по налогам и бухучёту', url: 'https://nalog.uz', tag: 'Налоги' },
      { icon: '🎓', title: 'iab.uz', desc: 'Институт бухгалтеров и аудиторов — сертификация, обучение', url: 'https://iab.uz', tag: 'Обучение' },
      { icon: '📱', title: 'TG: @norma_uz', desc: 'Telegram-канал Norma.uz — изменения НПА в режиме реального времени', url: 'https://t.me/norma_uz', tag: 'TG', hot: true },
      { icon: '📱', title: 'TG: @buxgalter_uz', desc: 'Telegram-канал Buxgalter.uz — советы, вопросы-ответы', url: 'https://t.me/buxgalter_uz', tag: 'TG' },
      { icon: '📱', title: 'TG: @soliq_mutaxassisi', desc: 'Telegram: вопросы специалистам ГНК по налогообложению', url: 'https://t.me/soliq_mutaxassisi', tag: 'TG' },
      { icon: '📱', title: 'TG: @mehnat_uz', desc: 'Telegram Министерства занятости — трудовое законодательство', url: 'https://t.me/mehnat_uz', tag: 'TG' },
      { icon: '📱', title: 'TG: @cbu_uz', desc: 'Telegram Центробанка — ставки, курсы, новости ЦБ РУз', url: 'https://t.me/cbu_uz', tag: 'TG' },
    ],
  },
];

export const BUNDLED_SECTION_IDS = SECTIONS.map(s => s.id);
