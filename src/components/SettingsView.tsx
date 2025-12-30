
import React from 'react';
import { ArrowLeft, Timer, Coffee, Eye, EyeOff, Languages, Power, Circle, Hash } from 'lucide-react';
import { Settings, Theme } from '../types';
import { Translation } from '../translations';

interface SettingsViewProps {
  settings: Settings;
  onUpdateSettings: (newSettings: Settings) => void;
  onBack: () => void;
  theme: Theme;
  t: Translation;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onBack,
  theme,
  t
}) => {
  const isDark = theme === 'dark';

  const handleChange = (key: keyof Settings, value: any) => {
    onUpdateSettings({
      ...settings,
      [key]: value
    });
  };

  const inputClass = `w-16 p-2 text-center font-mono text-lg bg-transparent border-b-2 outline-none transition-colors focus:border-emerald-500 ${isDark ? 'text-white border-zinc-700' : 'text-stone-900 border-stone-300'
    }`;

  const labelClass = `text-xs uppercase tracking-widest font-bold mb-1 ${isDark ? 'text-zinc-500' : 'text-stone-500'
    }`;

  const sectionClass = `p-4 border rounded-lg mb-2 flex items-center justify-between transition-colors ${isDark ? 'border-zinc-800 bg-zinc-900/30' : 'border-stone-200 bg-white'
    }`;

  return (
    <div className={`flex flex-col h-full p-4 overflow-y-auto transition-colors duration-500 ${isDark ? 'bg-zinc-950' : 'bg-stone-50'}`}>
      <header className="flex items-center gap-4 mb-4">
        <button onClick={onBack} className={`transition-colors ${isDark ? 'text-zinc-500 hover:text-white' : 'text-stone-400 hover:text-stone-900'}`}>
          <ArrowLeft />
        </button>
        <h1 className={`text-xl font-mono ${isDark ? 'text-zinc-300' : 'text-stone-700'}`}>{t.settings.title}</h1>
      </header>

      <div className="max-w-md mx-auto w-full">

        {/* Timer Settings */}
        <div className="mb-4">
          <h3 className={labelClass}>{t.settings.timeDilation}</h3>

          <div className={sectionClass}>
            <div className="flex items-center gap-3">
              <Timer className={isDark ? 'text-zinc-400' : 'text-stone-400'} size={20} />
              <div>
                <div className={`font-mono text-sm ${isDark ? 'text-zinc-200' : 'text-stone-800'}`}>{t.settings.focusDuration}</div>
                <div className={`text-xs ${isDark ? 'text-zinc-500' : 'text-stone-500'}`}>{t.settings.focusDesc}</div>
              </div>
            </div>
            <input
              type="number"
              min="1"
              max="60"
              value={settings.pomodoroDuration}
              onChange={(e) => handleChange('pomodoroDuration', parseInt(e.target.value) || 25)}
              className={inputClass}
            />
          </div>

          <div className={sectionClass}>
            <div className="flex items-center gap-3">
              <Coffee className={isDark ? 'text-zinc-400' : 'text-stone-400'} size={20} />
              <div>
                <div className={`font-mono text-sm ${isDark ? 'text-zinc-200' : 'text-stone-800'}`}>{t.settings.restoration}</div>
                <div className={`text-xs ${isDark ? 'text-zinc-500' : 'text-stone-500'}`}>{t.settings.restorationDesc}</div>
              </div>
            </div>
            <input
              type="number"
              min="1"
              max="30"
              value={settings.breakDuration}
              onChange={(e) => handleChange('breakDuration', parseInt(e.target.value) || 5)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Interface Settings */}
        <div className="mb-4">
          <h3 className={labelClass}>{t.settings.interface}</h3>

          <div
            className={`${sectionClass} cursor-pointer group hover:border-emerald-500/30`}
            onClick={() => handleChange('showCategories', !settings.showCategories)}
          >
            <div className="flex items-center gap-3">
              {settings.showCategories ? (
                <Eye className={isDark ? 'text-zinc-400' : 'text-stone-400'} size={20} />
              ) : (
                <EyeOff className={isDark ? 'text-zinc-600' : 'text-stone-600'} size={20} />
              )}
              <div>
                <div className={`font-mono text-sm ${isDark ? 'text-zinc-200' : 'text-stone-800'}`}>{t.settings.domainTabs}</div>
                <div className={`text-xs ${isDark ? 'text-zinc-500' : 'text-stone-500'}`}>
                  {settings.showCategories ? t.settings.visible : t.settings.hidden}
                </div>
              </div>
            </div>

            {/* Custom Toggle Switch */}
            <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${settings.showCategories
              ? 'bg-emerald-500'
              : (isDark ? 'bg-zinc-800' : 'bg-stone-300')
              }`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${settings.showCategories ? 'translate-x-5' : 'translate-x-0'
                }`} />
            </div>
          </div>

          {/* Language Selector */}
          <div className={sectionClass}>
            <div className="flex items-center gap-3">
              <Languages className={isDark ? 'text-zinc-400' : 'text-stone-400'} size={20} />
              <div>
                <div className={`font-mono text-sm ${isDark ? 'text-zinc-200' : 'text-stone-800'}`}>{t.settings.language}</div>
                <div className={`text-xs ${isDark ? 'text-zinc-500' : 'text-stone-500'}`}>{t.settings.languageDesc}</div>
              </div>
            </div>

            <div className="flex items-center bg-black/5 rounded-lg overflow-hidden border border-black/5 dark:bg-white/5 dark:border-white/5">
              <button
                onClick={() => handleChange('language', 'en')}
                className={`px-2 py-0.5 text-sm font-mono transition-colors ${settings.language === 'en'
                  ? 'bg-emerald-500 text-white'
                  : (isDark ? 'text-zinc-400 hover:text-white' : 'text-stone-500 hover:text-stone-900')
                  }`}
              >
                EN
              </button>
              <div className="w-px h-4 bg-black/10 dark:bg-white/10"></div>
              <button
                onClick={() => handleChange('language', 'zh')}
                className={`px-2 py-0.5 text-sm font-mono transition-colors ${settings.language === 'zh'
                  ? 'bg-emerald-500 text-white'
                  : (isDark ? 'text-zinc-400 hover:text-white' : 'text-stone-500 hover:text-stone-900')
                  }`}
              >
                中
              </button>
            </div>
          </div>

          {/* Auto Start Toggle */}
          <div
            className={`${sectionClass} cursor-pointer group hover:border-emerald-500/30`}
            onClick={() => handleChange('autoStart', !settings.autoStart)}
          >
            <div className="flex items-center gap-3">
              <Power className={settings.autoStart ? 'text-emerald-500' : (isDark ? 'text-zinc-600' : 'text-stone-400')} size={20} />
              <div>
                <div className={`font-mono text-sm ${isDark ? 'text-zinc-200' : 'text-stone-800'}`}>{t.settings.autoStart}</div>
                <div className={`text-xs ${isDark ? 'text-zinc-500' : 'text-stone-500'}`}>{t.settings.autoStartDesc}</div>
              </div>
            </div>

            {/* Toggle Switch */}
            <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${settings.autoStart
              ? 'bg-emerald-500'
              : (isDark ? 'bg-zinc-800' : 'bg-stone-300')
              }`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${settings.autoStart ? 'translate-x-5' : 'translate-x-0'
                }`} />
            </div>
          </div>

          {/* Timer Display Mode */}
          <div className={sectionClass}>
            <div className="flex items-center gap-3">
              <Circle className={isDark ? 'text-zinc-400' : 'text-stone-400'} size={20} />
              <div>
                <div className={`font-mono text-sm ${isDark ? 'text-zinc-200' : 'text-stone-800'}`}>{t.settings.timerDisplay}</div>
                <div className={`text-xs ${isDark ? 'text-zinc-500' : 'text-stone-500'}`}>{t.settings.timerDisplayDesc}</div>
              </div>
            </div>

            <div className="flex items-center bg-black/5 rounded-lg overflow-hidden border border-black/5 dark:bg-white/5 dark:border-white/5">
              <button
                onClick={() => handleChange('timerDisplayMode', 'countdown')}
                className={`px-2 py-0.5 text-sm font-mono transition-colors flex items-center gap-1 ${settings.timerDisplayMode === 'countdown'
                  ? 'bg-emerald-500 text-white'
                  : (isDark ? 'text-zinc-400 hover:text-white' : 'text-stone-500 hover:text-stone-900')
                  }`}
              >
                <Hash size={12} />
                {t.settings.countdown}
              </button>
              <div className="w-px h-4 bg-black/10 dark:bg-white/10"></div>
              <button
                onClick={() => handleChange('timerDisplayMode', 'ring')}
                className={`px-2 py-0.5 text-sm font-mono transition-colors flex items-center gap-1 ${settings.timerDisplayMode === 'ring'
                  ? 'bg-emerald-500 text-white'
                  : (isDark ? 'text-zinc-400 hover:text-white' : 'text-stone-500 hover:text-stone-900')
                  }`}
              >
                <Circle size={12} />
                {t.settings.ring}
              </button>
            </div>
          </div>

        </div>

        <div className={`text-center text-xs font-mono opacity-50 mt-6 ${isDark ? 'text-zinc-600' : 'text-stone-400'}`}>
          {t.settings.footer}
        </div>

      </div>
    </div>
  );
};