
import React from 'react';
import { useI18n } from '../../hooks/useI18n';
import { LANGUAGES } from '../../constants';

const LanguageSwitcher: React.FC<{ className?: string }> = ({ className }) => {
    const { language, setLanguage } = useI18n();

    return (
        <div className={className}>
            <select
                value={language}
                // eslint-disable-next-line
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-white border border-slate-300 rounded-md py-1 px-2 text-slate-700"
            >
                {LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
            </select>
        </div>
    );
};

export default LanguageSwitcher;
