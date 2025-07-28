export interface Flagged<T> {
    pluginName: string;
    containerId: string;
    spec: T;
    hasFlags?: boolean;
    reason?: string;
}
