import type { WidgetApiRequest } from '@basmilius/homey-common';
import type { BitSet, FlowBitsApp } from '../../src/types';

export async function get({homey: {app}, query}: WidgetApiRequest<FlowBitsApp, never, never, Query>): Promise<BitSet | null> {
    return await app.sets.find(query.set);
}

type Query = {
    readonly set: string;
};
