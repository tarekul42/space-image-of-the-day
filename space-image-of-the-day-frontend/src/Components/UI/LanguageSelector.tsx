import React from 'react';
import { useApod } from '../../context/ApodContext';
import { Globe } from 'lucide-react';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useApod();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value);
  };

  return (
    <div className="absolute top-4 right-4 z-50 flex items-center bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 shadow-lg hover:bg-black/60 transition-colors">
      <Globe size={14} className="text-white/70 mr-2" />
      <select
        value={language}
        onChange={handleLanguageChange}
        className="bg-transparent text-white/90 text-xs font-medium focus:outline-none appearance-none cursor-pointer"
        aria-label="Select Language"
      >
        <option value="en" className="bg-[#1a1a1f] text-white">
          English
        </option>
        <option value="es" className="bg-[#1a1a1f] text-white">
          Español
        </option>
        <option value="fr" className="bg-[#1a1a1f] text-white">
          Français
        </option>
        <option value="de" className="bg-[#1a1a1f] text-white">
          Deutsch
        </option>
        <option value="it" className="bg-[#1a1a1f] text-white">
          Italiano
        </option>
        <option value="pt" className="bg-[#1a1a1f] text-white">
          Português
        </option>
        <option value="ja" className="bg-[#1a1a1f] text-white">
          日本語
        </option>
        <option value="zh-CN" className="bg-[#1a1a1f] text-white">
          简体中文
        </option>
        <option value="ru" className="bg-[#1a1a1f] text-white">
          Русский
        </option>
        <option value="bn" className="bg-[#1a1a1f] text-white">
          বাংলা
        </option>
        <option value="hi" className="bg-[#1a1a1f] text-white">
          हिन्दी
        </option>
      </select>
    </div>
  );
};
