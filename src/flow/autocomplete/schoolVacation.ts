import { autocomplete, FlowAutocompleteProvider } from '@basmilius/homey-common';
import type { FlowCard } from 'homey';

import schoolHolidays from '../../data/schoolHolidays';

const UNIQUE_VACATION_TYPES = [...new Set(
    schoolHolidays.flatMap(yearSet => yearSet.vacations.map(v => v.type))
)].sort((a, b) => a.localeCompare(b));

@autocomplete('schoolVacation')
export default class extends FlowAutocompleteProvider<any> {
    async find(query: string): Promise<FlowCard.ArgumentAutocompleteResults> {
        const hasQuery = query.trim().length > 0;

        return UNIQUE_VACATION_TYPES
            .filter(name => !hasQuery || name.toLowerCase().includes(query.toLowerCase()))
            .map(name => ({name}));
    }
}
