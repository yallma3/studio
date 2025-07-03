/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 
 * Copyright (C) 2025 yaLLMa3
 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 
 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/

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