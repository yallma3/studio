import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSelector: React.FC = () => {
  const { i18n, t } = useTranslation();
  
  // Set the HTML dir attribute based on language
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="language-selector ">
      <div className="flex items-center justify-center  rtl:space-x-reverse border border-zinc-800 rounded-md">
        <button 
          onClick={() => changeLanguage('en')} 
          className={`text-sm px-4 py-1   ${i18n.language != 'ar' ? 'bg-zinc-800 text-white rounded-l-md' : 'text-gray-300 cursor-pointer hover:bg-zinc-700 rounded-r-md'}`}
        >
          {t('common.english')}
        </button>
        <button 
          onClick={() => changeLanguage('ar')} 
          className={`text-sm px-4 py-1  ${i18n.language === 'ar' ? 'bg-zinc-800 text-white rounded-l-md' : 'text-gray-300 cursor-pointer hover:bg-zinc-700 rounded-r-md'}`}
        >
          {t('common.arabic')}
        </button>
      </div>
    </div>
  );
};

export default LanguageSelector; 