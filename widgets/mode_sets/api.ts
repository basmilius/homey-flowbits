import type { WidgetApiRequest } from '@basmilius/homey-common';
import type { FlowBitsApp, ModeSet } from '../../src/types';

export async function get({homey: {app}, query}: WidgetApiRequest<FlowBitsApp, never, never, Query>): Promise<ModeSet | null> {
    return await app.modeSets.find(query.set);
}

export async function toggle({homey: {app}, body}: WidgetApiRequest<FlowBitsApp, Body>): Promise<boolean> {
    const set = await app.modeSets.find(body.set);

    if (!set) {
        return false;
    }

    await app.modeSets.toggle(body.set, body.mode);

    return true;
}

type Body = {
    readonly set: string;
    readonly mode: string;
};

type Query = {
    readonly set: string;
};
