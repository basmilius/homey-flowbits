import type { ApiRequest, Color, Icon } from '@basmilius/homey-common';
import { colors, icons } from '@basmilius/homey-common';
import type { BitSet, Cycle, Event, Flag, FlowBitsApp, Label, Mode, NoRepeatWindow, Slider, Statistics, Timer } from './src/types';

export async function activateFlag({homey: {app}, body}: ApiRequest<FlowBitsApp, BodyFlag>): Promise<boolean> {
    return await app.api.activateFlag(body.flag);
}

export async function activateMode({homey: {app}, body}: ApiRequest<FlowBitsApp, BodyMode>): Promise<boolean> {
    return await app.api.activateMode(body.mode);
}

export async function deactivateFlag({homey: {app}, body}: ApiRequest<FlowBitsApp, BodyFlag>): Promise<boolean> {
    return await app.api.deactivateFlag(body.flag);
}

export async function deactivateMode({homey: {app}, body}: ApiRequest<FlowBitsApp, BodyMode>): Promise<boolean> {
    return await app.api.deactivateMode(body.mode);
}

export async function toggleFlag({homey: {app}, body}: ApiRequest<FlowBitsApp, BodyFlag>): Promise<boolean> {
    return await app.api.toggleFlag(body.flag);
}

export async function toggleMode({homey: {app}, body}: ApiRequest<FlowBitsApp, BodyMode>): Promise<boolean> {
    return await app.api.toggleMode(body.mode);
}

export async function getCycles({homey: {app}}: ApiRequest<FlowBitsApp>): Promise<Cycle[]> {
    return await app.api.getCycles();
}

export async function getEvents({homey: {app}}: ApiRequest<FlowBitsApp>): Promise<Event[]> {
    return await app.api.getEvents();
}

export async function getFlags({homey: {app}}: ApiRequest<FlowBitsApp>): Promise<Flag[]> {
    return await app.api.getFlags();
}

export async function getLabels({homey: {app}}: ApiRequest<FlowBitsApp>): Promise<Label[]> {
    return await app.api.getLabels();
}

export async function getModes({homey: {app}}: ApiRequest<FlowBitsApp>): Promise<Mode[]> {
    return await app.api.getModes();
}

export async function getNoRepeatWindows({homey: {app}}: ApiRequest<FlowBitsApp>): Promise<NoRepeatWindow[]> {
    return await app.noRepeat.findAll();
}

export async function getSets({homey: {app}}: ApiRequest<FlowBitsApp>): Promise<BitSet[]> {
    return await app.api.getSets();
}

export async function getSliders({homey: {app}}: ApiRequest<FlowBitsApp>): Promise<Slider[]> {
    return await app.sliders.findAll();
}

export async function getTimers({homey: {app}}: ApiRequest<FlowBitsApp>): Promise<Timer[]> {
    return await app.api.getTimers();
}

export async function getColors(): Promise<Color[]> {
    return colors;
}

export async function getIcons(): Promise<Icon[]> {
    return icons;
}

export async function setEventLook({homey: {app}, body}: ApiRequest<FlowBitsApp, BodyLook>): Promise<boolean> {
    return await app.api.setEventLook(body.name, body.color, body.icon);
}

export async function setFlagLook({homey: {app}, body}: ApiRequest<FlowBitsApp, BodyLook>): Promise<boolean> {
    return await app.api.setFlagLook(body.name, body.color, body.icon);
}

export async function setLabelLook({homey: {app}, body}: ApiRequest<FlowBitsApp, BodyLook>): Promise<boolean> {
    return await app.api.setLabelLook(body.name, body.color, body.icon);
}

export async function setModeLook({homey: {app}, body}: ApiRequest<FlowBitsApp, BodyLook>): Promise<boolean> {
    return await app.api.setModeLook(body.name, body.color, body.icon);
}

export async function setSetLook({homey: {app}, body}: ApiRequest<FlowBitsApp, BodyLook>): Promise<boolean> {
    return await app.api.setSetLook(body.name, body.color, body.icon);
}

export async function setTimerLook({homey: {app}, body}: ApiRequest<FlowBitsApp, BodyLook>): Promise<boolean> {
    return await app.api.setTimerLook(body.name, body.color, body.icon);
}

export async function getStatistics({homey: {app}}: ApiRequest<FlowBitsApp>): Promise<Statistics> {
    return await app.api.getStatistics();
}

type BodyFlag = {
    readonly flag: string;
};

type BodyMode = {
    readonly mode: string;
};

type BodyLook = {
    readonly name: string;
    readonly color: string;
    readonly icon: string;
};
