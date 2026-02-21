import type { WidgetApiRequest } from '@basmilius/homey-common';
import type { BitSet, FlowBitsApp } from '../../src/types';

export async function get({homey: {app}, query}: WidgetApiRequest<FlowBitsApp, never, never, Query>): Promise<BitSet | null> {
    return await app.sets.find(query.set);
}

export async function toggle({homey: {app}, body}: WidgetApiRequest<FlowBitsApp, Body>): Promise<boolean> {
    const set = await app.sets.find(body.set);

    if (!set) {
        return false;
    }

    await app.sets.toggleState(body.set, body.state);

    return true;
}

type Body = {
    readonly set: string;
    readonly state: string;
};

type Query = {
    readonly set: string;
};
