// Session ID generator for anonymous voting

export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sessionId = sessionStorage.getItem('curio_session_id');
  if (!sessionId) {
    sessionId = 'session_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem('curio_session_id', sessionId);
  }
  return sessionId;
}
