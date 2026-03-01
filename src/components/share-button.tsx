'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';

export function ShareButton({ title, url }: { title: string; url?: string }) {
  const [copied, setCopied] = useState(false);
  const handleShare = async () => {
    const shareUrl = url ?? window.location.href;
    if (navigator.share) { 
      try {
        await navigator.share({ title, url: shareUrl }); 
      } catch {
        // User cancelled share
      }
    } else { 
      await navigator.clipboard.writeText(shareUrl); 
      setCopied(true); 
      setTimeout(() => setCopied(false), 2000); 
    }
  };
  return (
    <button 
      onClick={handleShare} 
      className="flex items-center justify-center w-8 h-8 rounded-full transition-all active:scale-90"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid var(--curio-border-subtle)',
        color: copied ? 'var(--curio-text)' : 'var(--curio-text-muted)',
      }}
      aria-label="Share"
      title={copied ? 'Copied!' : 'Share'}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
    </button>
  );
}
