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
    
    const deadlineDate = letter.ai_suggestion_action_deadline_date ? new Date(letter.ai_suggestion_action_deadline_date) : null;
    const isDeadlineValid = deadlineDate && !isNaN(deadlineDate.getTime());
    
    const statusTextColors: { [key in ActionStatus]: string } = {
        [ActionStatus.NONE]: 'text-status-none',
        [ActionStatus.WAIT_FOR_ACTION]: 'text-status-wait',
        [ActionStatus.COMPLETE]: 'text-status-complete',
        [ActionStatus.CANCELED]: 'text-slate-500',
    }

    return (
        <div 
            onClick={() => navigate(`/letter/${letter.id}`)}
            className="bg-white p-5 rounded-xl shadow-sm hover:shadow-lg transition-shadow cursor-pointer border border-transparent hover:border-primary-light"
        >
            <div className="flex justify-between items-start gap-4 mb-2">
                 <div className="flex items-center gap-2 flex-wrap">
                    <StatusDot status={letter.action_status} />
                    <span className={`text-xs font-bold uppercase tracking-wide ${statusTextColors[letter.action_status]}`}>{t(`letter.status.${letter.action_status}`)}</span>
                    {isDeadlineValid && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 rounded-full px-2 py-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            {formatDate(letter.ai_suggestion_action_deadline_date!)}
                        </span>
                    )}
                </div>
                <div className="flex items-center space-x-3 flex-shrink-0">
                    {letter.starred && <StarIcon filled={true} />}
                    {letter.reminder_active && <BellIcon active={true} />}
                </div>
            </div>
            
            <div className="flex-grow min-w-0">
                 <span className="px-2 py-0.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-full inline-block mb-1">
                    {t(`category.${letter.category}`)}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-slate-800 truncate" title={letter.title}>{letter.title}</h2>
                <p className="text-xs sm:text-sm text-slate-600 truncate">{letter.sender_info.name}</p>
                <p className="text-xs sm:text-sm text-slate-500 mt-2 line-clamp-2 hidden sm:block">{letter.ai_summary}</p>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-x-4 gap-y-2">
                <div className="flex flex-col items-start sm:items-end sm:flex-row sm:items-center sm:gap-4 text-left sm:text-right w-full sm:w-auto text-[11px] sm:text-xs">
                    <div className="w-full sm:w-auto">
                        <span className="font-semibold">{t('letter.sentOn')}:</span> {formatDate(letter.sent_at)}
                    </div>
                    <div className="w-full sm:w-auto">
                        <span className="font-semibold">{t('letter.uploadedOn')}:</span> {formatDate(letter.created_at)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LetterCard;