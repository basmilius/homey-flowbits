import { condition, DateTime, FlowConditionEntity } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../types';
import schoolHolidays from '../../data/schoolHolidays';
import { AutocompleteProviders } from '..';

@condition('school_holiday_is')
export default class extends FlowConditionEntity<FlowBitsApp, Args, never> {
    async onInit(): Promise<void> {
        this.registerAutocomplete('holiday', AutocompleteProviders.SchoolVacation);

        await super.onInit();
    }

    async onRun(args: Args): Promise<boolean> {
        const date = DateTime.now();

        // A school year starts on August 1.
        const startYear = date.month >= 8 ? date.year : date.year - 1;
        const endYear = startYear + 1;

        const yearSet = schoolHolidays.find(s => s.schoolyear === `${startYear}-${endYear}`);

        if (!yearSet) {
            return false;
        }

        const vacations = yearSet.vacations.filter(v => v.type === args.holiday.name);

        if (vacations.length === 0) {
            return false;
        }

        const vacation = vacations.find(v => v.region === null || v.region === args.region);

        if (!vacation) {
            return false;
        }

        const start = DateTime.fromISO(vacation.start);
        const end = DateTime.fromISO(vacation.end);

        return start <= date && end >= date;
    }
}

type Args = {
    readonly holiday: {
        readonly name: string;
    };
    readonly region: 'north' | 'middle' | 'south';
};
