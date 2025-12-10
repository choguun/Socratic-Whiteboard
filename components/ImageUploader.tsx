import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Camera } from 'lucide-react';
import { UploadedImage } from '../types';

interface ImageUploaderProps {
  currentImage: UploadedImage | null;
  onImageSelect: (image: UploadedImage | null) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ currentImage, onImageSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  // Camera functions
  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      // Wait for the video element to render before setting srcObject
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error("Camera error:", err);
      setError('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
            processFile(file);
            stopCamera();
          } else {
            setError('Failed to capture image.');
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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
          ${isCameraActive ? 'border-indigo-500 bg-black' : ''}
        `}
        onDragOver={!isCameraActive ? onDragOver : undefined}
        onDragLeave={!isCameraActive ? onDragLeave : undefined}
        onDrop={!isCameraActive ? onDrop : undefined}
      >
        {isCameraActive ? (
          <div className="relative w-full h-full flex flex-col">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 z-10">
               <button 
                 onClick={capturePhoto}
                 className="w-14 h-14 bg-white rounded-full border-4 border-indigo-200 flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                 title="Capture Photo"
               >
                 <div className="w-10 h-10 bg-indigo-600 rounded-full"></div>
               </button>
               <button 
                 onClick={stopCamera}
                 className="absolute right-4 bottom-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 backdrop-blur-sm"
                 title="Close Camera"
               >
                 <X className="w-6 h-6" />
               </button>
            </div>
          </div>
        ) : currentImage ? (
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
          <div className="text-center p-6 w-full max-w-sm">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isDragging ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
              <Upload className="w-8 h-8" />
            </div>
            <p className="text-slate-700 font-medium mb-1">
              Drag & drop your image here
            </p>
            <p className="text-slate-500 text-sm mb-6">
              or use one of the options below
            </p>
            
            <div className="flex gap-3 justify-center">
              <label className="inline-flex cursor-pointer">
                <span className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
                  Select File
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={onFileInputChange}
                />
              </label>
              
              <button
                onClick={startCamera}
                className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
              >
                <Camera className="w-4 h-4" />
                Camera
              </button>
            </div>
            
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