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
    <div className="language-selector">
      <div className="flex items-center space-x-2 rtl:space-x-reverse">
        <button 
          onClick={() => changeLanguage('en')} 
          className={`text-sm px-2 py-1 rounded ${i18n.language === 'en' ? 'bg-yellow-400 text-black' : 'text-gray-300'}`}
        >
          {t('common.english')}
        </button>
        <button 
          onClick={() => changeLanguage('ar')} 
          className={`text-sm px-2 py-1 rounded ${i18n.language === 'ar' ? 'bg-yellow-400 text-black' : 'text-gray-300'}`}
        >
          {t('common.arabic')}
        </button>
      </div>
    </div>
  );
};

export default LanguageSelector; 