import type { WidgetApiRequest } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../src/types';

export async function get({homey: {app}, query}: WidgetApiRequest<FlowBitsApp, never, never, Query>): Promise<Result | null> {
    const set = await app.modeSets.find(query.set);
    const mode = set?.modes.find(mode => mode.active);

    if (!mode) {
        return null;
    }

    return {
        color: mode.color,
        icon: mode.icon,
        name: mode.name
    };
}

type Query = {
    readonly set: string;
};

type Result = {
    readonly color: string | undefined;
    readonly icon: string | undefined;
    readonly name: string;
};
