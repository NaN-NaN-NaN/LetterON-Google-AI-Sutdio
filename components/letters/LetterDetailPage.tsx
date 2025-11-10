import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getLetterById, updateLetter, deleteLetter as apiDeleteLetter } from '../../services/mockApi';
import { translateLetterDetails } from '../../services/geminiService';
import { Letter, SenderInfo, ActionStatus } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { TOP_LANGUAGES, CATEGORY_OPTIONS } from '../../constants';
import Spinner from '../ui/Spinner';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import BellIcon from '../icons/BellIcon';


// Icon Components
const StarIcon: React.FC<{ filled: boolean } & React.SVGProps<SVGSVGElement>> = ({ filled, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 cursor-pointer transition-colors ${filled ? 'text-yellow-400 hover:text-yellow-500' : 'text-slate-400 hover:text-slate-600'}`} viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);
const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 cursor-pointer text-slate-400 hover:text-red-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);
const NoteIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002 2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);


type AnalysisTab = 'summary' | 'translation';
const ACTION_STATUS_OPTIONS = Object.values(ActionStatus);

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
    return 'text-status-wait font-bold'; // Default
};


const LetterDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t, language } = useI18n();
    
    const [letter, setLetter] = useState<Letter | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isImageModalOpen, setImageModalOpen] = useState(false);
    const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [isReminderModalOpen, setReminderModalOpen] = useState(false);
    const [isDeadlineModalOpen, setDeadlineModalOpen] = useState(false);
    const [newDeadline, setNewDeadline] = useState('');
    const [isRemoveReminderConfirmOpen, setRemoveReminderConfirmOpen] = useState(false);
    const [isOriginalTextModalOpen, setOriginalTextModalOpen] = useState(false);
    const [isTranslatedTextModalOpen, setTranslatedTextModalOpen] = useState(false);
    const [currentNote, setCurrentNote] = useState('');
    const [reminderDate, setReminderDate] = useState('');
    
    const [activeTab, setActiveTab] = useState<AnalysisTab>('summary');
    const [isTranslating, setIsTranslating] = useState(false);
    const [targetLang, setTargetLang] = useState('');

    useEffect(() => {
        if (id) {
            getLetterById(id)
                .then(data => {
                    setLetter(data);
                    setCurrentNote(data.note || '');
                    const defaultReminder = data.reminder_at ? new Date(data.reminder_at).toISOString().slice(0, 16) : '';
                    setReminderDate(defaultReminder);
                    setLoading(false);
                })
                .catch(err => {
                    setError('Failed to fetch letter details.');
                    setLoading(false);
                });
        }
    }, [id]);

    useEffect(() => {
        if (letter?.translations) {
            const availableLangs = Object.keys(letter.translations);
            if (availableLangs.length > 0 && !targetLang) {
                setTargetLang(availableLangs[0]);
            }
        }
    }, [letter, targetLang]);


    const handleUpdate = async (field: keyof Letter, value: any, noRerender = false) => {
        if (!letter) return;
        const updatedLetterData = { ...letter, [field]: value };
        if (!noRerender) {
            setLetter(updatedLetterData);
        }
        try {
            await updateLetter(letter.id, { [field]: value });
        } catch (error) {
            setLetter(letter); // Revert on failure
            alert('Failed to update letter.');
        }
    };

    const handleStatusChange = (newStatus: ActionStatus) => {
        if (!letter) return;
        if (newStatus === ActionStatus.WAIT_FOR_ACTION && !letter.ai_suggestion_action_deadline_date) {
            setDeadlineModalOpen(true);
        } else {
            handleUpdate('action_status', newStatus);
        }
    };
    
    const handleSetDeadlineAndStatus = async () => {
        if (!letter || !newDeadline) return;
        setLetter(prev => prev ? {
            ...prev,
            action_status: ActionStatus.WAIT_FOR_ACTION,
            ai_suggestion_action_deadline_date: newDeadline
        } : null);

        try {
            await updateLetter(letter.id, {
                action_status: ActionStatus.WAIT_FOR_ACTION,
                ai_suggestion_action_deadline_date: newDeadline
            });
        } catch (error) {
            setLetter(letter); // Revert
            alert('Failed to update status and deadline.');
        } finally {
            setDeadlineModalOpen(false);
            setNewDeadline('');
        }
    };

    const handleNoteSave = () => {
        if(letter && currentNote !== letter.note) {
            handleUpdate('note', currentNote);
        }
    }

    const handleDelete = async () => {
        if (!letter) return;
        try {
            await apiDeleteLetter(letter.id);
            navigate('/');
        } catch (error) {
            alert('Failed to delete letter.');
        } finally {
            setDeleteConfirmOpen(false);
        }
    }

    const handleSetReminder = () => {
        if (!reminderDate || !letter) return;
        
        const startDate = new Date(reminderDate);
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration

        const toGoogleDate = (date: Date) => date.toISOString().replace(/[-:.]/g, '').slice(0, -4) + 'Z';

        const googleCalendarUrl = new URL('https://www.google.com/calendar/render');
        googleCalendarUrl.searchParams.append('action', 'TEMPLATE');
        googleCalendarUrl.searchParams.append('text', `Reminder: ${letter.title}`);
        googleCalendarUrl.searchParams.append('dates', `${toGoogleDate(startDate)}/${toGoogleDate(endDate)}`);
        googleCalendarUrl.searchParams.append('details', `Action needed for your letter: ${letter.ai_suggestion}\n\nSummary: ${letter.ai_summary}`);
        
        window.open(googleCalendarUrl.toString(), '_blank');

        handleUpdate('reminder_active', true, true);
        handleUpdate('reminder_at', startDate.toISOString());
        setLetter(prev => prev ? {...prev, reminder_active: true, reminder_at: startDate.toISOString()} : null);

        setReminderModalOpen(false);
    };
    
    const handleRemoveReminder = async () => {
        if (!letter) return;
        await handleUpdate('reminder_active', false, true);
        await handleUpdate('reminder_at', null);
        setLetter(prev => prev ? { ...prev, reminder_active: false, reminder_at: null } : null);
        setRemoveReminderConfirmOpen(false);
    };


    const handleTranslate = async () => {
        if (!targetLang || !letter) return;
        setIsTranslating(true);
        try {
            const translatedData = await translateLetterDetails({
                content: letter.content,
                summary: letter.ai_summary,
                suggestion: letter.ai_suggestion
            }, targetLang);
            const newTranslations = { ...letter.translations, [targetLang]: translatedData };
            handleUpdate('translations', newTranslations);
            setLetter(prev => prev ? {...prev, translations: newTranslations} : null);
        } catch (err) {
            alert('Translation failed. Please try again.');
        } finally {
            setIsTranslating(false);
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(language, {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };
    
    const deadlineDate = letter?.ai_suggestion_action_deadline_date ? new Date(letter.ai_suggestion_action_deadline_date) : null;
    const isDeadlineValid = deadlineDate && !isNaN(deadlineDate.getTime());
    const deadlineStyle = getDeadlineStyles(deadlineDate);


    if (loading) return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
    if (error || !letter) return <div className="text-center text-red-500">{error || 'Letter not found.'}</div>;

    return (
        <div>
            <div className="md:hidden">
                <Link to="/" className="inline-block text-sm text-slate-500 hover:text-slate-700 hover:underline mb-4">{t('detail.backToList')}</Link>
            </div>
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg pb-28 md:pb-8">
                {/* Header */}
                <header className="pb-6 border-b border-slate-200">
                    {/* Desktop Header */}
                    <div className="hidden md:block">
                        <div className="flex justify-between items-start">
                             <Link to="/" className="inline-block text-sm text-slate-500 hover:text-slate-700 hover:underline mb-4">{t('detail.backToList')}</Link>
                             <div className="flex items-center space-x-4 flex-shrink-0">
                                <StarIcon filled={letter.starred} onClick={() => handleUpdate('starred', !letter.starred)} />
                                <BellIcon active={letter.reminder_active} onClick={() => letter.reminder_active ? setRemoveReminderConfirmOpen(true) : setReminderModalOpen(true)} className="h-6 w-6 cursor-pointer" />
                                <TrashIcon onClick={() => setDeleteConfirmOpen(true)} />
                            </div>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">{letter.title}</h1>
                    </div>
                     {/* Mobile Header */}
                    <div className="md:hidden">
                        <div className="flex justify-between items-start">
                            <h1 className="text-2xl font-bold text-slate-900 flex-grow pr-4">{letter.title}</h1>
                            <div className="flex items-center space-x-4 flex-shrink-0">
                                <StarIcon filled={letter.starred} onClick={() => handleUpdate('starred', !letter.starred)} />
                                <BellIcon active={letter.reminder_active} onClick={() => letter.reminder_active ? setRemoveReminderConfirmOpen(true) : setReminderModalOpen(true)} className="h-6 w-6 cursor-pointer" />
                                <TrashIcon onClick={() => setDeleteConfirmOpen(true)} />
                            </div>
                        </div>
                    </div>

                    <div className="mt-4">
                        <SenderInfoBlock info={letter.sender_info} />
                    </div>

                    {/* Metadata Bar */}
                    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <label htmlFor="category-select" className="font-medium text-slate-500">{t('detail.category')}:</label>
                            <select
                                id="category-select"
                                value={letter.category}
                                onChange={(e) => handleUpdate('category', e.target.value)}
                                className="bg-slate-100 text-slate-700 font-semibold text-sm rounded-full px-3 py-1 border-2 border-transparent focus:outline-none focus:border-primary focus:ring-primary transition-colors"
                            >
                                {CATEGORY_OPTIONS.map(cat => (
                                    <option key={cat} value={cat}>{t(`category.${cat}`)}</option>
                                ))}
                            </select>
                        </div>
                         <div className="flex items-center gap-2">
                            <label htmlFor="action-status-select" className="font-medium text-slate-500">{t('detail.actionStatus')}:</label>
                            <select
                                id="action-status-select"
                                value={letter.action_status}
                                onChange={(e) => handleStatusChange(e.target.value as ActionStatus)}
                                className="bg-slate-100 text-slate-700 font-semibold text-sm rounded-full px-3 py-1 border-2 border-transparent focus:outline-none focus:border-primary focus:ring-primary transition-colors"
                            >
                                {ACTION_STATUS_OPTIONS.map(status => (
                                    <option key={status} value={status}>{t(`letter.status.${status}`)}</option>
                                ))}
                            </select>
                        </div>
                        {letter.action_status === ActionStatus.WAIT_FOR_ACTION && isDeadlineValid && (
                            <span className={`rounded-md px-2 py-1 text-xs sm:text-sm ${deadlineStyle}`}>
                                {t('detail.deadline')}: {formatDate(letter.ai_suggestion_action_deadline_date!)}
                            </span>
                        )}
                        <div className="flex-grow hidden md:block"></div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                             {letter.images && letter.images.length > 0 && (
                                <button onClick={() => setImageModalOpen(true)} className="text-primary font-semibold hover:underline">{t('detail.originalImages')}</button>
                            )}
                            <span>{t('letter.sentOn')}: {formatDate(letter.sent_at)}</span>
                            <span>{t('letter.uploadedOn')}: {formatDate(letter.created_at)}</span>
                        </div>
                    </div>

                     <div className="mt-4">
                        <label htmlFor="note-input" className="sr-only">{t('detail.note')}</label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <NoteIcon className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                id="note-input"
                                type="text"
                                value={currentNote}
                                onChange={(e) => setCurrentNote(e.target.value)}
                                onBlur={handleNoteSave}
                                placeholder={t('detail.addNote')}
                                className="w-full pl-10 p-2 border border-slate-300 rounded-md focus:ring-primary focus:border-primary text-slate-900 bg-white"
                            />
                        </div>
                    </div>
                </header>
                
                <div className="mt-6">
                    <AnalysisSection 
                        letter={letter}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        isTranslating={isTranslating}
                        targetLang={targetLang}
                        setTargetLang={setTargetLang}
                        handleTranslate={handleTranslate}
                        onShowOriginal={() => setOriginalTextModalOpen(true)}
                        onShowTranslatedOriginal={() => setTranslatedTextModalOpen(true)}
                    />
                </div>

                {/* Ask AI Button */}
                <div className="mt-10 pt-6 border-t border-slate-200 text-center hidden md:block">
                    <Button variant="primary" size="lg" onClick={() => navigate(`/letter/${id}/chat`)}>
                        {t('detail.askAI')}
                    </Button>
                </div>
                <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-sm border-t z-30">
                    <Button variant="primary" size="lg" onClick={() => navigate(`/letter/${id}/chat`)} className="w-full">
                        {t('detail.askAI')}
                    </Button>
                </div>
            </div>

            {/* Modals */}
            <Modal isOpen={isImageModalOpen} onClose={() => setImageModalOpen(false)} title={t('detail.originalImages')}>
                <div className="flex overflow-x-auto space-x-4 p-4">
                    {letter.images?.map((src, index) => <img key={index} src={src} className="max-h-96 rounded-lg" alt={`Original letter scan ${index + 1}`} />)}
                </div>
            </Modal>
            <Modal isOpen={isDeleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} title={t('confirm.delete.title')}>
                 <p>{t('confirm.delete.message')}</p>
                 <div className="mt-6 flex justify-end gap-3">
                    <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)}>{t('confirm.delete.cancel')}</Button>
                    <Button variant="danger" onClick={handleDelete}>{t('confirm.delete.confirm')}</Button>
                 </div>
            </Modal>
            <Modal isOpen={isReminderModalOpen} onClose={() => setReminderModalOpen(false)} title={t('reminder.title')}>
                <div className="space-y-4">
                    <label htmlFor="reminder-date" className="block text-sm font-medium text-slate-700">{t('reminder.dateLabel')}</label>
                    <input
                        id="reminder-date"
                        type="datetime-local"
                        value={reminderDate}
                        onChange={(e) => setReminderDate(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-primary focus:border-primary text-slate-900 bg-white"
                    />
                    <div className="pt-2 flex justify-end">
                        <Button onClick={handleSetReminder} disabled={!reminderDate}>{t('reminder.setButton')}</Button>
                    </div>
                </div>
            </Modal>
            <Modal isOpen={isDeadlineModalOpen} onClose={() => setDeadlineModalOpen(false)} title={t('deadline.title')}>
                <div className="space-y-4">
                    <p>This action status requires a deadline. Please set one.</p>
                    <label htmlFor="deadline-date" className="block text-sm font-medium text-slate-700">{t('deadline.dateLabel')}</label>
                    <input
                        id="deadline-date"
                        type="date"
                        value={newDeadline}
                        onChange={(e) => setNewDeadline(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-primary focus:border-primary text-slate-900 bg-white"
                    />
                    <div className="pt-2 flex justify-end">
                        <Button onClick={handleSetDeadlineAndStatus} disabled={!newDeadline}>{t('deadline.setButton')}</Button>
                    </div>
                </div>
            </Modal>
            <Modal isOpen={isRemoveReminderConfirmOpen} onClose={() => setRemoveReminderConfirmOpen(false)} title="Remove Reminder">
                <p>This will remove the reminder from the app. You will need to manually remove the event from your Google Calendar. Do you want to proceed?</p>
                <div className="mt-6 flex justify-end gap-3">
                    <Button variant="ghost" onClick={() => setRemoveReminderConfirmOpen(false)}>Cancel</Button>
                    <Button variant="danger" onClick={handleRemoveReminder}>Remove</Button>
                </div>
            </Modal>
             <Modal isOpen={isOriginalTextModalOpen} onClose={() => setOriginalTextModalOpen(false)} title={t('detail.originalContent')}>
                <pre className="p-3 bg-slate-50 rounded-md text-sm text-slate-800 whitespace-pre-wrap font-sans max-h-[60vh] overflow-y-auto">{letter.content}</pre>
            </Modal>
            <Modal isOpen={isTranslatedTextModalOpen} onClose={() => setTranslatedTextModalOpen(false)} title={`${t('detail.originalContent')} (${TOP_LANGUAGES.find(l => l.code === targetLang)?.name})`}>
                <pre className="p-3 bg-slate-50 rounded-md text-sm text-slate-800 whitespace-pre-wrap font-sans max-h-[60vh] overflow-y-auto">{letter.translations?.[targetLang]?.content}</pre>
            </Modal>
        </div>
    );
};

const AnalysisSection: React.FC<{
    letter: Letter;
    activeTab: AnalysisTab;
    setActiveTab: (tab: AnalysisTab) => void;
    isTranslating: boolean;
    targetLang: string;
    setTargetLang: (lang: string) => void;
    handleTranslate: () => void;
    onShowOriginal: () => void;
    onShowTranslatedOriginal: () => void;
}> = ({ letter, activeTab, setActiveTab, isTranslating, targetLang, setTargetLang, handleTranslate, onShowOriginal, onShowTranslatedOriginal }) => {
    const { t } = useI18n();
    const tabs: { id: AnalysisTab; label: string }[] = [
        { id: 'summary', label: t('detail.summary') },
        { id: 'translation', label: t('detail.translation') },
    ];

    const currentTranslation = letter.translations?.[targetLang];
    const targetLanguageName = TOP_LANGUAGES.find(l => l.code === targetLang)?.name || '';

    return (
        <div>
            <div className="border-b border-slate-200">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`${
                                activeTab === tab.id
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="mt-4">
                {activeTab === 'summary' && (
                    <div className="space-y-4">
                        <button onClick={onShowOriginal} className="text-sm text-primary font-semibold hover:underline">{t('detail.showOriginalText')}</button>
                        <InfoSection title={t('detail.summary')} content={letter.ai_summary} />
                        <InfoSection title={t('detail.suggestion')} content={letter.ai_suggestion} />
                    </div>
                )}
                {activeTab === 'translation' && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                             <select
                                value={targetLang}
                                onChange={(e) => setTargetLang(e.target.value)}
                                className="w-full md:w-1/2 px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 h-11"
                                disabled={isTranslating}
                            >
                                <option value="">Select a language...</option>
                                {TOP_LANGUAGES.map(lang => (
                                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                                ))}
                            </select>
                            <Button onClick={handleTranslate} disabled={isTranslating || !targetLang} className="h-11">
                                {isTranslating ? <Spinner size="sm" /> : t('detail.translateButton')}
                            </Button>
                        </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                           {/* Original Column */}
                           <div className="space-y-2">
                               <h4 className="font-bold text-slate-800">Original</h4>
                               <div className="p-3 bg-slate-50 rounded-lg space-y-3 text-sm">
                                    <button onClick={onShowOriginal} className="text-sm text-primary font-semibold hover:underline">{t('detail.showOriginalText')}</button>
                                   <InfoSection title={t('detail.summary')} content={letter.ai_summary} />
                                   <InfoSection title={t('detail.suggestion')} content={letter.ai_suggestion} />
                               </div>
                           </div>
                           {/* Translated Column */}
                           <div className="space-y-2">
                               <h4 className="font-bold text-slate-800">
                                {targetLanguageName ? `Translated (${targetLanguageName})` : 'Translation'}
                               </h4>
                               <div className="p-3 bg-blue-50 rounded-lg space-y-3 text-sm min-h-[160px]">
                                   {isTranslating ? (
                                       <div className="flex justify-center items-center h-full py-8"><Spinner /></div>
                                   ) : currentTranslation ? (
                                    <div className="space-y-4">
                                        <button onClick={onShowTranslatedOriginal} className="text-sm text-primary font-semibold hover:underline">{t('detail.showTranslatedOriginalText')}</button>
                                        <InfoSection title={t('detail.summary')} content={currentTranslation.summary} />
                                        <InfoSection title={t('detail.suggestion')} content={currentTranslation.suggestion} />
                                    </div>
                                   ) : (
                                       <p className="text-slate-500 pt-2">{targetLang ? 'Click translate to see the result.' : 'Select a language to translate.'}</p>
                                   )}
                               </div>
                           </div>
                       </div>
                    </div>
                )}
            </div>
        </div>
    );
};


const InfoSection: React.FC<{ title: string; content: string; }> = ({ title, content }) => (
    <div>
        <h3 className="text-base sm:text-md font-semibold text-slate-700">{title}</h3>
        <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">{content}</p>
    </div>
);

const SenderInfoBlock: React.FC<{ info: SenderInfo }> = ({ info }) => {
    return (
        <div className="text-xs sm:text-sm space-y-1 text-slate-600">
            <p><strong>{info.name}</strong></p>
            {info.address && <p>{info.address}</p>}
            <div className="block md:flex md:gap-4">
              {info.email && <span>{info.email}</span>}
              {info.phone && <span>{info.phone}</span>}
            </div>
        </div>
    )
};


export default LetterDetailPage;