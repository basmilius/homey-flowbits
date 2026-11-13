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
        const zone = 'Europe/Amsterdam';
        const now = DateTime.now().setZone(zone);

        // A vacation can start in one school year and run into the next, so every year is searched.
        // The dataset stores UTC instants, but a vacation covers whole local calendar days.
        return schoolHolidays
            .flatMap(yearSet => yearSet.vacations)
            .filter(vacation => vacation.type === args.holiday.name && (vacation.region === null || vacation.region === args.region))
            .some(vacation => {
                const start = DateTime.fromISO(vacation.start, {zone}).startOf('day');
                const end = DateTime.fromISO(vacation.end, {zone}).endOf('day');

                return start <= now && end >= now;
            });
    }
}

type Args = {
    readonly holiday: {
        readonly name: string;
    };
    readonly region: 'north' | 'middle' | 'south';
};
