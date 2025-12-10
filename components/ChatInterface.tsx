import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, RotateCcw, Lightbulb } from 'lucide-react';
import { Message, Role, UploadedImage } from '../types';
import { sendMessageToGemini } from '../services/geminiService';
import MarkdownRenderer from './MarkdownRenderer';

interface ChatInterfaceProps {
  uploadedImage: UploadedImage | null;
  onClearBoard: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ uploadedImage, onClearBoard }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: Role.MODEL,
      text: "Hello! I'm your Socratic Tutor. Upload a problem or ask me a question, and let's work through it together.",
      timestamp: Date.now(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Ref to track the processed image to prevent double-sends or loops
  const prevImageRef = useRef<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Auto-analyze when a new image is uploaded
  useEffect(() => {
    const handleNewImage = async () => {
      if (uploadedImage && uploadedImage.previewUrl !== prevImageRef.current) {
        prevImageRef.current = uploadedImage.previewUrl;
        
        // Auto-trigger the analysis message
        await processMessage("I've uploaded an image. Can you analyze this problem and guide me?", true);
      } else if (!uploadedImage) {
        prevImageRef.current = null;
      }
    };

    handleNewImage();
  }, [uploadedImage]);

  const processMessage = async (text: string, isAutoTrigger: boolean = false) => {
    if (isLoading) return;

    const userText = text.trim();
    if (!userText) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text: userText,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, newUserMessage]);
    if (!isAutoTrigger) setInput(''); // Only clear input if manual typing
    setIsLoading(true);

    try {
      const responseText = await sendMessageToGemini(
        messages, // Send history
        newUserMessage.text,
        uploadedImage?.base64 || null,
        uploadedImage?.mimeType || null
      );

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.MODEL,
        text: responseText,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.MODEL,
        text: "I encountered an error trying to analyze that. Please check your connection and try again.",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    processMessage(input);
  };

  const handleHint = () => {
    processMessage("I'm stuck. Could you give me a specific hint to help me move forward?", true);
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to clear the board? This will remove the image and chat history.")) {
      setMessages([{
        id: 'welcome',
        role: Role.MODEL,
        text: "Hello! I'm your Socratic Tutor. Upload a problem or ask me a question, and let's work through it together.",
        timestamp: Date.now(),
      }]);
      setInput('');
      prevImageRef.current = null; // Reset image tracking
      onClearBoard();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white/60 backdrop-blur-sm border-l border-slate-200/60">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-white/80 backdrop-blur flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Bot className="w-6 h-6 text-indigo-600" />
            Tutor Chat
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            I will guide you, not give you the answers.
          </p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Reset Board"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full ${msg.role === Role.USER ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${msg.role === Role.USER ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm
                ${msg.role === Role.USER ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}
              `}>
                {msg.role === Role.USER ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              
              <div className={`
                p-4 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed
                ${msg.role === Role.USER 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-gray-100 text-slate-800 rounded-tl-none'}
              `}>
                {msg.role === Role.USER ? (
                   <p className="whitespace-pre-wrap">{msg.text}</p>
                ) : (
                   <MarkdownRenderer content={msg.text} />
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start w-full">
             <div className="flex max-w-[75%] gap-3">
               <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                 <Bot className="w-5 h-5" />
               </div>
               <div className="bg-gray-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2 text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
               </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200">
        <div className="flex items-end gap-2">
           {/* Hint Button */}
           <button
             onClick={handleHint}
             disabled={isLoading}
             className={`
               p-3 rounded-xl mb-0.5 transition-all flex-shrink-0 border flex flex-col items-center justify-center gap-1
               ${isLoading 
                 ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed' 
                 : 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100 hover:border-amber-300 shadow-sm'}
             `}
             title="Get a hint"
             type="button"
           >
             <Lightbulb className="w-5 h-5" />
             <span className="text-[10px] font-bold uppercase tracking-wider">Hint</span>
           </button>

           {/* Text Input */}
           <div className="relative flex-1 flex items-end gap-2 bg-slate-50 border border-slate-300 rounded-xl p-2 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all shadow-sm">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={uploadedImage ? "Ask a follow-up question..." : "Type your question here..."}
              className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-2.5 px-2 text-slate-800 placeholder:text-slate-400"
              rows={1}
              style={{ height: 'auto', minHeight: '44px' }}
              onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`
                p-2.5 rounded-lg mb-0.5 transition-colors flex-shrink-0
                ${!input.trim() || isLoading
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'}
              `}
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {uploadedImage && (
            <div className="mt-2 text-xs text-indigo-600 flex items-center gap-1 pl-14">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                Analysing: <strong>Attached Image</strong>
            </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;