import type { ClockUnit } from '../types';

export default function (duration: number, unit: ClockUnit): number {
    switch (unit) {
        case 'milliseconds':
            return duration / 1000;

        case 'seconds':
            return duration;

        case 'minutes':
            return duration * 60;

        case 'hours':
            return duration * 3600;

        case 'days':
            return duration * 86400;
    }
}
