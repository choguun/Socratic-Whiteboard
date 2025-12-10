import React, { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { UploadedImage } from '../types';

interface ImageUploaderProps {
  currentImage: UploadedImage | null;
  onImageSelect: (image: UploadedImage | null) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ currentImage, onImageSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback((file: File) => {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPEG, PNG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('Image is too large. Please upload an image smaller than 10MB.');
        return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Extract base64 raw string (remove data URL prefix)
      const base64 = result.split(',')[1];
      
      onImageSelect({
        file,
        previewUrl: result,
        base64,
        mimeType: file.type
      });
    };
    reader.onerror = () => {
      setError('Failed to read file.');
    };
    reader.readAsDataURL(file);
  }, [onImageSelect]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [processFile]);

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const clearImage = () => {
    onImageSelect(null);
    setError(null);
  };

  return (
    <div className="h-full flex flex-col p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-indigo-600" />
          Problem Source
        </h2>
        <p className="text-sm text-slate-500">Upload an image of your math problem, graph, or homework.</p>
      </div>

      <div
        className={`flex-1 border-2 border-dashed rounded-xl transition-all duration-200 flex flex-col items-center justify-center relative overflow-hidden bg-white/50 backdrop-blur-sm
          ${isDragging ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-300 hover:border-slate-400'}
          ${error ? 'border-red-300 bg-red-50/50' : ''}
        `}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {currentImage ? (
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <img
              src={currentImage.previewUrl}
              alt="Uploaded problem"
              className="max-w-full max-h-full object-contain rounded shadow-sm"
            />
            <button
              onClick={clearImage}
              className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md text-slate-600 hover:text-red-500 transition-colors"
              title="Remove image"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="absolute bottom-4 left-0 right-0 text-center">
                 <span className="inline-block px-3 py-1 bg-white/90 rounded-full text-xs font-medium text-slate-600 shadow-sm">
                    Image ready for analysis
                 </span>
            </div>
          </div>
        ) : (
          <div className="text-center p-6">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isDragging ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
              <Upload className="w-8 h-8" />
            </div>
            <p className="text-slate-700 font-medium mb-1">
              Drag & drop your image here
            </p>
            <p className="text-slate-500 text-sm mb-4">
              or click to browse
            </p>
            <label className="inline-flex cursor-pointer">
              <span className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
                Select File
              </span>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={onFileInputChange}
              />
            </label>
            {error && (
              <p className="mt-4 text-sm text-red-500 bg-red-50 px-3 py-1 rounded-md inline-block border border-red-100">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;