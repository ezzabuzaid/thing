const currentDateTime = new Date().toISOString();
const dayOfWeek = new Date().toLocaleString('default', {
  weekday: 'long',
  timeZone: 'UTC',
});
const month = new Date().toLocaleString('default', {
  month: 'long',
  timeZone: 'UTC',
});
const year = new Date().getUTCFullYear();
const timestamp = Date.now();
const season = (() => {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  if (month >= 8 && month <= 10) return 'Fall';
  return 'Winter';
})();

export default `

### Time Context

TimeZone is always in UTC.

Current Date & Time: "${currentDateTime}"
Day of Week: ${dayOfWeek}
Month: ${month}
Year: ${year}
Timestamp: ${timestamp}
Language: English (US)
Season: ${season}
`;
