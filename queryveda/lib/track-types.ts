export type Track = 'sql' | 'excel' | 'python';

export const ACTIVE_TRACKS: Track[] = ['sql', 'excel'];

export const TRACK_LABELS: Record<Track, string> = {
  sql: 'SQL',
  excel: 'Excel',
  python: 'Python',
};

export const TRACK_DESCRIPTIONS: Record<Track, string> = {
  sql: 'Write queries against a real PostgreSQL database in your browser',
  excel: 'Master formulas and analytics in an interactive spreadsheet',
  python: 'Coming soon',
};
