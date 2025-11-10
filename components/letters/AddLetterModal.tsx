import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { useI18n } from '../../hooks/useI18n';
import { TOP_LANGUAGES } from '../../constants';
import { analyzeLetterContent } from '../../services/geminiService';
import { createLetter } from '../../services/mockApi';
import { Letter } from '../../types';

interface AddLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLetterAdded: () => void;
}

type UploadStep = 'upload' | 'analyzing' | 'success' | 'error';

const AddLetterModal: React.FC<AddLetterModalProps> = ({ isOpen, onClose, onLetterAdded }) => {
  const [images, setImages] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [translationLang, setTranslationLang] = useState('');
  const [step, setStep] = useState<UploadStep>('upload');
  const [newLetterId, setNewLetterId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [analyzedResult, setAnalyzedResult] = useState<Partial<Letter> | null>(null);


  const { t } = useI18n();
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      let fileArray = Array.from(e.target.files);
      setUploadError('');

      if (fileArray.length > 5) {
          setUploadError('You can only upload a maximum of 5 images.');
          fileArray = fileArray.slice(0, 5);
      }
      
      setFiles(fileArray);

      const imagePromises = fileArray.map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      Promise.all(imagePromises).then(setImages);
    }
  };

  const handleSubmit = async () => {
    if (images.length === 0) return;
    
    setStep('analyzing');
    
    try {
      const analyzedData = await analyzeLetterContent(images, translationLang || undefined);
      setAnalyzedResult(analyzedData);
      const letterDataWithImages = { ...analyzedData, images: images };
      const newLetter = await createLetter(letterDataWithImages);
      setNewLetterId(newLetter.id);
      setStep('success');
      onLetterAdded();
    } catch (error: any) {
      console.error(error);
      setUploadError(error.message || 'Analysis failed. Please try again.');
      setStep('error');
    }
  };
  
  const resetAndClose = () => {
    setImages([]);
    setFiles([]);
    setTranslationLang('');
    setStep('upload');
    setNewLetterId(null);
    setUploadError('');
    setAnalyzedResult(null);
    onClose();
  };

  const renderContent = () => {
    switch(step) {
      case 'analyzing':
        return (
          <div className="text-center py-12">
            <Spinner size="lg" className="mx-auto" />
            <p className="mt-4 text-slate-600">{t('addLetter.analyzing')}</p>
          </div>
        );
      case 'success':
        return (
          <div className="text-center py-8">
            <h3 className="text-xl font-semibold text-green-600">{t('addLetter.success')}</h3>
            {analyzedResult && (
                <div className="mt-4 text-left p-4 bg-slate-50 rounded-lg border">
                    <h4 className="font-bold text-slate-800">{analyzedResult.title}</h4>
                    <p className="text-sm text-slate-600 mt-2 line-clamp-3">{analyzedResult.ai_summary}</p>
                    <div className="mt-2 text-xs">
                        <span className="font-semibold">{t('detail.category')}: </span>
                        {analyzedResult.category ? t(`category.${analyzedResult.category}`) : 'N/A'}
                    </div>
                </div>
            )}
            <div className="mt-6 flex justify-center gap-4">
              <Button onClick={resetAndClose}>{t('addLetter.backToHome')}</Button>
              <Button variant="secondary" onClick={() => { if(newLetterId) navigate(`/letter/${newLetterId}`); resetAndClose(); }}>{t('addLetter.viewDetails')}</Button>
            </div>
          </div>
        );
      case 'error':
        return (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-red-600">{t('addLetter.error')}</h3>
            <p className="text-slate-600 mt-2 text-sm">{uploadError}</p>
            <div className="mt-6">
              <Button onClick={() => setStep('upload')}>Try Again</Button>
            </div>
          </div>
        );
      case 'upload':
      default:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t('addLetter.uploadImages')}</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex justify-center text-sm text-slate-600">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
                      <span>{t('addLetter.uploadButton')}</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} accept="image/*"/>
                    </label>
                  </div>
                  <p className="text-xs text-slate-500">Max 5 images.</p>
                </div>
              </div>
              {uploadError && <p className="text-sm text-red-500 mt-2">{uploadError}</p>}
              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {images.map((src, index) => <img key={index} src={src} alt={`preview ${index}`} className="h-24 w-full object-cover rounded"/>)}
                </div>
              )}
            </div>
            <div>
              <label htmlFor="translation" className="block text-sm font-medium text-slate-700">{t('addLetter.translation')}</label>
              <select id="translation" value={translationLang} onChange={(e) => setTranslationLang(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 border-slate-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md text-slate-900 bg-slate-50">
                <option value="">{t('addLetter.noTranslation')}</option>
                {TOP_LANGUAGES.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
              </select>
            </div>
            <div className="pt-4">
              <Button className="w-full" onClick={handleSubmit} disabled={files.length === 0}>
                {t('addLetter.submit')}
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} title={step === 'upload' ? t('addLetter.title') : ''}>
      {renderContent()}
    </Modal>
  );
};

export default AddLetterModal;