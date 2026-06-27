export interface TemplateVar {
  key: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'textarea' | 'select';
  placeholder?: string;
  default?: string;
  options?: string[];
  hint?: string;
}

export interface DocTemplate {
  id: string;
  category: string;
  icon: string;
  title: string;
  description: string;
  vars: TemplateVar[];
  body: string;
}

export const TEMPLATE_CATEGORIES = [
  'Все',
  'Договоры',
  'Акты и счета',
  'Кадровые приказы',
  'Доверенности',
  'ВЭД',
];

export const TEMPLATES: DocTemplate[] = [
  // ─── ДОГОВОРЫ ────────────────────────────────────────────────────────────
  {
    id: 'contract-sale',
    category: 'Договоры',
    icon: '🛒',
    title: 'Договор купли-продажи',
    description: 'Купля-продажа товаров между юридическими лицами',
    vars: [
      { key: 'contract_num', label: 'Номер договора', type: 'text', placeholder: '01/2026' },
      { key: 'contract_date', label: 'Дата договора', type: 'date', default: new Date().toISOString().slice(0,10) },
      { key: 'city', label: 'Город', type: 'text', placeholder: 'Ташкент', default: 'Ташкент' },
      { key: 'seller_name', label: 'Продавец — наименование', type: 'text', placeholder: 'ООО "Компания"' },
      { key: 'seller_tin', label: 'ИНН продавца', type: 'text', placeholder: '123456789' },
      { key: 'seller_rep', label: 'Представитель продавца (ФИО)', type: 'text', placeholder: 'Иванов И.И.' },
      { key: 'seller_role', label: 'Должность представителя', type: 'text', placeholder: 'Директор', default: 'Директор' },
      { key: 'buyer_name', label: 'Покупатель — наименование', type: 'text', placeholder: 'ООО "Покупатель"' },
      { key: 'buyer_tin', label: 'ИНН покупателя', type: 'text', placeholder: '987654321' },
      { key: 'buyer_rep', label: 'Представитель покупателя (ФИО)', type: 'text', placeholder: 'Петров П.П.' },
      { key: 'buyer_role', label: 'Должность представителя', type: 'text', placeholder: 'Директор', default: 'Директор' },
      { key: 'goods', label: 'Наименование товара', type: 'text', placeholder: 'Компьютерная техника' },
      { key: 'amount', label: 'Сумма договора (цифрами)', type: 'number', placeholder: '10000000' },
      { key: 'amount_words', label: 'Сумма прописью', type: 'text', placeholder: 'Десять миллионов сум' },
      { key: 'currency', label: 'Валюта', type: 'select', options: ['сум', 'USD (эквивалент в сумах)', 'EUR (эквивалент в сумах)'], default: 'сум' },
      { key: 'vat', label: 'НДС', type: 'select', options: ['включен в стоимость (12%)', 'не облагается', 'сверх суммы (12%)'], default: 'включен в стоимость (12%)' },
      { key: 'delivery_days', label: 'Срок поставки (дней)', type: 'number', placeholder: '14', default: '14' },
      { key: 'warranty', label: 'Гарантийный срок (мес)', type: 'number', placeholder: '12', default: '12' },
      { key: 'valid_months', label: 'Срок действия договора (мес)', type: 'number', placeholder: '12', default: '12' },
    ],
    body: `ДОГОВОР КУПЛИ-ПРОДАЖИ № {{contract_num}}

г. {{city}}                                                        «{{contract_date_d}}» {{contract_date_m}} {{contract_date_y}} г.

{{seller_name}}, ИНН {{seller_tin}}, в лице {{seller_role}} {{seller_rep}}, именуемое в дальнейшем «Продавец», с одной стороны, и {{buyer_name}}, ИНН {{buyer_tin}}, в лице {{buyer_role}} {{buyer_rep}}, именуемое в дальнейшем «Покупатель», с другой стороны, заключили настоящий Договор о нижеследующем:

1. ПРЕДМЕТ ДОГОВОРА

1.1. Продавец обязуется передать в собственность Покупателю товар — {{goods}}, а Покупатель обязуется принять и оплатить его на условиях настоящего Договора.
1.2. Наименование, количество, ассортимент и цена товара указываются в Спецификации (Приложение № 1), являющейся неотъемлемой частью настоящего Договора.

2. ЦЕНА И ПОРЯДОК РАСЧЁТОВ

2.1. Общая стоимость товара по настоящему Договору составляет {{amount}} {{currency}}, {{amount_words}}. НДС {{vat}}.
2.2. Покупатель производит оплату в течение 5 (пяти) банковских дней с момента получения счёта-фактуры.
2.3. Оплата производится путём безналичного перечисления денежных средств на расчётный счёт Продавца.

3. ПОСТАВКА ТОВАРА

3.1. Продавец обязуется поставить товар в течение {{delivery_days}} ({{delivery_days_w}}) рабочих дней с момента получения предоплаты / подписания договора.
3.2. Место поставки: г. {{city}}, по согласованному адресу.
3.3. Риск случайной гибели или порча товара переходит к Покупателю с момента передачи товара.

4. КАЧЕСТВО И ГАРАНТИЯ

4.1. Товар должен соответствовать стандартам, техническим условиям и требованиям, установленным нормативными документами.
4.2. Гарантийный срок на товар составляет {{warranty}} месяцев с даты передачи.

5. ОТВЕТСТВЕННОСТЬ СТОРОН

5.1. За просрочку оплаты Покупатель уплачивает пени в размере 0,1% от неоплаченной суммы за каждый день просрочки.
5.2. За просрочку поставки Продавец уплачивает пени в размере 0,1% от стоимости непоставленного товара за каждый день просрочки.
5.3. Уплата неустойки не освобождает Стороны от исполнения обязательств по Договору.

6. ФОРС-МАЖОР

6.1. Стороны освобождаются от ответственности за частичное или полное неисполнение обязательств, если оно явилось следствием форс-мажорных обстоятельств.
6.2. О наступлении форс-мажора сторона обязана уведомить другую сторону в течение 5 дней.

7. КОНФИДЕНЦИАЛЬНОСТЬ

7.1. Стороны обязуются хранить в тайне условия настоящего Договора и не разглашать их третьим лицам без письменного согласия другой Стороны.

8. СРОК ДЕЙСТВИЯ И ПОРЯДОК РАСТОРЖЕНИЯ

8.1. Договор вступает в силу с момента подписания и действует {{valid_months}} месяцев.
8.2. Договор может быть расторгнут по соглашению Сторон или в судебном порядке.

9. РАЗРЕШЕНИЕ СПОРОВ

9.1. Споры разрешаются путём переговоров, а при недостижении согласия — в экономическом суде по месту нахождения ответчика в соответствии с законодательством Республики Узбекистан.

10. РЕКВИЗИТЫ И ПОДПИСИ СТОРОН

ПРОДАВЕЦ:                                    ПОКУПАТЕЛЬ:
{{seller_name}}                              {{buyer_name}}
ИНН: {{seller_tin}}                          ИНН: {{buyer_tin}}

___________________ / {{seller_rep}} /      ___________________ / {{buyer_rep}} /
М.П.                                         М.П.`,
  },

  {
    id: 'contract-services',
    category: 'Договоры',
    icon: '🤝',
    title: 'Договор на оказание услуг',
    description: 'Оказание услуг (консультационных, бухгалтерских, IT и др.)',
    vars: [
      { key: 'contract_num', label: 'Номер договора', type: 'text', placeholder: '02/2026' },
      { key: 'contract_date', label: 'Дата договора', type: 'date', default: new Date().toISOString().slice(0,10) },
      { key: 'city', label: 'Город', type: 'text', default: 'Ташкент' },
      { key: 'provider_name', label: 'Исполнитель — наименование', type: 'text', placeholder: 'ООО "Сервис"' },
      { key: 'provider_tin', label: 'ИНН исполнителя', type: 'text', placeholder: '111222333' },
      { key: 'provider_rep', label: 'ФИО представителя исполнителя', type: 'text', placeholder: 'Алиев А.А.' },
      { key: 'client_name', label: 'Заказчик — наименование', type: 'text', placeholder: 'ООО "Заказчик"' },
      { key: 'client_tin', label: 'ИНН заказчика', type: 'text', placeholder: '444555666' },
      { key: 'client_rep', label: 'ФИО представителя заказчика', type: 'text', placeholder: 'Юсупов Ю.Ю.' },
      { key: 'service_desc', label: 'Описание услуг', type: 'textarea', placeholder: 'Ведение бухгалтерского учёта, составление отчётности...' },
      { key: 'amount', label: 'Стоимость (в месяц / разово)', type: 'number', placeholder: '2000000' },
      { key: 'payment_type', label: 'Тип оплаты', type: 'select', options: ['ежемесячно', 'единовременно', 'поэтапно'], default: 'ежемесячно' },
      { key: 'start_date', label: 'Дата начала', type: 'date' },
      { key: 'end_date', label: 'Дата окончания', type: 'date' },
    ],
    body: `ДОГОВОР НА ОКАЗАНИЕ УСЛУГ № {{contract_num}}

г. {{city}}                                                        «{{contract_date_d}}» {{contract_date_m}} {{contract_date_y}} г.

{{provider_name}}, ИНН {{provider_tin}}, в лице {{provider_rep}}, именуемое далее «Исполнитель», и {{client_name}}, ИНН {{client_tin}}, в лице {{client_rep}}, именуемое далее «Заказчик», заключили настоящий Договор о нижеследующем:

1. ПРЕДМЕТ ДОГОВОРА

1.1. Исполнитель обязуется оказать Заказчику следующие услуги:
{{service_desc}}

1.2. Заказчик обязуется принять и оплатить оказанные услуги на условиях настоящего Договора.

2. СТОИМОСТЬ И ПОРЯДОК РАСЧЁТОВ

2.1. Стоимость услуг составляет {{amount}} сум ({{payment_type}}).
2.2. Оплата производится в течение 5 банковских дней после подписания акта выполненных работ.
2.3. НДС включён в стоимость услуг (12%).

3. ПРАВА И ОБЯЗАННОСТИ СТОРОН

3.1. Исполнитель обязан:
- оказывать услуги качественно и в срок;
- информировать Заказчика о ходе исполнения;
- соблюдать конфиденциальность.

3.2. Заказчик обязан:
- предоставлять необходимые документы и информацию;
- подписывать акты выполненных работ в течение 3 рабочих дней;
- своевременно производить оплату.

4. СРОКИ ОКАЗАНИЯ УСЛУГ

4.1. Срок оказания услуг: с {{start_date}} по {{end_date}}.
4.2. Договор может быть пролонгирован по соглашению Сторон.

5. ОТВЕТСТВЕННОСТЬ И СПОРЫ

5.1. За просрочку оплаты — пени 0,1% от суммы задолженности за каждый день.
5.2. Споры разрешаются в экономическом суде РУз.

РЕКВИЗИТЫ И ПОДПИСИ:

ИСПОЛНИТЕЛЬ:                                 ЗАКАЗЧИК:
{{provider_name}}                            {{client_name}}
ИНН: {{provider_tin}}                        ИНН: {{client_tin}}

___________________ / {{provider_rep}} /    ___________________ / {{client_rep}} /
М.П.                                         М.П.`,
  },

  {
    id: 'contract-rent',
    category: 'Договоры',
    icon: '🏢',
    title: 'Договор аренды помещения',
    description: 'Аренда нежилого помещения (офис, склад, торговая площадь)',
    vars: [
      { key: 'contract_num', label: 'Номер договора', type: 'text', placeholder: '03/2026' },
      { key: 'contract_date', label: 'Дата договора', type: 'date', default: new Date().toISOString().slice(0,10) },
      { key: 'city', label: 'Город', type: 'text', default: 'Ташкент' },
      { key: 'landlord_name', label: 'Арендодатель — наименование', type: 'text', placeholder: 'ООО "Владелец"' },
      { key: 'landlord_tin', label: 'ИНН арендодателя', type: 'text', placeholder: '111000111' },
      { key: 'landlord_rep', label: 'ФИО директора арендодателя', type: 'text', placeholder: 'Каримов К.К.' },
      { key: 'tenant_name', label: 'Арендатор — наименование', type: 'text', placeholder: 'ООО "Арендатор"' },
      { key: 'tenant_tin', label: 'ИНН арендатора', type: 'text', placeholder: '222000222' },
      { key: 'tenant_rep', label: 'ФИО директора арендатора', type: 'text', placeholder: 'Рахимов Р.Р.' },
      { key: 'address', label: 'Адрес объекта', type: 'text', placeholder: 'г. Ташкент, ул. Навои, 1' },
      { key: 'area', label: 'Площадь (кв.м)', type: 'number', placeholder: '50' },
      { key: 'purpose', label: 'Цель использования', type: 'text', placeholder: 'офис', default: 'офис' },
      { key: 'rent_month', label: 'Арендная плата в месяц (сум)', type: 'number', placeholder: '5000000' },
      { key: 'start_date', label: 'Начало аренды', type: 'date' },
      { key: 'end_date', label: 'Окончание аренды', type: 'date' },
      { key: 'deposit', label: 'Депозит (сум, 0 если нет)', type: 'number', placeholder: '0', default: '0' },
    ],
    body: `ДОГОВОР АРЕНДЫ НЕЖИЛОГО ПОМЕЩЕНИЯ № {{contract_num}}

г. {{city}}                                                        «{{contract_date_d}}» {{contract_date_m}} {{contract_date_y}} г.

{{landlord_name}}, ИНН {{landlord_tin}}, в лице директора {{landlord_rep}}, именуемое далее «Арендодатель», и {{tenant_name}}, ИНН {{tenant_tin}}, в лице директора {{tenant_rep}}, именуемое далее «Арендатор», заключили настоящий Договор о нижеследующем:

1. ПРЕДМЕТ ДОГОВОРА

1.1. Арендодатель передаёт, а Арендатор принимает во временное пользование нежилое помещение, расположенное по адресу: {{address}}, общей площадью {{area}} кв.м.
1.2. Помещение предоставляется для использования в качестве: {{purpose}}.
1.3. Техническое состояние помещения на момент передачи Стороны фиксируют Актом приёма-передачи.

2. СРОК АРЕНДЫ

2.1. Договор заключён на срок с {{start_date}} по {{end_date}}.
2.2. Если ни одна из Сторон не заявит о прекращении Договора за 30 дней до окончания срока, договор считается пролонгированным на тот же срок.

3. АРЕНДНАЯ ПЛАТА

3.1. Арендная плата составляет {{rent_month}} сум в месяц.
3.2. Арендатор вносит плату не позднее 5-го числа текущего месяца.
3.3. Коммунальные услуги (электроэнергия, вода, газ) оплачиваются Арендатором отдельно по счётчикам.
3.4. Депозит: {{deposit}} сум (возвращается по истечении срока договора при отсутствии задолженности).

4. ПРАВА И ОБЯЗАННОСТИ СТОРОН

4.1. Арендодатель обязан передать помещение в надлежащем состоянии и обеспечить беспрепятственный доступ Арендатора.
4.2. Арендатор обязан:
- использовать помещение по назначению;
- поддерживать помещение в надлежащем состоянии;
- не производить перепланировку без согласия Арендодателя;
- своевременно вносить арендную плату.

5. ОТВЕТСТВЕННОСТЬ

5.1. При просрочке оплаты Арендатор уплачивает пени 0,1% от суммы задолженности за каждый день.
5.2. При досрочном расторжении по инициативе Арендатора — уведомление не менее чем за 30 дней.

6. РЕКВИЗИТЫ И ПОДПИСИ

АРЕНДОДАТЕЛЬ:                                АРЕНДАТОР:
{{landlord_name}}                            {{tenant_name}}
ИНН: {{landlord_tin}}                        ИНН: {{tenant_tin}}

___________________ / {{landlord_rep}} /    ___________________ / {{tenant_rep}} /
М.П.                                         М.П.`,
  },

  {
    id: 'contract-loan',
    category: 'Договоры',
    icon: '💰',
    title: 'Договор займа',
    description: 'Предоставление займа между юридическими лицами',
    vars: [
      { key: 'contract_num', label: 'Номер договора', type: 'text', placeholder: '04/2026' },
      { key: 'contract_date', label: 'Дата договора', type: 'date', default: new Date().toISOString().slice(0,10) },
      { key: 'city', label: 'Город', type: 'text', default: 'Ташкент' },
      { key: 'lender_name', label: 'Займодавец — наименование', type: 'text', placeholder: 'ООО "Кредитор"' },
      { key: 'lender_tin', label: 'ИНН займодавца', type: 'text', placeholder: '100200300' },
      { key: 'lender_rep', label: 'ФИО директора займодавца', type: 'text', placeholder: 'Хасанов Х.Х.' },
      { key: 'borrower_name', label: 'Заёмщик — наименование', type: 'text', placeholder: 'ООО "Заёмщик"' },
      { key: 'borrower_tin', label: 'ИНН заёмщика', type: 'text', placeholder: '300200100' },
      { key: 'borrower_rep', label: 'ФИО директора заёмщика', type: 'text', placeholder: 'Нишонов Н.Н.' },
      { key: 'amount', label: 'Сумма займа (цифрами)', type: 'number', placeholder: '50000000' },
      { key: 'amount_words', label: 'Сумма займа прописью', type: 'text', placeholder: 'Пятьдесят миллионов сум' },
      { key: 'rate', label: 'Процентная ставка (% годовых, 0 = беспроцентный)', type: 'number', placeholder: '0', default: '0' },
      { key: 'return_date', label: 'Дата возврата', type: 'date' },
      { key: 'purpose', label: 'Цель займа', type: 'text', placeholder: 'пополнение оборотных средств' },
    ],
    body: `ДОГОВОР ЗАЙМА № {{contract_num}}

г. {{city}}                                                        «{{contract_date_d}}» {{contract_date_m}} {{contract_date_y}} г.

{{lender_name}}, ИНН {{lender_tin}}, в лице директора {{lender_rep}}, именуемое далее «Займодавец», и {{borrower_name}}, ИНН {{borrower_tin}}, в лице директора {{borrower_rep}}, именуемое далее «Заёмщик», заключили настоящий Договор о нижеследующем:

1. ПРЕДМЕТ ДОГОВОРА

1.1. Займодавец передаёт в собственность Заёмщику денежные средства в размере {{amount}} сум ({{amount_words}}), а Заёмщик обязуется возвратить их в установленный срок.
1.2. Цель займа: {{purpose}}.
1.3. Заём является {{rate_type}}.

2. УСЛОВИЯ ЗАЙМА

2.1. Займодавец перечисляет сумму займа на расчётный счёт Заёмщика в течение 3 рабочих дней после подписания Договора.
2.2. Процентная ставка: {{rate}}% годовых.
2.3. Заёмщик обязуется возвратить сумму займа не позднее {{return_date}}.

3. ПОРЯДОК ВОЗВРАТА

3.1. Возврат займа осуществляется путём безналичного перечисления на расчётный счёт Займодавца.
3.2. Досрочный возврат займа допускается с предварительным уведомлением Займодавца не позднее чем за 5 рабочих дней.

4. ОТВЕТСТВЕННОСТЬ

4.1. При нарушении срока возврата Заёмщик уплачивает пени в размере 0,033% от суммы задолженности за каждый день просрочки.
4.2. Займодавец вправе потребовать досрочного возврата займа в случае ухудшения финансового положения Заёмщика.

5. ПРОЧИЕ УСЛОВИЯ

5.1. Споры разрешаются в экономическом суде РУз.
5.2. Договор составлен в двух экземплярах, имеющих одинаковую юридическую силу.

РЕКВИЗИТЫ И ПОДПИСИ:

ЗАЙМОДАВЕЦ:                                  ЗАЁМЩИК:
{{lender_name}}                              {{borrower_name}}
ИНН: {{lender_tin}}                          ИНН: {{borrower_tin}}

___________________ / {{lender_rep}} /      ___________________ / {{borrower_rep}} /
М.П.                                         М.П.`,
  },

  // ─── АКТЫ И СЧЕТА ────────────────────────────────────────────────────────
  {
    id: 'act-services',
    category: 'Акты и счета',
    icon: '📋',
    title: 'Акт выполненных работ',
    description: 'Акт приёмки выполненных работ / оказанных услуг',
    vars: [
      { key: 'act_num', label: 'Номер акта', type: 'text', placeholder: '15' },
      { key: 'act_date', label: 'Дата акта', type: 'date', default: new Date().toISOString().slice(0,10) },
      { key: 'contract_num', label: 'Номер договора', type: 'text', placeholder: '02/2026' },
      { key: 'contract_date', label: 'Дата договора', type: 'date' },
      { key: 'provider_name', label: 'Исполнитель', type: 'text', placeholder: 'ООО "Сервис"' },
      { key: 'provider_tin', label: 'ИНН исполнителя', type: 'text', placeholder: '111222333' },
      { key: 'provider_rep', label: 'ФИО представителя исполнителя', type: 'text', placeholder: 'Алиев А.А.' },
      { key: 'client_name', label: 'Заказчик', type: 'text', placeholder: 'ООО "Заказчик"' },
      { key: 'client_tin', label: 'ИНН заказчика', type: 'text', placeholder: '444555666' },
      { key: 'client_rep', label: 'ФИО представителя заказчика', type: 'text', placeholder: 'Юсупов Ю.Ю.' },
      { key: 'service_desc', label: 'Наименование работ/услуг', type: 'textarea', placeholder: 'Ведение бухгалтерского учёта за май 2026 г.' },
      { key: 'period', label: 'Период оказания услуг', type: 'text', placeholder: 'май 2026' },
      { key: 'amount_ex_vat', label: 'Сумма без НДС', type: 'number', placeholder: '1785714' },
      { key: 'vat_amount', label: 'Сумма НДС (12%)', type: 'number', placeholder: '214286' },
      { key: 'total', label: 'Итого с НДС', type: 'number', placeholder: '2000000' },
      { key: 'total_words', label: 'Итого прописью', type: 'text', placeholder: 'Два миллиона сум' },
    ],
    body: `АКТ ВЫПОЛНЕННЫХ РАБОТ (ОКАЗАННЫХ УСЛУГ) № {{act_num}}

Дата: «{{act_date_d}}» {{act_date_m}} {{act_date_y}} г.

К договору № {{contract_num}} от {{contract_date}} г.

Исполнитель: {{provider_name}}, ИНН {{provider_tin}}, в лице {{provider_rep}}
Заказчик:    {{client_name}}, ИНН {{client_tin}}, в лице {{client_rep}}

Исполнитель выполнил, а Заказчик принял следующие работы / услуги:

┌──────────────────────────────────────────────────────────┬──────────────┬──────────────────┐
│ Наименование работ (услуг)                               │ Период       │ Стоимость (сум)  │
├──────────────────────────────────────────────────────────┼──────────────┼──────────────────┤
│ {{service_desc}}                                         │ {{period}}   │ {{amount_ex_vat}} │
├──────────────────────────────────────────────────────────┼──────────────┼──────────────────┤
│ НДС (12%)                                                │              │ {{vat_amount}}   │
├──────────────────────────────────────────────────────────┼──────────────┼──────────────────┤
│ ИТОГО                                                    │              │ {{total}}        │
└──────────────────────────────────────────────────────────┴──────────────┴──────────────────┘

Итого к оплате: {{total}} сум ({{total_words}}).

Работы выполнены в полном объёме, в установленные сроки, Заказчик претензий не имеет.

ПОДПИСИ:

ИСПОЛНИТЕЛЬ:                                 ЗАКАЗЧИК:
{{provider_name}}                            {{client_name}}

___________________ / {{provider_rep}} /    ___________________ / {{client_rep}} /
М.П.                                         М.П.`,
  },

  {
    id: 'invoice',
    category: 'Акты и счета',
    icon: '🧾',
    title: 'Счёт на оплату',
    description: 'Счёт-заявка на оплату товаров или услуг',
    vars: [
      { key: 'invoice_num', label: 'Номер счёта', type: 'text', placeholder: '25' },
      { key: 'invoice_date', label: 'Дата счёта', type: 'date', default: new Date().toISOString().slice(0,10) },
      { key: 'seller_name', label: 'Поставщик', type: 'text', placeholder: 'ООО "Продавец"' },
      { key: 'seller_tin', label: 'ИНН поставщика', type: 'text', placeholder: '123456789' },
      { key: 'seller_bank', label: 'Банк поставщика', type: 'text', placeholder: 'АКБ "Ипотека-банк"' },
      { key: 'seller_account', label: 'Расчётный счёт', type: 'text', placeholder: '20208000900000000001' },
      { key: 'seller_mfo', label: 'МФО банка', type: 'text', placeholder: '00014' },
      { key: 'buyer_name', label: 'Покупатель', type: 'text', placeholder: 'ООО "Покупатель"' },
      { key: 'buyer_tin', label: 'ИНН покупателя', type: 'text', placeholder: '987654321' },
      { key: 'goods1', label: 'Товар/услуга 1', type: 'text', placeholder: 'Консультационные услуги' },
      { key: 'qty1', label: 'Кол-во', type: 'number', placeholder: '1', default: '1' },
      { key: 'price1', label: 'Цена за ед.', type: 'number', placeholder: '2000000' },
      { key: 'amount_ex_vat', label: 'Сумма без НДС', type: 'number', placeholder: '2000000' },
      { key: 'vat_amount', label: 'НДС (12%)', type: 'number', placeholder: '240000' },
      { key: 'total', label: 'Итого', type: 'number', placeholder: '2240000' },
      { key: 'total_words', label: 'Итого прописью', type: 'text', placeholder: 'Два миллиона двести сорок тысяч сум' },
      { key: 'pay_days', label: 'Срок оплаты (дней)', type: 'number', placeholder: '5', default: '5' },
    ],
    body: `СЧЁТ НА ОПЛАТУ № {{invoice_num}} от «{{invoice_date_d}}» {{invoice_date_m}} {{invoice_date_y}} г.

ПОСТАВЩИК:  {{seller_name}}
            ИНН: {{seller_tin}}
            Банк: {{seller_bank}}, МФО: {{seller_mfo}}
            Р/с: {{seller_account}}

ПОКУПАТЕЛЬ: {{buyer_name}}
            ИНН: {{buyer_tin}}

┌────────────────────────────────────────────┬────┬────────────────┬────────────────┐
│ Наименование товара / услуги               │Кол.│   Цена (сум)   │  Сумма (сум)   │
├────────────────────────────────────────────┼────┼────────────────┼────────────────┤
│ {{goods1}}                                 │ {{qty1}} │ {{price1}}  │ {{amount_ex_vat}} │
├────────────────────────────────────────────┴────┴────────────────┤────────────────┤
│ Итого без НДС:                                                   │ {{amount_ex_vat}} │
│ НДС (12%):                                                       │ {{vat_amount}} │
│ ИТОГО К ОПЛАТЕ:                                                  │ {{total}}      │
└──────────────────────────────────────────────────────────────────┴────────────────┘

{{total}} сум ({{total_words}}).

Срок оплаты: {{pay_days}} банковских дней с даты выставления счёта.

Директор: ___________________ / {{seller_name}} /   М.П.`,
  },

  {
    id: 'reconciliation',
    category: 'Акты и счета',
    icon: '⚖️',
    title: 'Акт сверки расчётов',
    description: 'Акт сверки взаимных расчётов между двумя организациями',
    vars: [
      { key: 'period_start', label: 'Период — начало', type: 'date' },
      { key: 'period_end', label: 'Период — конец', type: 'date', default: new Date().toISOString().slice(0,10) },
      { key: 'org1_name', label: 'Организация 1', type: 'text', placeholder: 'ООО "Альфа"' },
      { key: 'org1_tin', label: 'ИНН организации 1', type: 'text', placeholder: '111222333' },
      { key: 'org1_rep', label: 'ФИО представителя орг. 1', type: 'text', placeholder: 'Алиев А.А.' },
      { key: 'org2_name', label: 'Организация 2', type: 'text', placeholder: 'ООО "Бета"' },
      { key: 'org2_tin', label: 'ИНН организации 2', type: 'text', placeholder: '444555666' },
      { key: 'org2_rep', label: 'ФИО представителя орг. 2', type: 'text', placeholder: 'Бобров Б.Б.' },
      { key: 'balance_start', label: 'Сальдо начальное (сум)', type: 'number', placeholder: '0', default: '0' },
      { key: 'debit_total', label: 'Оборот дебет (отгружено/оказано)', type: 'number', placeholder: '5000000' },
      { key: 'credit_total', label: 'Оборот кредит (оплачено)', type: 'number', placeholder: '3000000' },
      { key: 'balance_end', label: 'Сальдо конечное (сум)', type: 'number', placeholder: '2000000' },
      { key: 'debtor', label: 'Кто должен', type: 'select', options: ['ООО "Бета" является должником', 'ООО "Альфа" является должником', 'Задолженность отсутствует'], default: 'ООО "Бета" является должником' },
    ],
    body: `АКТ СВЕРКИ ВЗАИМНЫХ РАСЧЁТОВ

за период с {{period_start}} по {{period_end}}

Составлен между:
{{org1_name}}, ИНН {{org1_tin}}, в лице {{org1_rep}} (далее — «Сторона 1»)
и
{{org2_name}}, ИНН {{org2_tin}}, в лице {{org2_rep}} (далее — «Сторона 2»)

По данным бухгалтерского учёта Стороны 1:

┌─────────────────────────────────────────────────────────────────────────────┐
│                         РАСЧЁТЫ С {{org2_name}}                             │
├────────────────────────────────────────┬────────────────────────────────────┤
│ ДЕБЕТ (отгружено / оказано услуг)      │ КРЕДИТ (получена оплата)           │
├────────────────────────────────────────┼────────────────────────────────────┤
│ Сальдо начальное: {{balance_start}} сум│                                    │
├────────────────────────────────────────┼────────────────────────────────────┤
│ Оборот: {{debit_total}} сум            │ Оборот: {{credit_total}} сум        │
├────────────────────────────────────────┴────────────────────────────────────┤
│ Сальдо конечное: {{balance_end}} сум                                        │
│ {{debtor}}                                                                  │
└─────────────────────────────────────────────────────────────────────────────┘

Стороны подтверждают, что вышеуказанные данные соответствуют данным бухгалтерского учёта.

Сторона 1:                                   Сторона 2:
{{org1_name}}                                {{org2_name}}

___________________ / {{org1_rep}} /        ___________________ / {{org2_rep}} /
М.П.                                         М.П.

Дата подписания: ___________________`,
  },

  // ─── КАДРОВЫЕ ПРИКАЗЫ ────────────────────────────────────────────────────
  {
    id: 'order-hire',
    category: 'Кадровые приказы',
    icon: '👤',
    title: 'Приказ о приёме на работу',
    description: 'Приказ о зачислении сотрудника в штат',
    vars: [
      { key: 'order_num', label: 'Номер приказа', type: 'text', placeholder: '1-К' },
      { key: 'order_date', label: 'Дата приказа', type: 'date', default: new Date().toISOString().slice(0,10) },
      { key: 'company_name', label: 'Наименование организации', type: 'text', placeholder: 'ООО "Компания"' },
      { key: 'emp_name', label: 'ФИО сотрудника', type: 'text', placeholder: 'Иванов Иван Иванович' },
      { key: 'position', label: 'Должность', type: 'text', placeholder: 'Бухгалтер' },
      { key: 'dept', label: 'Отдел / подразделение', type: 'text', placeholder: 'Бухгалтерия', default: 'Бухгалтерия' },
      { key: 'start_date', label: 'Дата выхода на работу', type: 'date' },
      { key: 'salary', label: 'Оклад (сум)', type: 'number', placeholder: '3000000' },
      { key: 'work_type', label: 'Тип занятости', type: 'select', options: ['основное место работы', 'совместительство (внутреннее)', 'совместительство (внешнее)'], default: 'основное место работы' },
      { key: 'probation', label: 'Испытательный срок', type: 'select', options: ['без испытательного срока', '1 месяц', '2 месяца', '3 месяца'], default: 'без испытательного срока' },
      { key: 'director_name', label: 'ФИО директора', type: 'text', placeholder: 'Каримов Карим Каримович' },
    ],
    body: `{{company_name}}

ПРИКАЗ № {{order_num}}-К
«{{order_date_d}}» {{order_date_m}} {{order_date_y}} г.

О ПРИЁМЕ НА РАБОТУ

ПРИКАЗЫВАЮ:

Принять {{emp_name}} на должность «{{position}}» в {{dept}} с {{start_date}} на {{work_type}}.

Установить должностной оклад в размере {{salary}} сум в месяц.

Испытательный срок: {{probation}}.

Основание: трудовой договор, личное заявление работника.

Директор: ___________________ / {{director_name}} /   М.П.

С приказом ознакомлен(а):
{{emp_name}}  ___________________  Дата: ___________`,
  },

  {
    id: 'order-dismiss',
    category: 'Кадровые приказы',
    icon: '🚪',
    title: 'Приказ об увольнении',
    description: 'Приказ о расторжении трудового договора',
    vars: [
      { key: 'order_num', label: 'Номер приказа', type: 'text', placeholder: '5-К' },
      { key: 'order_date', label: 'Дата приказа', type: 'date', default: new Date().toISOString().slice(0,10) },
      { key: 'company_name', label: 'Наименование организации', type: 'text', placeholder: 'ООО "Компания"' },
      { key: 'emp_name', label: 'ФИО сотрудника', type: 'text', placeholder: 'Иванов Иван Иванович' },
      { key: 'position', label: 'Должность', type: 'text', placeholder: 'Бухгалтер' },
      { key: 'dept', label: 'Отдел', type: 'text', placeholder: 'Бухгалтерия' },
      { key: 'dismiss_date', label: 'Дата увольнения', type: 'date' },
      { key: 'reason', label: 'Основание увольнения', type: 'select', options: [
        'п.1 ст.97 ТК РУз — по соглашению сторон',
        'п.2 ст.97 ТК РУз — по собственному желанию',
        'п.1 ст.100 ТК РУз — ликвидация организации',
        'п.2 ст.100 ТК РУз — сокращение численности',
        'п.4 ст.100 ТК РУз — несоответствие должности',
        'п.1 ст.104 ТК РУз — прогул',
      ], default: 'п.2 ст.97 ТК РУз — по собственному желанию' },
      { key: 'director_name', label: 'ФИО директора', type: 'text', placeholder: 'Каримов Карим Каримович' },
    ],
    body: `{{company_name}}

ПРИКАЗ № {{order_num}}-К
«{{order_date_d}}» {{order_date_m}} {{order_date_y}} г.

О ПРЕКРАЩЕНИИ ТРУДОВОГО ДОГОВОРА

ПРИКАЗЫВАЮ:

Прекратить трудовой договор с {{emp_name}}, занимающим(ей) должность «{{position}}» в {{dept}}, с {{dismiss_date}}.

Основание: {{reason}}.

В день увольнения произвести окончательный расчёт и выдать трудовую книжку.

Директор: ___________________ / {{director_name}} /   М.П.

С приказом ознакомлен(а):
{{emp_name}}  ___________________  Дата: ___________`,
  },

  {
    id: 'order-vacation',
    category: 'Кадровые приказы',
    icon: '🏖️',
    title: 'Приказ об отпуске',
    description: 'Приказ о предоставлении ежегодного или иного отпуска',
    vars: [
      { key: 'order_num', label: 'Номер приказа', type: 'text', placeholder: '8-К' },
      { key: 'order_date', label: 'Дата приказа', type: 'date', default: new Date().toISOString().slice(0,10) },
      { key: 'company_name', label: 'Наименование организации', type: 'text', placeholder: 'ООО "Компания"' },
      { key: 'emp_name', label: 'ФИО сотрудника', type: 'text', placeholder: 'Иванов Иван Иванович' },
      { key: 'position', label: 'Должность', type: 'text', placeholder: 'Бухгалтер' },
      { key: 'vac_type', label: 'Вид отпуска', type: 'select', options: ['ежегодный основной (21 к.д.)', 'ежегодный дополнительный', 'без сохранения заработной платы', 'учебный'], default: 'ежегодный основной (21 к.д.)' },
      { key: 'days', label: 'Количество дней', type: 'number', placeholder: '21', default: '21' },
      { key: 'start_date', label: 'Дата начала отпуска', type: 'date' },
      { key: 'end_date', label: 'Дата окончания отпуска', type: 'date' },
      { key: 'work_year', label: 'Рабочий год (за какой)', type: 'text', placeholder: '01.06.2025 – 31.05.2026' },
      { key: 'director_name', label: 'ФИО директора', type: 'text', placeholder: 'Каримов Карим Каримович' },
    ],
    body: `{{company_name}}

ПРИКАЗ № {{order_num}}-К
«{{order_date_d}}» {{order_date_m}} {{order_date_y}} г.

О ПРЕДОСТАВЛЕНИИ ОТПУСКА

ПРИКАЗЫВАЮ:

Предоставить {{emp_name}}, {{position}}, {{vac_type}} продолжительностью {{days}} календарных дней с {{start_date}} по {{end_date}} включительно.

Рабочий год: {{work_year}}.

Основание: личное заявление работника, график отпусков.

Директор: ___________________ / {{director_name}} /   М.П.

С приказом ознакомлен(а):
{{emp_name}}  ___________________  Дата: ___________`,
  },

  {
    id: 'order-business-trip',
    category: 'Кадровые приказы',
    icon: '✈️',
    title: 'Приказ о командировке',
    description: 'Приказ о направлении в служебную командировку',
    vars: [
      { key: 'order_num', label: 'Номер приказа', type: 'text', placeholder: '3-К' },
      { key: 'order_date', label: 'Дата приказа', type: 'date', default: new Date().toISOString().slice(0,10) },
      { key: 'company_name', label: 'Наименование организации', type: 'text', placeholder: 'ООО "Компания"' },
      { key: 'emp_name', label: 'ФИО сотрудника', type: 'text', placeholder: 'Иванов Иван Иванович' },
      { key: 'position', label: 'Должность', type: 'text', placeholder: 'Бухгалтер' },
      { key: 'destination', label: 'Место командировки', type: 'text', placeholder: 'г. Самарканд' },
      { key: 'org_dest', label: 'Организация назначения', type: 'text', placeholder: 'ООО "Партнёр"' },
      { key: 'purpose', label: 'Цель командировки', type: 'text', placeholder: 'участие в переговорах, подписание договора' },
      { key: 'start_date', label: 'Дата начала', type: 'date' },
      { key: 'end_date', label: 'Дата окончания', type: 'date' },
      { key: 'days', label: 'Количество дней', type: 'number', placeholder: '3' },
      { key: 'daily_rate', label: 'Суточные (сум/день)', type: 'number', placeholder: '100000' },
      { key: 'transport', label: 'Вид транспорта', type: 'select', options: ['служебный автомобиль', 'железная дорога', 'авиа', 'автобус'], default: 'железная дорога' },
      { key: 'director_name', label: 'ФИО директора', type: 'text', placeholder: 'Каримов Карим Каримович' },
    ],
    body: `{{company_name}}

ПРИКАЗ № {{order_num}}-К
«{{order_date_d}}» {{order_date_m}} {{order_date_y}} г.

О НАПРАВЛЕНИИ В КОМАНДИРОВКУ

ПРИКАЗЫВАЮ:

Направить {{emp_name}}, {{position}}, в служебную командировку в {{destination}} ({{org_dest}}) с {{start_date}} по {{end_date}} ({{days}} дней).

Цель командировки: {{purpose}}.

Вид транспорта: {{transport}}.

Выплатить суточные из расчёта {{daily_rate}} сум/день. Расходы на проезд и проживание оплачиваются по фактически представленным документам.

По возвращении из командировки представить авансовый отчёт не позднее 3 рабочих дней.

Директор: ___________________ / {{director_name}} /   М.П.

С приказом ознакомлен(а):
{{emp_name}}  ___________________  Дата: ___________`,
  },

  // ─── ДОВЕРЕННОСТИ ────────────────────────────────────────────────────────
  {
    id: 'poa-general',
    category: 'Доверенности',
    icon: '📜',
    title: 'Доверенность',
    description: 'Доверенность на представление интересов организации',
    vars: [
      { key: 'poa_date', label: 'Дата выдачи', type: 'date', default: new Date().toISOString().slice(0,10) },
      { key: 'city', label: 'Город', type: 'text', default: 'Ташкент' },
      { key: 'company_name', label: 'Наименование организации', type: 'text', placeholder: 'ООО "Компания"' },
      { key: 'company_tin', label: 'ИНН организации', type: 'text', placeholder: '123456789' },
      { key: 'director_name', label: 'ФИО директора (доверитель)', type: 'text', placeholder: 'Каримов Карим Каримович' },
      { key: 'rep_name', label: 'ФИО доверенного лица', type: 'text', placeholder: 'Алиев Алишер Алиевич' },
      { key: 'rep_position', label: 'Должность доверенного лица', type: 'text', placeholder: 'Бухгалтер' },
      { key: 'rep_passport', label: 'Паспорт доверенного лица', type: 'text', placeholder: 'AB 1234567, выдан ОВД г. Ташкент 01.01.2020' },
      { key: 'powers', label: 'Полномочия', type: 'textarea', placeholder: 'получать товарно-материальные ценности, подписывать накладные и счета-фактуры, представлять интересы организации в банке...' },
      { key: 'valid_until', label: 'Действительна до', type: 'date' },
    ],
    body: `ДОВЕРЕННОСТЬ

г. {{city}}                                                        «{{poa_date_d}}» {{poa_date_m}} {{poa_date_y}} г.

{{company_name}}, ИНН {{company_tin}}, в лице директора {{director_name}},

НАСТОЯЩЕЙ ДОВЕРЕННОСТЬЮ УПОЛНОМОЧИВАЕТ

{{rep_name}}, {{rep_position}}, паспорт: {{rep_passport}},

на следующие действия от имени и в интересах {{company_name}}:
{{powers}}

Настоящая доверенность действительна по «___» __________ {{valid_until_y}} г. включительно.

Полномочия по настоящей доверенности не могут быть переданы третьим лицам.

Директор: ___________________ / {{director_name}} /   М.П.`,
  },

  // ─── ВЭД ─────────────────────────────────────────────────────────────────
  {
    id: 'ved-invoice',
    category: 'ВЭД',
    icon: '🌐',
    title: 'Инвойс (Invoice)',
    description: 'Коммерческий инвойс для внешнеэкономических операций',
    vars: [
      { key: 'invoice_num', label: 'Номер инвойса', type: 'text', placeholder: 'INV-2026-001' },
      { key: 'invoice_date', label: 'Дата инвойса', type: 'date', default: new Date().toISOString().slice(0,10) },
      { key: 'contract_num', label: 'Номер контракта', type: 'text', placeholder: 'CONTRACT-2026-01' },
      { key: 'seller_name', label: 'Seller (продавец)', type: 'text', placeholder: 'LLC "Company", Uzbekistan' },
      { key: 'seller_tin', label: 'TIN / VAT number', type: 'text', placeholder: '123456789' },
      { key: 'seller_address', label: 'Адрес продавца (EN)', type: 'text', placeholder: '1 Navoi St., Tashkent, Uzbekistan' },
      { key: 'seller_bank', label: 'Bank of seller', type: 'text', placeholder: 'Ipoteka-Bank, Tashkent' },
      { key: 'seller_account', label: 'Account / IBAN', type: 'text', placeholder: 'UZ00 1234 0000 0000 0000 0001' },
      { key: 'seller_swift', label: 'SWIFT / BIC', type: 'text', placeholder: 'IPUZUZ22' },
      { key: 'buyer_name', label: 'Buyer (покупатель)', type: 'text', placeholder: 'GmbH "Partner", Germany' },
      { key: 'buyer_address', label: 'Адрес покупателя (EN)', type: 'text', placeholder: '5 Hauptstrasse, Berlin, Germany' },
      { key: 'goods', label: 'Описание товара (EN)', type: 'text', placeholder: 'Cotton yarn, 100% cotton' },
      { key: 'hs_code', label: 'HS Code', type: 'text', placeholder: '5205.11' },
      { key: 'qty', label: 'Количество', type: 'number', placeholder: '1000' },
      { key: 'unit', label: 'Единица', type: 'text', placeholder: 'kg', default: 'kg' },
      { key: 'price_unit', label: 'Цена за единицу (USD)', type: 'number', placeholder: '3.50' },
      { key: 'total_usd', label: 'Итого (USD)', type: 'number', placeholder: '3500' },
      { key: 'incoterms', label: 'Условия поставки (Incoterms)', type: 'select', options: ['FCA Tashkent', 'FOB Tashkent', 'CIF Hamburg', 'DAP Berlin', 'EXW Tashkent'], default: 'FCA Tashkent' },
      { key: 'payment_terms', label: 'Условия оплаты', type: 'select', options: ['100% prepayment', '50% advance, 50% after shipment', '30 days after B/L date', 'Letter of Credit'], default: '100% prepayment' },
      { key: 'country_origin', label: 'Страна происхождения', type: 'text', placeholder: 'Uzbekistan', default: 'Uzbekistan' },
    ],
    body: `COMMERCIAL INVOICE / КОММЕРЧЕСКИЙ ИНВОЙС

Invoice No.: {{invoice_num}}                               Date: {{invoice_date}}
Contract No.: {{contract_num}}

SELLER / ПРОДАВЕЦ:                           BUYER / ПОКУПАТЕЛЬ:
{{seller_name}}                              {{buyer_name}}
TIN: {{seller_tin}}                          {{buyer_address}}
{{seller_address}}
Bank: {{seller_bank}}
SWIFT: {{seller_swift}}
Account: {{seller_account}}

─────────────────────────────────────────────────────────────────────────────

DESCRIPTION OF GOODS:
┌──────────────────────────────┬────────┬──────┬──────────────┬──────────────┐
│ Description                  │ HS Code│  Qty │  Unit Price  │    Amount    │
├──────────────────────────────┼────────┼──────┼──────────────┼──────────────┤
│ {{goods}}                    │{{hs_code}}│{{qty}} {{unit}}│ USD {{price_unit}} │ USD {{total_usd}}│
├──────────────────────────────┴────────┴──────┴──────────────┼──────────────┤
│ TOTAL / ИТОГО:                                               │ USD {{total_usd}}│
└──────────────────────────────────────────────────────────────┴──────────────┘

Country of Origin: {{country_origin}}
Delivery Terms: {{incoterms}}
Payment Terms: {{payment_terms}}

We hereby certify that the information herein is true, correct and complete.

Authorised Signature: ___________________
{{seller_name}}`,
  },
];
