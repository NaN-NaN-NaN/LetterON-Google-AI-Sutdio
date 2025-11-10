import React, { useState, useEffect, useMemo } from 'react';
import { getLetters } from '../../services/mockApi';
import { Letter, LetterCategory, ActionStatus } from '../../types';
import LetterCard from './LetterCard';
import { useI18n } from '../../hooks/useI18n';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import AddLetterModal from './AddLetterModal';
import { CATEGORY_OPTIONS } from '../../constants';
import Chip from '../ui/Chip';
import Modal from '../ui/Modal';

const LetterListPage: React.FC = () => {
    const [letters, setLetters] = useState<Letter[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isFilterModalOpen, setFilterModalOpen] = useState(false);
    const { t } = useI18n();

    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState<LetterCategory | 'all'>('all');
    const [filterStarred, setFilterStarred] = useState(false);
    const [filterReminder, setFilterReminder] = useState(false);
    const [filterHasNote, setFilterHasNote] = useState(false);
    const [filterSentStart, setFilterSentStart] = useState('');
    const [filterSentEnd, setFilterSentEnd] = useState('');
    const [filterUploadedStart, setFilterUploadedStart] = useState('');
    const [filterUploadedEnd, setFilterUploadedEnd] = useState('');

    const fetchUserLetters = () => {
        setLoading(true);
        getLetters()
            .then(data => {
                setLetters(data);
                setError('');
            })
            .catch(err => setError('Failed to fetch letters.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchUserLetters();
    }, []);
    
    const filteredLetters = useMemo(() => {
        return letters
            .filter(letter => {
                if (!searchTerm) return true;
                const lowerSearch = searchTerm.toLowerCase();
                return (
                    letter.title.toLowerCase().includes(lowerSearch) ||
                    letter.ai_summary.toLowerCase().includes(lowerSearch) ||
                    letter.sender_info.name.toLowerCase().includes(lowerSearch) ||
                    (letter.note && letter.note.toLowerCase().includes(lowerSearch))
                );
            })
            .filter(letter => filterCategory === 'all' || letter.category === filterCategory)
            .filter(letter => !filterStarred || letter.starred)
            .filter(letter => !filterReminder || letter.reminder_active)
            .filter(letter => !filterHasNote || (letter.note && letter.note.trim() !== ''))
            .filter(letter => {
                if (!filterSentStart && !filterSentEnd) return true;
                const sentDate = new Date(letter.sent_at);
                sentDate.setHours(0, 0, 0, 0);
                if (filterSentStart && sentDate < new Date(filterSentStart)) return false;
                if (filterSentEnd && sentDate > new Date(filterSentEnd)) return false;
                return true;
            })
            .filter(letter => {
                if (!filterUploadedStart && !filterUploadedEnd) return true;
                const createdDate = new Date(letter.created_at);
                createdDate.setHours(0, 0, 0, 0);
                if (filterUploadedStart && createdDate < new Date(filterUploadedStart)) return false;
                if (filterUploadedEnd && createdDate > new Date(filterUploadedEnd)) return false;
                return true;
            })
            .sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime());
    }, [letters, searchTerm, filterCategory, filterStarred, filterReminder, filterHasNote, filterSentStart, filterSentEnd, filterUploadedStart, filterUploadedEnd]);

    const clearDateFilter = (filter: 'sent' | 'uploaded') => {
        if (filter === 'sent') {
            setFilterSentStart('');
            setFilterSentEnd('');
        } else {
            setFilterUploadedStart('');
            setFilterUploadedEnd('');
        }
    }


    if (loading) {
        return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
    }

    if (error) {
        return <div className="text-center text-red-500">{error}</div>;
    }

    const AdvancedFilters = () => (
        <div className="animate-fade-in-down">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {/* Column 1 */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Category</label>
                        <select
                            value={filterCategory}
                            onChange={e => setFilterCategory(e.target.value as any)}
                            className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900"
                        >
                            <option value="all">{t('letters.filter.allCategories')}</option>
                            {CATEGORY_OPTIONS.map(cat => (
                                <option key={cat} value={cat}>{t(`category.${cat}`)}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2 pt-2">
                        <div className="flex items-center space-x-2 bg-slate-100 p-2 rounded-md">
                            <input type="checkbox" id="starred" checked={filterStarred} onChange={e => setFilterStarred(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" />
                            <label htmlFor="starred" className="text-slate-700 font-medium">{t('letters.filter.starred')}</label>
                        </div>
                        <div className="flex items-center space-x-2 bg-slate-100 p-2 rounded-md">
                            <input type="checkbox" id="reminder" checked={filterReminder} onChange={e => setFilterReminder(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" />
                            <label htmlFor="reminder" className="text-slate-700 font-medium">{t('letters.filter.reminder')}</label>
                        </div>
                        <div className="flex items-center space-x-2 bg-slate-100 p-2 rounded-md">
                            <input type="checkbox" id="hasNote" checked={filterHasNote} onChange={e => setFilterHasNote(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" />
                            <label htmlFor="hasNote" className="text-slate-700 font-medium">{t('letters.filter.hasNote')}</label>
                        </div>
                    </div>
                </div>

                {/* Column 2 */}
                 <div className="space-y-4">
                    <label className="block text-sm font-medium text-slate-700">Sent Date Range</label>
                    <div>
                        <label htmlFor="sent-from" className="text-xs text-slate-500">From</label>
                        <input id="sent-from" type="date" value={filterSentStart} onChange={e => setFilterSentStart(e.target.value)} className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900"/>
                    </div>
                    <div>
                        <label htmlFor="sent-to" className="text-xs text-slate-500">To</label>
                        <input id="sent-to" type="date" value={filterSentEnd} onChange={e => setFilterSentEnd(e.target.value)} className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900"/>
                    </div>
                </div>

                {/* Column 3 */}
                <div className="space-y-4">
                    <label className="block text-sm font-medium text-slate-700">Uploaded Date Range</label>
                    <div>
                        <label htmlFor="uploaded-from" className="text-xs text-slate-500">From</label>
                        <input id="uploaded-from" type="date" value={filterUploadedStart} onChange={e => setFilterUploadedStart(e.target.value)} className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900"/>
                    </div>
                    <div>
                        <label htmlFor="uploaded-to" className="text-xs text-slate-500">To</label>
                        <input id="uploaded-to" type="date" value={filterUploadedEnd} onChange={e => setFilterUploadedEnd(e.target.value)} className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900"/>
                    </div>
                </div>
            </div>
             <div className="mt-6 flex justify-end">
                <Button onClick={() => setFilterModalOpen(false)}>Apply Filters</Button>
            </div>
        </div>
    );


    return (
        <div className="pb-24 md:pb-0">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-slate-800">{t('letters.title')}</h1>
                <div className="hidden md:block">
                    <Button onClick={() => setAddModalOpen(true)}>{t('letters.add')}</Button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
                <div className="flex items-center gap-2 mb-4">
                     <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder={t('letters.search')}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 pr-10"
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')} 
                                className="absolute inset-y-0 right-0 flex items-center pr-3"
                                aria-label="Clear search"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 hover:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </button>
                        )}
                    </div>
                    <Button variant="ghost" onClick={() => setFilterModalOpen(true)}>
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-600">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                        </svg>
                    </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                    {filterCategory !== 'all' && (
                        <Chip onRemove={() => setFilterCategory('all')}>
                            {t('letters.filter.category')}: {t(`category.${filterCategory}`)}
                        </Chip>
                    )}
                    {filterStarred && (
                        <Chip onRemove={() => setFilterStarred(false)}>
                            {t('letters.filter.starred')}
                        </Chip>
                    )}
                    {filterReminder && (
                        <Chip onRemove={() => setFilterReminder(false)}>
                            {t('letters.filter.reminder')}
                        </Chip>
                    )}
                     {filterHasNote && (
                        <Chip onRemove={() => setFilterHasNote(false)}>
                            {t('letters.filter.hasNote')}
                        </Chip>
                    )}
                    {(filterSentStart || filterSentEnd) && (
                        <Chip onRemove={() => clearDateFilter('sent')}>
                            Sent: {filterSentStart || '...'} to {filterSentEnd || '...'}
                        </Chip>
                    )}
                    {(filterUploadedStart || filterUploadedEnd) && (
                        <Chip onRemove={() => clearDateFilter('uploaded')}>
                            Uploaded: {filterUploadedStart || '...'} to {filterUploadedEnd || '...'}
                        </Chip>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {filteredLetters.length > 0 ? (
                    filteredLetters.map(letter => <LetterCard key={letter.id} letter={letter} />)
                ) : (
                    <div className="text-center py-12 text-slate-500">
                        <p>No letters found.</p>
                    </div>
                )}
            </div>

            {/* Mobile "Add Letter" Button */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-sm border-t z-30">
                <Button onClick={() => setAddModalOpen(true)} className="w-full" size="lg">{t('letters.add')}</Button>
            </div>

            <AddLetterModal 
                isOpen={isAddModalOpen}
                onClose={() => setAddModalOpen(false)}
                onLetterAdded={fetchUserLetters}
            />

            <Modal isOpen={isFilterModalOpen} onClose={() => setFilterModalOpen(false)} title="Advanced Filters" size="xl">
                <AdvancedFilters />
            </Modal>
        </div>
    );
};

export default LetterListPage;