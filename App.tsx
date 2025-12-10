import React, { useState } from 'react';
import ImageUploader from './components/ImageUploader';
import ChatInterface from './components/ChatInterface';
import { UploadedImage } from './types';

function App() {
  const [currentImage, setCurrentImage] = useState<UploadedImage | null>(null);

  return (
    <div className="relative min-h-screen bg-slate-50 overflow-hidden flex flex-col">
      {/* Graph Paper Background Effect */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #000 1px, transparent 1px),
            linear-gradient(to bottom, #000 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px'
        }}
      />
      
      {/* Main Layout */}
      <main className="relative z-10 flex-1 flex flex-col md:flex-row h-screen max-h-screen overflow-hidden">
        
        {/* Left Panel: Image Upload */}
        <section className="w-full md:w-[45%] lg:w-[40%] h-[40vh] md:h-full border-b md:border-b-0 md:border-r border-slate-200 bg-white/40 backdrop-blur-sm">
          <ImageUploader 
            currentImage={currentImage} 
            onImageSelect={setCurrentImage} 
          />
        </section>

        {/* Right Panel: Chat */}
        <section className="w-full md:w-[55%] lg:w-[60%] h-[60vh] md:h-full">
          <ChatInterface uploadedImage={currentImage} />
        </section>

      </main>
    </div>
  );
}

export default App;