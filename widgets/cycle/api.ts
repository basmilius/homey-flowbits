import type { WidgetApiRequest } from '@basmilius/homey-common';
import type { Cycle, FlowBitsApp } from '../../src/types';

export async function get({homey: {app}, query}: WidgetApiRequest<FlowBitsApp, never, never, Query>): Promise<Cycle | null> {
    return await app.cycles.find(query.cycle);
}

export async function set({homey: {app}, query, body}: WidgetApiRequest<FlowBitsApp, Body, never, Query>): Promise<boolean> {
    const cycle = await app.cycles.find(query.cycle);

    if (!cycle) {
        return false;
    }

    if (body.action === 'next') {
        await app.cycles.cycleTo(cycle.name, cycle.step + 1);
    } else if (body.action === 'previous') {
        await app.cycles.cycleTo(cycle.name, cycle.step - 1);
    }

    return true;
}

type Query = {
    readonly cycle: string;
};

type Body = {
    readonly action: 'next' | 'previous';
};
