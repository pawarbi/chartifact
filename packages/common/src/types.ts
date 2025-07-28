export interface Flagged<T> {
    pluginName: string;
    containerId: string;
    approvedSpec: T;
    unApprovedSpec?: T;
    reason?: string;
}
