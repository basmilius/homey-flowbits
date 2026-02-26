import { autocomplete, FlowAutocompleteProvider } from '@basmilius/homey-common';
import type { FlowCard } from 'homey';

import schoolHolidays from '../../data/schoolHolidays';

@autocomplete('schoolVacation')
export default class extends FlowAutocompleteProvider<any> {
    async find(query: string): Promise<FlowCard.ArgumentAutocompleteResults> {
        const hasQuery = query.trim().length > 0;

        const uniqueTypes = [...new Set(
            schoolHolidays.flatMap(yearSet => yearSet.vacations.map(v => v.type))
        )];

        return uniqueTypes
            .filter(name => !hasQuery || name.toLowerCase().includes(query.toLowerCase()))
            .map(name => ({name}))
            .sort((a, b) => a.name.localeCompare(b.name));
    }
}
