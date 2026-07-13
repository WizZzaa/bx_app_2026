import React, { useState } from 'react';
import { useToast } from '../../lib/ui/ToastContext';

interface DomainItem {
  id: string;
  domain: string;
  label: string;
  category: string;
  checked: boolean;
}

export default function ActiveXConfigurator() {
  const toast = useToast();
  const [domains, setDomains] = useState<DomainItem[]>([
    { id: 'soliq', domain: 'soliq.uz', label: 'my.soliq.uz / soliq.uz (Налоговый кабинет)', category: 'Госорганы', checked: true },
    { id: 'cbu', domain: 'cbu.uz', label: 'cbu.uz (Центральный банк РУз)', category: 'Госорганы', checked: true },
    { id: 'eimzo', domain: 'e-imzo.uz', label: 'e-imzo.uz (Портал ЭЦП ключей)', category: 'Госорганы', checked: true },
    { id: 'pf', domain: 'pf.uz', label: 'pf.uz (Внебюджетный Пенсионный Фонд)', category: 'Госорганы', checked: true },
    { id: 'xarid', domain: 'xarid.uz', label: 'xarid.uz / xarid.uzex.uz (Госзакупки)', category: 'Госорганы', checked: true },
    { id: 'customs', domain: 'customs.uz', label: 'customs.uz (Государственный таможенный комитет)', category: 'Госорганы', checked: true },
    { id: 'didox', domain: 'didox.uz', label: 'didox.uz (Электронный документооборот)', category: 'ЭДО', checked: true },
    { id: 'faktura', domain: 'faktura.uz', label: 'faktura.uz (Электронные счета-фактуры)', category: 'ЭДО', checked: true },
  ]);

  const [enableActiveXSettings, setEnableActiveXSettings] = useState(true);

  const toggleDomain = (id: string) => {
    setDomains(domains.map(d => d.id === id ? { ...d, checked: !d.checked } : d));
  };

  const selectAll = (checked: boolean) => {
    setDomains(domains.map(d => ({ ...d, checked })));
  };

  const handleDownloadReg = () => {
    const selected = domains.filter(d => d.checked);
    if (selected.length === 0 && !enableActiveXSettings) {
      toast.error('Выберите хотя бы одну опцию для генерации файла реестра');
      return;
    }

    let regContent = 'Windows Registry Editor Version 5.00\r\n\r\n';

    // 1. Настройка зоны Надежных узлов (Zone 2)
    regContent += '; --- НАСТРОЙКА ЗОНЫ НАДЕЖНЫХ УЗЛОВ (TRUSTED SITES) ---\r\n';
    selected.forEach(d => {
      // Для каждого домена прописываем https (протокол 2)
      regContent += `[HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings\\ZoneMap\\Domains\\${d.domain}]\r\n`;
      regContent += '"https"=dword:00000002\r\n\r\n';
      // Также прописываем субдомен www если нужно, или wildcard
      regContent += `[HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings\\ZoneMap\\Domains\\${d.domain}\\*]\r\n`;
      regContent += '"https"=dword:00000002\r\n\r\n';
    });

    // 2. Включение параметров ActiveX для зоны Надежных узлов (Zone 2)
    if (enableActiveXSettings) {
      regContent += '; --- НАСТРОЙКА ПАРАМЕТРОВ ACTIVEX ДЛЯ НАДЕЖНЫХ САЙТОВ ---\r\n';
      regContent += '[HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings\\Zones\\2]\r\n';
      
      // 1201 - Запуск ActiveX элементов управления и модулей подключения (0 = Разрешить)
      regContent += '"1201"=dword:00000000\r\n';
      // 1405 - Поведение двоичных кодов и сценариев (0 = Разрешить)
      regContent += '"1405"=dword:00000000\r\n';
      // 2201 - Доступ к источникам данных за пределами домена (0 = Разрешить)
      regContent += '"2201"=dword:00000000\r\n';
      // 1200 - Выполнение сценариев ActiveX элементов управления (0 = Разрешить)
      regContent += '"1200"=dword:00000000\r\n';
      // 1208 - Разрешить выполнение неопределенных параметров ActiveX (0 = Разрешить)
      regContent += '"1208"=dword:00000000\r\n\r\n';
    }

    try {
      // Создаем blob с кодировкой UTF-16LE или UTF-8 с BOM, так как реестр Windows требует этого.
      // Windows REG файлы в UTF-8 отлично работают начиная с Windows 10, если есть BOM
      const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
      const blob = new Blob([bom, regContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'bx_activex_setup.reg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Файл реестра bx_activex_setup.reg успешно скачан! Запустите его и согласитесь на слияние.');
    } catch {
      toast.error('Не удалось скачать файл реестра');
    }
  };

  return (
    <div className="space-y-5 text-bx-text text-xs leading-relaxed font-sans">
      
      <div className="bg-bx-surface-2/40 border border-bx-border rounded-xl p-4">
        <p className="font-semibold text-bx-text mb-1.5 text-xs">Зачем нужен этот инструмент?</p>
        <p className="text-[11px] text-bx-muted leading-relaxed">
          Многие старые системы банк-клиентов банков Узбекистана (а также казначейские порталы) требуют использования элементов управления ActiveX для криптографии и авторизации через Internet Explorer (или режим совместимости IE в Microsoft Edge).
          Этот инструмент генерирует безопасный настроечный скрипт реестра Windows (`.reg`), который мгновенно прописывает нужные домены в надежные узлы и активирует запуск ActiveX за одну секунду.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Шаг 1: Конфигурация */}
        <div className="bg-bx-surface-2/20 border border-bx-border rounded-xl p-4.5 space-y-4">
          <div className="flex items-center justify-between border-b border-bx-border/40 pb-2">
            <span className="font-extrabold uppercase text-[10px] tracking-wide text-blue-600 dark:text-blue-400">Шаг 1. Настройка скрипта</span>
            <div className="flex gap-1.5 text-[9px]">
              <button onClick={() => selectAll(true)} className="text-blue-500 hover:underline">Выбрать все</button>
              <span className="text-bx-muted">·</span>
              <button onClick={() => selectAll(false)} className="text-bx-muted hover:text-bx-text">Снять все</button>
            </div>
          </div>

          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
            {domains.map(d => (
              <label key={d.id} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-bx-surface-2 cursor-pointer transition-colors border border-bx-border/20">
                <input 
                  type="checkbox" 
                  checked={d.checked} 
                  onChange={() => toggleDomain(d.id)}
                  className="w-4 h-4 accent-blue-600 rounded mt-0.5"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold leading-tight">{d.label}</p>
                  <p className="text-[9px] text-bx-muted mt-0.5">Категория: {d.category} · Домен: {d.domain}</p>
                </div>
              </label>
            ))}
          </div>

          <label className="flex items-start gap-2.5 p-2 bg-bx-surface-2 rounded-xl cursor-pointer border border-bx-border/60">
            <input 
              type="checkbox" 
              checked={enableActiveXSettings} 
              onChange={e => setEnableActiveXSettings(e.target.checked)}
              className="w-4 h-4 accent-blue-600 rounded mt-0.5"
            />
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-bx-text leading-tight">Включить параметры ActiveX (Рекомендуется)</p>
              <p className="text-[9px] text-bx-muted mt-0.5">
                Автоматически разрешает выполнение сценариев и запуск двоичных кодов для зоны надежных сайтов.
              </p>
            </div>
          </label>

          <button
            onClick={handleDownloadReg}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            📥 Скачать авто-настройщик (.reg)
          </button>
        </div>

        {/* Шаг 2: Инструкция */}
        <div className="bg-bx-surface-2/20 border border-bx-border rounded-xl p-4.5 space-y-3.5">
          <h3 className="font-extrabold uppercase text-[10px] tracking-wide text-blue-600 dark:text-blue-400 border-b border-bx-border/40 pb-2">Шаг 2. Как запустить настройки</h3>
          
          <div className="space-y-3 text-[11px] leading-relaxed">
            <div className="flex gap-2.5 items-start">
              <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs flex-shrink-0">1</span>
              <p>Нажмите синюю кнопку слева и сохраните файл <b>bx_activex_setup.reg</b> на диск.</p>
            </div>
            
            <div className="flex gap-2.5 items-start">
              <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs flex-shrink-0">2</span>
              <p>Дважды кликните по скачанному файлу реестра левой кнопкой мыши.</p>
            </div>

            <div className="flex gap-2.5 items-start">
              <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs flex-shrink-0">3</span>
              <p>В появившемся предупреждении системы Windows нажмите кнопку <b>«Да» (Yes)</b>, разрешая внесение изменений в реестр.</p>
            </div>

            <div className="flex gap-2.5 items-start">
              <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs flex-shrink-0">4</span>
              <p>Перезапустите браузер (Microsoft Edge или Internet Explorer), чтобы настройки вступили в силу.</p>
            </div>
          </div>

          <div className="p-3 bg-amber-500/15 border border-amber-500/20 text-[10px] text-amber-900 dark:text-amber-300 rounded-xl leading-relaxed">
            💡 <b>Совет:</b> В Microsoft Edge открывайте сайты банков через режим <b>«Перезапустить в режиме Internet Explorer»</b> (в меню настроек Edge), чтобы включенные параметры ActiveX начали работу.
          </div>
        </div>
      </div>
    </div>
  );
}
