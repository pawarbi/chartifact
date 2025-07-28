export interface FlaggableSpec<T> {
    spec: T;
    hasFlags?: boolean;
    reason?: string;
}

export interface Flagged<T> {
    pluginName: string;
    containerId: string;
    flaggableSpec: FlaggableSpec<T>;
}
