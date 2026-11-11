export const toLetterGrade = (marks, maxMarks) => {
  if (!maxMarks) return 'N/A';
  const pct = (marks / maxMarks) * 100;
  if (pct >= 90) return 'A';
  if (pct >= 80) return 'B';
  if (pct >= 70) return 'C';
  if (pct >= 60) return 'D';
  return 'F';
};
