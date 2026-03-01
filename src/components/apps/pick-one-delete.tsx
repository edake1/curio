'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getSessionId } from '@/lib/session';
import type { DeleteChoice } from '@/lib/types';

export function PickOneDeleteApp() {
  const sessionId = useMemo(() => getSessionId(), []);
  const [choice, setChoice] = useState<DeleteChoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [userChoice, setUserChoice] = useState<'A' | 'B' | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      fetch('/api/delete-choice')
        .then(res => res.json())
        .then(data => { setChoice(data); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, []);

  const vote = useCallback(async (selected: 'A' | 'B') => {
    if (!choice || hasVoted || voting) return;
    setVoting(true);
    try {
      const response = await fetch('/api/delete-choice/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteChoiceId: choice.id, choice: selected, sessionId })
      });
      const data = await response.json();
      if (data.deleteChoice) {
        setChoice(data.deleteChoice);
        setUserChoice(selected);
        setHasVoted(true);
      }
    } catch {
      console.error('Failed to vote');
    }
    setVoting(false);
  }, [choice, hasVoted, voting, sessionId]);

  const getNewChoice = useCallback(async () => {
    setHasVoted(false);
    setUserChoice(null);
    setLoading(true);
    const response = await fetch('/api/delete-choice');
    const data = await response.json();
    setChoice(data);
    setLoading(false);
  }, []);

  if (loading || !choice) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  const totalVotes = choice.votesA + choice.votesB;
  const percentA = totalVotes > 0 ? Math.round((choice.votesA / totalVotes) * 100) : 50;
  const percentB = totalVotes > 0 ? Math.round((choice.votesB / totalVotes) * 100) : 50;

  return (
    <div className="py-4 sm:py-8 text-center">
      <Badge className="bg-red-500/20 text-red-400 border-red-500/30 mb-3 sm:mb-4 text-xs">{choice.category.toUpperCase()}</Badge>
      <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Pick One to Delete</h2>
      <p className="text-zinc-400 text-sm sm:text-base mb-1 px-4">{choice.description || 'Which would you erase from existence forever?'}</p>
      <p className="text-zinc-500 text-xs sm:text-sm mb-6 sm:mb-8">Your choice is permanent and affects everyone.</p>

      <div className="flex flex-col gap-3 sm:gap-4 justify-center mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
        <motion.button
          whileTap={{ scale: hasVoted ? 1 : 0.98 }}
          onClick={() => vote('A')}
          disabled={hasVoted || voting}
          className={`relative px-4 sm:px-6 py-5 sm:py-6 rounded-xl sm:rounded-2xl font-semibold transition-all min-h-[80px] sm:min-h-[88px] ${
            hasVoted
              ? userChoice === 'A'
                ? 'bg-red-600 text-white ring-2 ring-red-400'
                : 'bg-zinc-800/50 text-zinc-400'
              : 'bg-red-600 active:bg-red-700 text-white'
          }`}
        >
          <span className="text-[10px] sm:text-xs block text-red-200 mb-1 uppercase">Delete</span>
          <span className="text-base sm:text-lg">{choice.optionA}</span>
          {hasVoted && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-sm font-normal">
              {percentA}% agreed
            </motion.div>
          )}
        </motion.button>

        <motion.button
          whileTap={{ scale: hasVoted ? 1 : 0.98 }}
          onClick={() => vote('B')}
          disabled={hasVoted || voting}
          className={`relative px-4 sm:px-6 py-5 sm:py-6 rounded-xl sm:rounded-2xl font-semibold transition-all min-h-[80px] sm:min-h-[88px] ${
            hasVoted
              ? userChoice === 'B'
                ? 'bg-orange-600 text-white ring-2 ring-orange-400'
                : 'bg-zinc-800/50 text-zinc-400'
              : 'bg-orange-600 active:bg-orange-700 text-white'
          }`}
        >
          <span className="text-[10px] sm:text-xs block text-orange-200 mb-1 uppercase">Delete</span>
          <span className="text-base sm:text-lg">{choice.optionB}</span>
          {hasVoted && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-sm font-normal">
              {percentB}% agreed
            </motion.div>
          )}
        </motion.button>
      </div>

      {hasVoted && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 sm:space-y-4">
          <div className="max-w-md mx-auto px-4">
            <div className="h-4 bg-zinc-800 rounded-full overflow-hidden flex">
              <motion.div initial={{ width: 0 }} animate={{ width: `${percentA}%` }} transition={{ duration: 0.8 }} className="bg-red-500" />
              <motion.div initial={{ width: 0 }} animate={{ width: `${percentB}%` }} transition={{ duration: 0.8 }} className="bg-orange-500" />
            </div>
          </div>
          <p className="text-zinc-500 text-sm sm:text-base">{totalVotes.toLocaleString()} total votes</p>
          <Button variant="ghost" onClick={getNewChoice} className="text-zinc-400 min-h-[44px]">
            <RefreshCw className="w-4 h-4 mr-2" />Next choice
          </Button>
        </motion.div>
      )}
    </div>
  );
}
