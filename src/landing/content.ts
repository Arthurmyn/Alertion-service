import { LIMITS } from '../data/limits.ts';
import { developers, productOwner, scrumMaster } from '../data/team.ts';

export const appHome = '/app';
export const appLogin = '/app/login';
export const appDefense = '/app/defense';
export const appSecurity = '/app/manage/security';

export type Locale = 'ru' | 'en';
export const locales: readonly Locale[] = ['ru', 'en'];

export const anchors = ['#how', '#features', '#verify', '#team'] as const;

export type Readiness = 'full' | 'half' | 'none';
export type CheckState = 'pass' | 'fail' | 'skipped';
export type Risk = 'done' | 'medium' | 'high';

export interface Heading {
  first: string;
  second: string;
}

export interface Copy {
  title: string;
  brandLabel: string;
  navLabel: string;
  footerNavLabel: string;
  languageLabel: string;
  nav: readonly string[];
  open: string;
  hero: { line1: string; line2: string; subline: string };
  planLabel: string;
  planFacts: readonly string[];
  how: {
    heading: Heading;
    lead: string;
    steps: readonly { title: string; text: string }[];
  };
  publish: {
    label: string;
    active: string;
    candidate: string;
    previous: string;
    publishBtn: string;
    rollbackBtn: string;
    confirmTitle: string;
    confirmText: string;
    confirm: string;
    cancel: string;
    statusA: string;
    statusB: string;
    caption: string;
  };
  features: {
    heading: Heading;
    items: readonly {
      title: string;
      text: string;
      points: readonly string[];
    }[];
    more: readonly { term: string; text: string }[];
  };
  checks: {
    file: string;
    rows: readonly { title: string; state: CheckState; note: string }[];
    result: string;
    skipped: string;
  };
  usage: {
    label: string;
    sites: string;
    storage: string;
    archive: string;
    states: readonly string[];
    current: string;
    unit: string;
  };
  risk: {
    label: string;
    legend: Record<Risk, string>;
    cards: readonly { title: string; level: Risk; note: string }[];
  };
  verify: {
    heading: Heading;
    lead: string;
    path: readonly {
      step: string;
      state: string;
      level: Readiness;
      note: string;
    }[];
    principle: string;
    link: string;
  };
  team: {
    heading: Heading;
    lead: string;
    link: string;
    rows: readonly { term: string; names: readonly string[] }[];
  };
  closing: { title: string; text: string };
  footer: { service: string; defense: string; top: string };
}

const people = [
  { term: productOwner.role, names: [productOwner.name] },
  { term: scrumMaster.role, names: [scrumMaster.name] },
] as const;
const developerNames = developers.map((person) => person.name);

const ru: Copy = {
  title: 'Alertion: хостинг сайтов, который можно проверить',
  brandLabel: 'Alertion, на главную',
  navLabel: 'Разделы страницы',
  footerNavLabel: 'Ссылки внизу страницы',
  languageLabel: 'Язык',
  nav: ['Как это работает', 'Возможности', 'Проверяемость', 'Команда'],
  open: 'Открыть сервис',
  hero: {
    line1: 'Хостинг сайтов,',
    line2: 'который можно проверить.',
    subline:
      'Загрузка архива, предпросмотр, подтверждённая публикация и откат. Следующий шаг: доказать, что в продакшене именно ваш код.',
  },
  planLabel: 'Пилотный план',
  planFacts: [
    `${LIMITS.sites} сайт`,
    `архив до ${LIMITS.archiveMb} МБ`,
    `версия до ${LIMITS.unpackedMb} МБ`,
    `хранилище ${LIMITS.storageMb} МБ`,
  ],
  how: {
    heading: { first: 'От архива до публикации', second: 'за пять шагов.' },
    lead: 'Путь, который проходит владелец малого бизнеса. Каждый шаг можно проверить в демо на странице защиты проекта.',
    steps: [
      {
        title: 'Загрузить архив',
        text: 'Выберите ZIP с сайтом. В прототипе архив выбирается из готовых образцов: файл с компьютера не открывается.',
      },
      {
        title: 'Проверить',
        text: 'Размер архива, index.html в корне, небезопасные пути, размер распакованной версии и остаток хранилища.',
      },
      {
        title: 'Посмотреть предпросмотр',
        text: 'Новая версия открывается как кандидат. Активная версия не меняется, пока вы её не подтвердите.',
      },
      {
        title: 'Опубликовать',
        text: 'Публикация идёт через диалог подтверждения. Если она не удалась, активной остаётся прежняя версия.',
      },
      {
        title: 'Откатить',
        text: 'Предыдущая версия возвращается одним действием. Если её нет, кнопка отключена и объясняет почему.',
      },
    ],
  },
  publish: {
    label: 'Версии сайта',
    active: 'Активна',
    candidate: 'Кандидат',
    previous: 'Предыдущая',
    publishBtn: 'Опубликовать версию B',
    rollbackBtn: 'Откатить на версию A',
    confirmTitle: 'Опубликовать версию B?',
    confirmText:
      'Сейчас активна версия A. После подтверждения активной станет версия B.',
    confirm: 'Подтвердить',
    cancel: 'Отмена',
    statusA: 'Активна версия A. Попробуйте опубликовать B.',
    statusB: 'Активна версия B. Версию A можно вернуть одним действием.',
    caption:
      'Это модель, а не запись экрана: нажмите кнопки и пройдите шаги 4 и 5.',
  },
  features: {
    heading: { first: 'Что уже работает', second: 'в прототипе.' },
    items: [
      {
        title: 'Проверка архива до публикации',
        text: 'Отказ называет причину и следующий шаг и никогда не меняет активную версию. Проверки идут в строгом порядке, поэтому одна и та же ошибка всегда выглядит одинаково.',
        points: [
          `Архив не больше ${LIMITS.archiveMb} МБ`,
          'index.html лежит в корне',
          'Нет небезопасных путей',
          `Распакованная версия не больше ${LIMITS.unpackedMb} МБ`,
          `Все версии вместе не больше ${LIMITS.storageMb} МБ`,
        ],
      },
      {
        title: 'Панель проектов, как у привычных платформ',
        text: 'Использование лимитов, уведомления, предпросмотры и проекты на одном экране. Остальное в боковой панели: развёртывания, наблюдаемость, безопасность, сеть и инфраструктура. Поиск по страницам и проектам открывается клавишей F.',
        points: [
          'У каждого проекта свои вкладки',
          'Статус публикации и результат проверки показаны отдельно',
          'Состояния: проверено, не пройдено, ожидает, недоступно',
        ],
      },
      {
        title: 'Панель безопасности без приукрашивания',
        text: 'Она показывает, чего прототипу не хватает до проверяемого запуска, и что уже работает. Результат проверки не появится, пока нет данных, которые его подтверждают.',
        points: [
          'Высокий и средний риск названы прямо',
          '«Выполнено» стоит только у того, что есть в интерфейсе',
          'Каждая карточка ведёт к нужному разделу',
        ],
      },
    ],
    more: [
      {
        term: 'Домен',
        text: 'Указать имя, добавить TXT-запись, проверить, активировать, создать CNAME, получить HTTPS. Проверка DNS и сертификат симулируются, значения помечены как примеры.',
      },
      {
        term: 'Владение',
        text: 'Страницы управления открывает только владелец сайта, чужой аккаунт получает отказ. Проверка выполняется в браузере и не заменяет серверную.',
      },
      {
        term: 'Пилотный план',
        text: 'Один сайт на аккаунт, лимиты на архив, версию и хранилище. Попытка создать второй сайт отклоняется с объяснением.',
      },
    ],
  },
  checks: {
    file: 'nan-no-index.zip',
    rows: [
      {
        title: `Архив не больше ${LIMITS.archiveMb} МБ`,
        state: 'pass',
        note: 'Размер в пределах лимита',
      },
      {
        title: 'index.html лежит в корне',
        state: 'fail',
        note: 'Файл не найден. Добавьте index.html в корень и загрузите архив снова.',
      },
      { title: 'Нет небезопасных путей', state: 'skipped', note: '' },
      {
        title: `Распакованная версия не больше ${LIMITS.unpackedMb} МБ`,
        state: 'skipped',
        note: '',
      },
      {
        title: `Все версии не больше ${LIMITS.storageMb} МБ`,
        state: 'skipped',
        note: '',
      },
    ],
    result: 'Архив отклонён. Активная версия не изменилась.',
    skipped: 'не запускалась',
  },
  usage: {
    label: 'Использование',
    sites: 'Сайты',
    storage: 'Хранилище',
    archive: 'Последний архив',
    states: ['Проверено', 'Не пройдено', 'Ожидает', 'Недоступно'],
    current: 'Сейчас',
    unit: 'МБ',
  },
  risk: {
    label: 'Готовность к проверяемому запуску',
    legend: { done: 'Выполнено', medium: 'Средний риск', high: 'Высокий риск' },
    cards: [
      {
        title: 'Доступ',
        level: 'done',
        note: 'Страницы управления открывает владелец',
      },
      {
        title: 'Исходный код',
        level: 'high',
        note: 'Нет git: репозиторий не подключается',
      },
      {
        title: 'Аттестации',
        level: 'high',
        note: 'Нет анклава и источника аттестации',
      },
    ],
  },
  verify: {
    heading: { first: 'Не просто «опубликовано»,', second: 'а «проверено».' },
    lead: 'Идея платформы: подтвердить, что в продакшене работает именно проверенный исходный код, сборка и конфигурация. Прототип проходит только часть пути, и мы показываем это прямо.',
    path: [
      {
        step: 'Подключить GitHub',
        state: 'Недоступно',
        level: 'none',
        note: 'Интеграции с git нет: репозиторий не подключается.',
      },
      {
        step: 'Собрать',
        state: 'Частично',
        level: 'half',
        note: 'Архив проверяется на лимиты, но не собирается из исходников.',
      },
      {
        step: 'Развернуть',
        state: 'Доступно',
        level: 'full',
        note: 'Предпросмотр, публикация и откат версий на тестовых данных.',
      },
      {
        step: 'Аттестовать',
        state: 'Недоступно',
        level: 'none',
        note: 'Нужны защищённый анклав и аппаратная аттестация.',
      },
      {
        step: 'Проверить',
        state: 'Недоступно',
        level: 'none',
        note: 'Нужен проверяющий, который сверяет аттестацию с исходным кодом.',
      },
    ],
    principle:
      'Статус «Проверено» не появится, пока нет данных аттестации. Сейчас у прототипа нет git, анклава и источника аттестации, поэтому везде написано «Проверка недоступна».',
    link: 'Посмотреть панель безопасности',
  },
  team: {
    heading: { first: 'Учебный проект,', second: 'не коммерческий.' },
    lead: 'Мы делали Alertion как командный проект по Scrum: цели, результаты и журнал доказательств собраны на странице защиты.',
    link: 'Страница защиты проекта',
    rows: [
      ...people,
      { term: 'Разработка', names: developerNames },
      { term: 'Преподаватель', names: ['Zhansaya Shinbergenova'] },
      { term: 'Срок', names: ['28.10.2026–17.11.2026'] },
    ],
  },
  closing: {
    title: 'Пройдите путь сами.',
    text: 'Регистрации нет: два вымышленных аккаунта, пароля нет, всё это симуляция.',
  },
  footer: { service: 'Сервис', defense: 'Защита проекта', top: 'Наверх' },
};

const en: Copy = {
  title: 'Alertion: website hosting you can verify',
  brandLabel: 'Alertion, home',
  navLabel: 'Page sections',
  footerNavLabel: 'Footer links',
  languageLabel: 'Language',
  nav: ['How it works', 'Features', 'Verifiability', 'Team'],
  open: 'Open the service',
  hero: {
    line1: 'Website hosting',
    line2: 'you can verify.',
    subline:
      'Archive upload, preview, confirmed publishing and rollback. The next step: proving that your exact code is what runs in production.',
  },
  planLabel: 'Pilot plan',
  planFacts: [
    `${LIMITS.sites} site`,
    `archive up to ${LIMITS.archiveMb} MB`,
    `version up to ${LIMITS.unpackedMb} MB`,
    `${LIMITS.storageMb} MB storage`,
  ],
  how: {
    heading: { first: 'From archive to publishing', second: 'in five steps.' },
    lead: 'The path a small business owner takes. Every step can be tried in the demo on the project defense page.',
    steps: [
      {
        title: 'Upload an archive',
        text: 'Pick a ZIP with your site. In the prototype the archive comes from ready-made samples: files from your computer are not opened.',
      },
      {
        title: 'Check',
        text: 'Archive size, index.html in the root, unsafe paths, unpacked size and the storage that is left.',
      },
      {
        title: 'Preview',
        text: 'The new version opens as a candidate. The active version stays as it is until you confirm.',
      },
      {
        title: 'Publish',
        text: 'Publishing goes through a confirmation dialog. If it fails, the previous version stays active.',
      },
      {
        title: 'Roll back',
        text: 'The previous version returns in one action. If there is none, the button is disabled and says why.',
      },
    ],
  },
  publish: {
    label: 'Site versions',
    active: 'Active',
    candidate: 'Candidate',
    previous: 'Previous',
    publishBtn: 'Publish version B',
    rollbackBtn: 'Roll back to version A',
    confirmTitle: 'Publish version B?',
    confirmText:
      'Version A is active now. After you confirm, version B becomes active.',
    confirm: 'Confirm',
    cancel: 'Cancel',
    statusA: 'Version A is active. Try publishing B.',
    statusB: 'Version B is active. Version A can come back in one action.',
    caption:
      'This is a model, not a screen recording: press the buttons and walk through steps 4 and 5.',
  },
  features: {
    heading: { first: 'What already works', second: 'in the prototype.' },
    items: [
      {
        title: 'Archive checks before publishing',
        text: 'A rejection names the reason and the next step and never changes the active version. Checks run in a strict order, so the same error always looks the same.',
        points: [
          `Archive up to ${LIMITS.archiveMb} MB`,
          'index.html is in the root',
          'No unsafe paths',
          `Unpacked version up to ${LIMITS.unpackedMb} MB`,
          `All versions together up to ${LIMITS.storageMb} MB`,
        ],
      },
      {
        title: 'A project dashboard, like the platforms you know',
        text: 'Limit usage, notifications, previews and projects on one screen. The rest lives in the sidebar: deployments, observability, security, networking and infrastructure. Search across pages and projects opens with the F key.',
        points: [
          'Every project has its own tabs',
          'Publishing status and the check result are shown separately',
          'States: verified, failed, pending, unavailable',
        ],
      },
      {
        title: 'A security panel without sugarcoating',
        text: 'It shows what the prototype lacks before a verifiable launch, and what already works. A verification result will not appear until there is data to back it.',
        points: [
          'High and medium risks are named directly',
          '“Done” appears only next to what exists in the interface',
          'Each card leads to the right section',
        ],
      },
    ],
    more: [
      {
        term: 'Domain',
        text: 'Enter a name, add a TXT record, check it, activate, create a CNAME, get HTTPS. The DNS check and the certificate are simulated, and the values are marked as examples.',
      },
      {
        term: 'Ownership',
        text: 'Only the site owner can open the management pages; another account is denied. The check runs in the browser and does not replace a server-side one.',
      },
      {
        term: 'Pilot plan',
        text: 'One site per account, with limits on the archive, the version and the storage. Creating a second site is rejected with an explanation.',
      },
    ],
  },
  checks: {
    file: 'nan-no-index.zip',
    rows: [
      {
        title: `Archive up to ${LIMITS.archiveMb} MB`,
        state: 'pass',
        note: 'Size is within the limit',
      },
      {
        title: 'index.html is in the root',
        state: 'fail',
        note: 'File not found. Add index.html to the root and upload the archive again.',
      },
      { title: 'No unsafe paths', state: 'skipped', note: '' },
      {
        title: `Unpacked version up to ${LIMITS.unpackedMb} MB`,
        state: 'skipped',
        note: '',
      },
      {
        title: `All versions up to ${LIMITS.storageMb} MB`,
        state: 'skipped',
        note: '',
      },
    ],
    result: 'Archive rejected. The active version did not change.',
    skipped: 'not run',
  },
  usage: {
    label: 'Usage',
    sites: 'Sites',
    storage: 'Storage',
    archive: 'Latest archive',
    states: ['Verified', 'Failed', 'Pending', 'Unavailable'],
    current: 'Now',
    unit: 'MB',
  },
  risk: {
    label: 'Readiness for a verifiable launch',
    legend: { done: 'Done', medium: 'Medium risk', high: 'High risk' },
    cards: [
      {
        title: 'Access',
        level: 'done',
        note: 'Management pages open for the owner',
      },
      {
        title: 'Source code',
        level: 'high',
        note: 'No git: a repository cannot be connected',
      },
      {
        title: 'Attestations',
        level: 'high',
        note: 'No enclave and no attestation source',
      },
    ],
  },
  verify: {
    heading: { first: 'Not just “published,”', second: 'but “verified.”' },
    lead: 'The idea of the platform: to confirm that production runs exactly the verified source code, build and configuration. The prototype covers only part of the path, and says so plainly.',
    path: [
      {
        step: 'Connect GitHub',
        state: 'Unavailable',
        level: 'none',
        note: 'There is no git integration: a repository cannot be connected.',
      },
      {
        step: 'Build',
        state: 'Partial',
        level: 'half',
        note: 'The archive is checked against limits but not built from source.',
      },
      {
        step: 'Deploy',
        state: 'Available',
        level: 'full',
        note: 'Preview, publishing and rollback of versions on test data.',
      },
      {
        step: 'Attest',
        state: 'Unavailable',
        level: 'none',
        note: 'Needs a secure enclave and hardware attestation.',
      },
      {
        step: 'Verify',
        state: 'Unavailable',
        level: 'none',
        note: 'Needs a verifier that matches the attestation to the source code.',
      },
    ],
    principle:
      'The “Verified” status will not appear until there is attestation data. The prototype has no git, no enclave and no attestation source, so everywhere it says “Verification unavailable.”',
    link: 'Open the security panel',
  },
  team: {
    heading: { first: 'A student project,', second: 'not commercial.' },
    lead: 'We built Alertion as a team Scrum project: goals, results and the evidence log are collected on the defense page.',
    link: 'Project defense page',
    rows: [
      ...people,
      { term: 'Development', names: developerNames },
      { term: 'Instructor', names: ['Zhansaya Shinbergenova'] },
      { term: 'Timeline', names: ['28.10.2026–17.11.2026'] },
    ],
  },
  closing: {
    title: 'Walk the path yourself.',
    text: 'No sign-up: two fictional accounts, no password, and all of it is a simulation.',
  },
  footer: {
    service: 'Service',
    defense: 'Project defense',
    top: 'Back to top',
  },
};

export const copy: Record<Locale, Copy> = { ru, en };
