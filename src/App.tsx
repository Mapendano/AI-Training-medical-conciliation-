import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Stethoscope, User, ClipboardList, Info, Play, Square, RefreshCcw, HeartPulse } from 'lucide-react';
import { LiveSession } from './lib/live-session';

export default function App() {
  const [isStarted, setIsStarted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const sessionRef = useRef<LiveSession | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  const startConsultation = async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      alert("Clé API Gemini manquante.");
      return;
    }

    setIsStarted(true);
    setIsConnected(true);
    setTranscript([]);

    sessionRef.current = new LiveSession(
      apiKey,
      (text) => setTranscript(prev => [...prev, text]),
      () => {
        // Handle interruption if needed
      }
    );

    try {
      await sessionRef.current.connect();
    } catch (error) {
      console.error("Failed to connect:", error);
      setIsConnected(false);
      setIsStarted(false);
    }
  };

  const stopConsultation = () => {
    sessionRef.current?.stop();
    setIsConnected(false);
    setIsStarted(false);
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4 md:p-8">
      <AnimatePresence mode="wait">
        {!isStarted ? (
          <motion.div
            key="start-screen"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl w-full glass-panel rounded-3xl p-8 md:p-12 text-center space-y-8"
          >
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                <Stethoscope size={40} />
              </div>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl font-serif font-medium text-stone-900 tracking-tight">
                Clinique Virtuelle AI
              </h1>
              <p className="text-stone-600 text-lg leading-relaxed">
                Entraînez-vous à la consultation clinique avec notre simulateur de patient intelligent. 
                Utilisez votre voix pour interroger le patient, poser un diagnostic et proposer un traitement.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              <div className="p-4 bg-stone-100 rounded-xl space-y-2">
                <User size={20} className="text-emerald-600" />
                <h3 className="font-medium text-sm text-stone-900">Simulation</h3>
                <p className="text-xs text-stone-500">Interagissez avec un patient réaliste.</p>
              </div>
              <div className="p-4 bg-stone-100 rounded-xl space-y-2">
                <ClipboardList size={20} className="text-emerald-600" />
                <h3 className="font-medium text-sm text-stone-900">Évaluation</h3>
                <p className="text-xs text-stone-500">Recevez un feedback détaillé sur votre performance.</p>
              </div>
              <div className="p-4 bg-stone-100 rounded-xl space-y-2">
                <Info size={20} className="text-emerald-600" />
                <h3 className="font-medium text-sm text-stone-900">Conseils</h3>
                <p className="text-xs text-stone-500">Apprenez des perles de sémiologie clinique.</p>
              </div>
            </div>

            <button
              onClick={startConsultation}
              className="w-full py-4 bg-stone-900 text-white rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-stone-800 transition-colors group cursor-pointer"
            >
              <Play size={20} className="group-hover:scale-110 transition-transform" />
              Commencer la Consultation
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="consultation-screen"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-4xl w-full h-[80vh] flex flex-col glass-panel rounded-3xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                  <HeartPulse size={20} />
                </div>
                <div>
                  <h2 className="font-medium text-stone-900">Consultation en cours</h2>
                  <p className="text-xs text-stone-500 flex items-center gap-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    Patient connecté
                  </p>
                </div>
              </div>
              <button
                onClick={stopConsultation}
                className="p-2 text-stone-400 hover:text-red-500 transition-colors cursor-pointer"
                title="Quitter la consultation"
              >
                <Square size={20} />
              </button>
            </div>

            {/* Transcript Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 bg-stone-50/50"
            >
              {transcript.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-stone-400 space-y-4">
                  <div className="pulse-ring w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <Mic size={32} />
                  </div>
                  <p className="text-sm italic">Le patient attend que vous parliez...</p>
                </div>
              )}
              {transcript.map((text, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-4"
                >
                  <div className="w-8 h-8 rounded-full bg-stone-200 flex-shrink-0 flex items-center justify-center text-stone-500">
                    <User size={16} />
                  </div>
                  <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-stone-100 shadow-sm max-w-[80%]">
                    <p className="text-stone-800 leading-relaxed">{text}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Controls */}
            <div className="p-6 bg-white border-t border-stone-100 flex flex-col items-center gap-4">
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                      isConnected ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-stone-200 text-stone-400'
                    } shadow-lg pulse-ring`}>
                    <Mic size={28} />
                  </div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-stone-400">Microphone Actif</span>
                </div>
              </div>
              
              <div className="w-full flex justify-between items-center px-4">
                <p className="text-xs text-stone-400 italic max-w-[60%]">
                  Dites "Fin de consultation" pour recevoir votre évaluation.
                </p>
                <button 
                  onClick={() => setTranscript([])}
                  className="text-stone-400 hover:text-stone-600 transition-colors flex items-center gap-1 text-xs cursor-pointer"
                >
                  <RefreshCcw size={14} />
                  Effacer l'historique
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

