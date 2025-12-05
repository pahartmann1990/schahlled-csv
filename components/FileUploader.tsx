import React, { useRef } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { Button } from './Button';

interface FileUploaderProps {
  onFileUpload: (file: File) => void;
  isLoading?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileUpload, isLoading = false }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
    // Reset value to allow re-uploading same file
    if (event.target.value) {
        event.target.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full p-10 border-2 border-dashed border-blue-200 bg-blue-50/30 rounded-xl hover:bg-blue-50 transition-colors cursor-pointer group" onClick={handleClick}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleChange}
        accept=".csv, .xlsx, .xls"
        className="hidden"
      />
      <div className="text-center transition-transform group-hover:scale-105 duration-200">
        <div className="mx-auto h-16 w-16 text-blue-400 mb-4 bg-white p-3 rounded-full shadow-sm">
          <FileSpreadsheet className="w-full h-full" />
        </div>
        <h3 className="mt-2 text-lg font-semibold text-gray-900">Excel oder CSV Datei öffnen</h3>
        <p className="mt-1 text-sm text-gray-500 mb-6">Unterstützt .xlsx, .xls und .csv Formate</p>
        <div>
            <Button onClick={(e) => { e.stopPropagation(); handleClick(); }} disabled={isLoading}>
                {isLoading ? 'Verarbeite Daten...' : 'Datei auswählen'}
            </Button>
        </div>
      </div>
    </div>
  );
};