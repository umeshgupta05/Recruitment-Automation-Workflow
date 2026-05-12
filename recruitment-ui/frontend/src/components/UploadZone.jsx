import { useState, useRef, useCallback } from 'react';
import { Upload, File, X } from 'lucide-react';
import clsx from 'clsx';

export default function UploadZone({ onFile, accept = '.pdf', maxSizeMB = 5, compact = false }) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const validateFile = useCallback(
    (file) => {
      if (!file) return 'No file selected';
      if (accept === '.pdf' && file.type !== 'application/pdf') return 'Only PDF files are allowed';
      if (file.size > maxSizeMB * 1024 * 1024) return `File must be smaller than ${maxSizeMB}MB`;
      return null;
    },
    [accept, maxSizeMB]
  );

  const handleFile = useCallback(
    (file) => {
      const err = validateFile(file);
      if (err) {
        setError(err);
        return;
      }
      setError('');
      setSelectedFile(file);
      onFile?.(file);
    },
    [validateFile, onFile]
  );

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const clearFile = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
    onFile?.(null);
  };

  if (compact) {
    return (
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={clsx(
          'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200',
          isDragging
            ? 'border-primary-500/60 bg-primary-500/5'
            : 'border-neutral-600/40 hover:border-neutral-500/60 hover:bg-surface-tertiary/30'
        )}
      >
        <Upload className="w-6 h-6 mx-auto mb-2 text-neutral-500" />
        <p className="text-sm text-neutral-400">Drop PDF here or click to browse</p>
        <p className="text-xs text-neutral-600 mt-1">Triggers WF1 automatically</p>
        <input ref={inputRef} type="file" accept={accept} onChange={handleInputChange} className="hidden" />
      </div>
    );
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={clsx(
          'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200',
          isDragging
            ? 'border-primary-500/60 bg-primary-500/5'
            : selectedFile
            ? 'border-success-500/40 bg-success-500/5'
            : 'border-neutral-600/40 hover:border-neutral-500/60 hover:bg-surface-tertiary/30'
        )}
      >
        {selectedFile ? (
          <div className="flex items-center justify-center gap-3">
            <File className="w-8 h-8 text-success-400" />
            <div className="text-left">
              <p className="text-sm font-medium text-neutral-200">{selectedFile.name}</p>
              <p className="text-xs text-neutral-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              onClick={clearFile}
              className="p-1.5 rounded-lg hover:bg-surface-tertiary text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-surface-tertiary flex items-center justify-center">
              <Upload className="w-7 h-7 text-neutral-400" />
            </div>
            <p className="text-sm font-medium text-neutral-300 mb-1">
              Drag & drop your resume PDF here
            </p>
            <p className="text-xs text-neutral-500">or click to browse • PDF only, max {maxSizeMB}MB</p>
          </>
        )}
        <input ref={inputRef} type="file" accept={accept} onChange={handleInputChange} className="hidden" />
      </div>
      {error && <p className="text-xs text-danger-400 mt-2">{error}</p>}
    </div>
  );
}
