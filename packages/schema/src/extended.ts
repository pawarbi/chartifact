import { ElementBase } from './common.js';

export interface Preset {
    name: string;
    description?: string;
    state: { [signalName: string]: unknown };
}

export interface PresetsElement extends ElementBase {
    type: 'presets';
    presets: Preset[];
}

export type extendedElements = PresetsElement;
