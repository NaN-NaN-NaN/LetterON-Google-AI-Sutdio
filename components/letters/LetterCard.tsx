import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Letter, ActionStatus } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import BellIcon from '../icons/BellIcon';

interface LetterCardProps {
    letter: Letter;
}

const StarIcon: React.FC<{ filled: boolean }> = ({ filled }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${filled ? 'text-yellow-400' : 'text-slate-300'}`} viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

const StatusDot: React.FC<{ status: ActionStatus }> = ({ status }) => {
    const colorClass = {
        [ActionStatus.NONE]: 'bg-status-none',
        [ActionStatus.WAIT_FOR_ACTION]: 'bg-status-wait',
        [ActionStatus.COMPLETE]: 'bg-status-complete',
        [ActionStatus.CANCELED]: 'bg-slate-400',
    };
    return <div className={`h-3 w-3 rounded-full flex-shrink-0 ${colorClass[status]}`}></div>;
};


const LetterCard: React.FC<LetterCardProps> = ({ letter }) => {
    const { t, language } = useI18n();
    const navigate = useNavigate();

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(language, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };
    
    return (
        <div 
            onClick={() => navigate(`/letter/${letter.id}`)}
            className="bg-white p-5 rounded-xl shadow-sm hover:shadow-lg transition-shadow cursor-pointer border border-transparent hover:border-primary-light"
        >
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-1">
                        <StatusDot status={letter.action_status} />
                        <h2 className="text-lg font-bold text-slate-800 truncate" title={letter.title}>{letter.title}</h2>
                    </div>
                    <p className="text-sm text-slate-600 ml-5">{letter.sender_info.name}</p>
                </div>
                <div className="flex items-center space-x-3 flex-shrink-0">
                    <StarIcon filled={letter.starred} />
                    <BellIcon active={letter.reminder_active} />
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-x-4 gap-y-2">
                 <span className="px-2 py-0.5 text-xs font-semibold text-primary-dark bg-primary-light rounded-full">
                    {t(`category.${letter.category}`)}
                </span>
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 text-right">
                    <span>{t('letter.sentOn')}: {formatDate(letter.sent_at)}</span>
                    <span>{t('letter.uploadedOn')}: {formatDate(letter.created_at)}</span>
                </div>
            </div>
        </div>
    );
};

export default LetterCard;