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
    };
    return <div className={`h-3 w-3 rounded-full flex-shrink-0 ${colorClass[status]}`}></div>;
};

const getDeadlineStyles = (deadlineDate: Date | null): string => {
    if (!deadlineDate) return '';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadline = new Date(deadlineDate);
    deadline.setHours(0, 0, 0, 0);

    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
        return 'bg-red-800 text-white'; // Expired
    }
    if (diffDays <= 3) {
        return 'text-red-600 font-bold'; // Approaching
    }
    return 'text-status-wait'; // Default
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
    const deadlineStyle = getDeadlineStyles(deadlineDate);
    
    const statusTextColors: { [key in ActionStatus]: string } = {
        [ActionStatus.NONE]: 'text-status-none',
        [ActionStatus.WAIT_FOR_ACTION]: 'text-status-wait',
        [ActionStatus.COMPLETE]: 'text-status-complete',
    }

    return (
        <div 
            onClick={() => navigate(`/letter/${letter.id}`)}
            className="bg-white p-5 rounded-xl shadow-sm hover:shadow-lg transition-shadow cursor-pointer border border-transparent hover:border-primary-light flex flex-col justify-between"
        >
            {/* Main Content Wrapper */}
            <div className="flex-grow">
                {/* Header Row */}
                <div className="flex justify-between items-start mb-2 gap-2">
                    <div className="flex items-center gap-2 flex-grow min-w-0">
                        <span className="px-2 py-0.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-full inline-block flex-shrink-0">
                            {t(`category.${letter.category}`)}
                        </span>
                        <h2 className="text-base sm:text-lg font-bold text-slate-800 truncate" title={letter.title}>{letter.title}</h2>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-500">
                            <div className="flex items-center gap-1">
                                <span className="font-semibold">{t('letter.sentOn')}:</span> 
                                <span>{formatDate(letter.sent_at)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="font-semibold">{t('letter.uploadedOn')}:</span> 
                                <span>{formatDate(letter.created_at)}</span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            {letter.starred && <StarIcon filled={true} />}
                            {letter.reminder_active && <BellIcon active={true} />}
                        </div>
                    </div>
                </div>
                
                {/* Sender & Summary */}
                <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-slate-600 truncate">{letter.sender_info.name}</p>
                    <p className="text-xs sm:text-sm text-slate-500 mt-2 line-clamp-2 hidden sm:block">{letter.ai_summary}</p>
                </div>
            </div>
            
            {/* Bottom Section */}
            <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
                <div className="flex items-center gap-2 flex-wrap">
                    <StatusDot status={letter.action_status} />
                    <span className={`font-bold uppercase tracking-wide ${statusTextColors[letter.action_status]}`}>{t(`letter.status.${letter.action_status}`)}</span>
                    {letter.action_status === ActionStatus.WAIT_FOR_ACTION && isDeadlineValid && (
                        <span className={`flex items-center gap-1 font-semibold bg-primary-light rounded-full px-2 py-0.5 ${deadlineStyle}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            {formatDate(letter.ai_suggestion_action_deadline_date!)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LetterCard;