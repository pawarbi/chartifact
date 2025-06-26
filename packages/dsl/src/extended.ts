//BEGIN LLM IGNORE
import { ElementBase } from './common';
//END LLM IGNORE

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
