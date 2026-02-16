import type { ClockUnit } from '../types';

export default function (duration: number, unit: ClockUnit): number {
    switch (unit) {
        case 'milliseconds':
            return duration;

        case 'seconds':
            return duration * 1000;

        case 'minutes':
            return duration * 60_000;

        case 'hours':
            return duration * 3_600_000;

        case 'days':
            return duration * 86_400_000;
    }
}
