

import React from 'react';
import { LayoutList, Inbox, Briefcase, Coffee, Trash2, Plus } from 'lucide-react';
import { List } from '../types';
import { translations } from '../translations';

interface SidebarProps {
  lists: List[];
  currentListId: string;
  onSelectList: (id: string) => void;
  onAddList: () => void;
  theme: 'light' | 'dark';
  language?: 'en' | 'zh';
}

export const Sidebar: React.FC<SidebarProps> = ({ lists, currentListId, onSelectList, onAddList, theme, language = 'en' }) => {
  const isDark = theme === 'dark';
  const t = translations[language];

  const getIcon = (list: List) => {
    switch (list.type) {
      case 'inbox': return <Inbox size={18} />;
      case 'trash': return <Trash2 size={18} />;
      default:
        if (list.name.toLowerCase().includes('work')) return <Briefcase size={18} />;
        if (list.name.toLowerCase().includes('life')) return <Coffee size={18} />;
        return <LayoutList size={18} />;
    }
  };

  const getListName = (list: List) => {
    switch(list.type) {
      case 'inbox': return t.common.inbox;
      case 'done': return t.common.done;
      case 'trash': return t.common.trash;
      default: return list.name;
    }
  };

  const baseClasses = `w-64 flex flex-col h-full border-r transition-colors duration-500 ${
    isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-stone-100 border-stone-200 text-stone-500'
  }`;

  const itemClasses = (active: boolean) => `
    flex items-center gap-3 px-4 py-2 mx-2 rounded-md text-sm font-medium transition-all cursor-pointer
    ${active 
      ? (isDark ? 'bg-zinc-800 text-zinc-100' : 'bg-stone-200 text-stone-900') 
      : 'hover:opacity-80 hover:bg-black/5'}
  `;

  const standardLists = lists.filter(l => l.type !== 'trash');
  const trashList = lists.find(l => l.type === 'trash');

  return (
    <div className={baseClasses}>
      <div className="p-6">
        <h1 className={`text-xl font-bold tracking-tighter mb-1 font-mono ${isDark ? 'text-zinc-100' : 'text-stone-900'}`}>
          {t.common.entropy}
        </h1>
        <p className="text-[10px] opacity-60 font-mono uppercase tracking-widest">
          v2.0 Fractal
        </p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 py-2">
        {standardLists.map(list => (
          <div 
            key={list.id} 
            className={itemClasses(currentListId === list.id)}
            onClick={() => onSelectList(list.id)}
          >
            {getIcon(list)}
            <span>{getListName(list)}</span>
          </div>
        ))}
        
        {/* Placeholder for Add List functionality in future */}
        <div 
          onClick={onAddList}
          className={`flex items-center gap-3 px-4 py-2 mx-2 mt-4 rounded-md text-sm font-medium border border-dashed transition-all cursor-pointer opacity-50 hover:opacity-100 ${
             isDark ? 'border-zinc-700 hover:border-zinc-500' : 'border-stone-300 hover:border-stone-400'
          }`}
        >
          <Plus size={16} />
          <span>New Domain</span>
        </div>
      </div>

      <div className="p-4 border-t border-black/5">
        {trashList && (
           <div 
            className={itemClasses(currentListId === trashList.id)}
            onClick={() => onSelectList(trashList.id)}
          >
            {getIcon(trashList)}
            <span>{getListName(trashList)}</span>
          </div>
        )}
      </div>
    </div>
  );
};