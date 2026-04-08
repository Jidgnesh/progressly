/** Hash a password using SHA-256 */
export const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/** Auto-complete email with @gmail.com if no @ present */
export const completeEmail = (email: string): string => {
  const trimmed = email.trim();
  if (trimmed && !trimmed.includes('@')) {
    return trimmed + '@gmail.com';
  }
  return trimmed;
};

/** Get time-based greeting */
export const getGreeting = (name?: string): string => {
  const hour = new Date().getHours();
  let timeGreeting: string;
  if (hour < 12) timeGreeting = 'Good morning';
  else if (hour < 18) timeGreeting = 'Good afternoon';
  else timeGreeting = 'Good evening';
  return name ? `${timeGreeting}, ${name}` : timeGreeting;
};

/** Get formatted current date string */
export const getFormattedDate = (): string => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};
