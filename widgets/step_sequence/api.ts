import type { WidgetApiRequest } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../src/types';

export async function get({homey: {app}, query}: WidgetApiRequest<FlowBitsApp, never, never, Query>): Promise<Result | null> {
    const cycle = await app.cycles.find(query.cycle);

    if (!cycle) {
        return null;
    }

    return {
        name: cycle.name,
        step: cycle.step
    };
}

type Query = {
    readonly cycle: string;
};

type Result = {
    readonly name: string;
    readonly step: number | null;
};
