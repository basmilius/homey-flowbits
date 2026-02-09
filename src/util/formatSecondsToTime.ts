export default function (seconds: number): string {
    if (seconds <= 0) {
        return '-';
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const minutesStr = minutes.toString().padStart(2, '0');
    const secsStr = secs.toString().padStart(2, '0');

    if (hours > 0) {
        const hoursStr = hours.toString().padStart(2, '0');
        return `${hoursStr}:${minutesStr}:${secsStr}`;
    }

    return `${minutesStr}:${secsStr}`;
}
