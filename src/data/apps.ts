// App definitions for the Curio hub
// Each entry describes one of the 10 mini-apps

import {
  Sparkles,
  Globe,
  Calendar,
  CalendarDays,
  Feather,
  Frown,
  Eye,
  Clock,
  Target,
  TrendingUp,
  X,
  Music,
  Flame,
  BookOpen,
  Skull,
  type LucideIcon,
} from 'lucide-react';

export interface AppDefinition {
  id: string;
  name: string;
  tagline: string;
  icon: LucideIcon;
  color: string;
  description: string;
}

export const APPS: AppDefinition[] = [
  {
    id: 'one-decision',
    name: 'One Decision',
    tagline: 'Daily moral dilemma. See how the world votes.',
    icon: Target,
    color: 'from-violet-600 to-purple-600',
    description: 'One question. Two choices. Infinite debate.',
  },
  {
    id: 'this-career',
    name: 'This Career Does Not Exist',
    tagline: 'AI-generated jobs that sound real but aren\'t.',
    icon: Sparkles,
    color: 'from-cyan-500 to-blue-600',
    description: 'Refresh for a new fake career.',
  },
  {
    id: 'parallel-you',
    name: 'Parallel You',
    tagline: 'What if you were born somewhere else?',
    icon: Globe,
    color: 'from-emerald-500 to-teal-600',
    description: 'See your alternate life in another country.',
  },
  {
    id: 'life-stats',
    name: 'Your Life Stats',
    tagline: 'Your age in weird, wonderful units.',
    icon: TrendingUp,
    color: 'from-orange-500 to-amber-600',
    description: 'Perspective on your time alive.',
  },
  {
    id: 'anti-motivational',
    name: 'The Void',
    tagline: 'Posters from the abyss.',
    icon: Frown,
    color: 'from-violet-900 to-purple-950',
    description: 'Because toxic positivity is overrated.',
  },
  {
    id: 'what-youll-see',
    name: 'What You\'ll See',
    tagline: 'Future events you might witness.',
    icon: Eye,
    color: 'from-indigo-500 to-violet-600',
    description: 'Based on your life expectancy.',
  },
  {
    id: 'life-calendar',
    name: 'Life Calendar',
    tagline: 'Your life in weeks. One grid.',
    icon: Calendar,
    color: 'from-rose-500 to-pink-600',
    description: 'A powerful visualization of mortality.',
  },
  {
    id: 'pick-one-delete',
    name: 'Pick One to Delete',
    tagline: 'Erasure is power. Choose wisely.',
    icon: X,
    color: 'from-red-500 to-orange-600',
    description: 'What would you erase forever?',
  },
  {
    id: 'sound-of-your-birth',
    name: 'Sound of Your Birth',
    tagline: 'The world the day you arrived.',
    icon: Music,
    color: 'from-rose-500 to-orange-500',
    description: 'The #1 song, top film, and prices from your birth year.',
  },
  {
    id: 'your-saturday-count',
    name: '4,160 Saturdays',
    tagline: 'An 80-year life. Count the days that were yours.',
    icon: CalendarDays,
    color: 'from-amber-500 to-orange-500',
    description: 'How many Saturdays have you lived? How many remain?',
  },
  {
    id: 'while-here',
    name: 'While You Were Here',
    tagline: 'What happened while you browsed.',
    icon: Clock,
    color: 'from-sky-500 to-cyan-600',
    description: 'Real-time global statistics.',
  },
  {
    id: 'the-grand-dao',
    name: 'The Grand Dao',
    tagline: 'Ancient cultivation wisdom. Your secret name.',
    icon: Flame,
    color: 'from-amber-700 to-yellow-500',
    description: 'Discover your Dao Name and hear what the cosmos says about your path.',
  },
  {
    id: 'your-last-words',
    name: 'Your Last Words',
    tagline: 'Practice what you\'d leave behind.',
    icon: Feather,
    color: 'from-amber-800 to-orange-900',
    description: 'Write your last words. A mirror and the unsaid will be returned to you.',
  },
  {
    id: 'hikmah',
    name: 'Hikmah',
    tagline: 'Wisdom from every corner of the earth.',
    icon: BookOpen,
    color: 'from-emerald-800 to-teal-900',
    description: 'One saying per day. Deep context. Reflections from around the world.',
  },
  {
    id: 'dead-app',
    name: 'Dead App',
    tagline: 'The app that doesn\'t want to be opened.',
    icon: Skull,
    color: 'from-zinc-700 to-zinc-900',
    description: 'Stay for five minutes. If you can.',
  },
];
