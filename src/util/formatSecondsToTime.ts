/**
 * Formats seconds into a human-readable time string in HH:MM:SS format.
 * All components (hours, minutes, seconds) are zero-padded to 2 digits.
 * Examples: 
 * - 5445 seconds becomes "01:30:45"
 * - 90 seconds becomes "00:01:30"
 * - 0 or negative seconds returns "-"
 * 
 * @param seconds - The number of seconds to format
 * @returns Formatted time string as HH:MM:SS, or "-" if seconds is 0 or negative
 */
export default function (seconds: number): string {
    if (seconds <= 0) {
        return '-';
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const hoursStr = hours.toString().padStart(2, '0');
    const minutesStr = minutes.toString().padStart(2, '0');
    const secsStr = secs.toString().padStart(2, '0');

    return `${hoursStr}:${minutesStr}:${secsStr}`;
}
