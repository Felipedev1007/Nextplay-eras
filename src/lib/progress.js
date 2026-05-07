// LocalStorage-based progress tracker
const KEY = 'evogames_progress_v1';

const defaultProgress = {
  pong: { completed: false, score: 0 },
  invaders: { completed: false, score: 0 },
  pacman: { completed: false, score: 0 },
  mario: { completed: false, score: 0 },
  fps: { completed: false, score: 0 },
};

export const getProgress = () => {
  if (typeof window === 'undefined') return defaultProgress;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultProgress;
    return { ...defaultProgress, ...JSON.parse(raw) };
  } catch {
    return defaultProgress;
  }
};

export const saveEraResult = (eraId, score) => {
  const p = getProgress();
  const prev = p[eraId] || { completed: false, score: 0 };
  p[eraId] = {
    completed: true,
    score: Math.max(prev.score, score),
  };
  localStorage.setItem(KEY, JSON.stringify(p));
  return p;
};

export const resetProgress = () => {
  localStorage.removeItem(KEY);
};

export const getTotalScore = () => {
  const p = getProgress();
  return Object.values(p).reduce((sum, e) => sum + (e.score || 0), 0);
};

export const getCompletedCount = () => {
  const p = getProgress();
  return Object.values(p).filter(e => e.completed).length;
};