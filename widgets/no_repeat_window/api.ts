import type { WidgetApiRequest } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../src/types';

export async function state({homey: {app}, query}: WidgetApiRequest<FlowBitsApp, never, never, Query>): Promise<Result | null> {
    const window = await app.noRepeat.find(query.window);
    
    if (!window) {
        return {
            name: query.window,
            lastUpdate: undefined,
            isOpen: false
        };
    }
    
    return {
        name: window.name,
        lastUpdate: window.lastUpdate,
        isOpen: !!window.lastUpdate
    };
}

type Result = {
    readonly name: string;
    readonly lastUpdate: string | undefined;
    readonly isOpen: boolean;
};

type Query = {
    readonly window: string;
};
