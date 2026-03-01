'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Loader2, Briefcase, DollarSign, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFetchOnMount } from '@/lib/hooks';
import type { Career } from '@/lib/types';

export function ThisCareerApp() {
  const [career, loading, refetch] = useFetchOnMount(async () => {
    const response = await fetch('/api/generate/career', { method: 'POST' });
    return response.json() as Promise<Career>;
  }, { title: '', description: '', salary: '', skills: [] });

  return (
    <div className="py-4 sm:py-8">
      <div className="text-center mb-6 sm:mb-8">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          className="text-4xl sm:text-6xl mb-3 sm:mb-4"
        >
          💼
        </motion.div>
        <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">This Career Does Not Exist</h2>
        <p className="text-zinc-400 text-sm sm:text-base px-4">AI-generated jobs that sound real but aren&apos;t.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-10 h-10 animate-spin text-cyan-500 mb-3" />
          <p className="text-zinc-600 text-sm italic">Inventing a career path...</p>
        </div>
      ) : career.title && (
        <AnimatePresence mode="wait">
          <motion.div 
            key={career.title} 
            initial={{ opacity: 0, y: 24 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-md mx-auto px-4"
          >
            {/* Job listing card */}
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800/80 shadow-2xl shadow-cyan-500/5">
              {/* Top accent bar */}
              <div className="h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500" />
              
              <div className="p-5 sm:p-7">
                {/* Company branding area */}
                <div className="flex items-start gap-4 mb-5">
                  <motion.div 
                    initial={{ rotate: -10, scale: 0.8 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 shrink-0"
                  >
                    <Briefcase className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </motion.div>
                  <div className="min-w-0">
                    <motion.h3 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-lg sm:text-xl font-bold text-white leading-tight mb-1"
                    >
                      {career.title}
                    </motion.h3>
                    <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[10px] sm:text-xs">
                      <Sparkles className="w-3 h-3 mr-1" />AI Generated
                    </Badge>
                  </div>
                </div>

                {/* Description */}
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-zinc-400 text-sm sm:text-base leading-relaxed mb-5"
                >
                  {career.description}
                </motion.p>

                {/* Salary section */}
                <motion.div 
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 sm:p-4 mb-5"
                >
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-[10px] sm:text-xs text-zinc-500 uppercase tracking-wider">Salary Range</div>
                    <div className="text-base sm:text-lg font-bold text-emerald-400">{career.salary}</div>
                  </div>
                </motion.div>

                {/* Skills */}
                <motion.div 
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="text-[10px] sm:text-xs text-zinc-500 uppercase tracking-wider mb-2">Required Skills</div>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {career.skills.map((skill, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.45 + i * 0.06 }}
                      >
                        <Badge variant="secondary" className="bg-zinc-800/80 text-zinc-300 border-zinc-700/50 text-xs px-2.5 py-1">
                          {skill}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      <div className="mt-6 sm:mt-8 text-center px-4">
        <Button 
          onClick={refetch} 
          disabled={loading} 
          className="w-full sm:w-auto bg-gradient-to-r from-cyan-600 to-blue-600 active:from-cyan-700 active:to-blue-700 min-h-[44px] px-6 shadow-lg shadow-cyan-500/15"
        >
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Generate Another
        </Button>
      </div>
    </div>
  );
}
