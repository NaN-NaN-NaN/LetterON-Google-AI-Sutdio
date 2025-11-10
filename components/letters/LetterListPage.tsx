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

const LetterListPage: React.FC = () => {
    const [letters, setLetters] = useState<Letter[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setModalOpen] = useState(false);
    const { t } = useI18n();

    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState<LetterCategory | 'all'>('all');
    const [filterStarred, setFilterStarred] = useState(false);
    const [filterReminder, setFilterReminder] = useState(false);
    const [filterSentStart, setFilterSentStart] = useState('');
    const [filterSentEnd, setFilterSentEnd] = useState('');
    const [filterUploadedStart, setFilterUploadedStart] = useState('');
    const [filterUploadedEnd, setFilterUploadedEnd] = useState('');

    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

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
                    letter.sender_info.name.toLowerCase().includes(lowerSearch)
                );
            })
            .filter(letter => filterCategory === 'all' || letter.category === filterCategory)
            .filter(letter => !filterStarred || letter.starred)
            .filter(letter => !filterReminder || letter.reminder_active)
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
    }, [letters, searchTerm, filterCategory, filterStarred, filterReminder, filterSentStart, filterSentEnd, filterUploadedStart, filterUploadedEnd]);

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

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-slate-800">{t('letters.title')}</h1>
                <Button onClick={() => setModalOpen(true)}>{t('letters.add')}</Button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm mb-6 space-y-4">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        placeholder={t('letters.search')}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="flex-grow w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900"
                    />
                    <Button variant="ghost" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}>
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-600">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                        </svg>
                    </Button>
                </div>
                
                {showAdvancedFilters && (
                    <div className="pt-4 border-t border-slate-200 animate-fade-in-down">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Column 1 */}
                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-slate-700">Category</label>
                                <select
                                    value={filterCategory}
                                    onChange={e => setFilterCategory(e.target.value as any)}
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900"
                                >
                                    <option value="all">{t('letters.filter.allCategories')}</option>
                                    {CATEGORY_OPTIONS.map(cat => (
                                        <option key={cat} value={cat}>{t(`category.${cat}`)}</option>
                                    ))}
                                </select>
                                <div className="flex items-center space-x-2 pt-2">
                                    <input type="checkbox" id="starred" checked={filterStarred} onChange={e => setFilterStarred(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" />
                                    <label htmlFor="starred" className="text-slate-700">{t('letters.filter.starred')}</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input type="checkbox" id="reminder" checked={filterReminder} onChange={e => setFilterReminder(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" />
                                    <label htmlFor="reminder" className="text-slate-700">{t('letters.filter.reminder')}</label>
                                </div>
                            </div>

                            {/* Column 2 */}
                             <div className="space-y-4">
                                <label className="block text-sm font-medium text-slate-700">Sent Date Range</label>
                                <input type="date" value={filterSentStart} onChange={e => setFilterSentStart(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900"/>
                                <input type="date" value={filterSentEnd} onChange={e => setFilterSentEnd(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900"/>
                            </div>

                            {/* Column 3 */}
                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-slate-700">Uploaded Date Range</label>
                                <input type="date" value={filterUploadedStart} onChange={e => setFilterUploadedStart(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900"/>
                                <input type="date" value={filterUploadedEnd} onChange={e => setFilterUploadedEnd(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900"/>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
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

            <AddLetterModal 
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                onLetterAdded={fetchUserLetters}
            />
        </div>
    );
};

export default LetterListPage;