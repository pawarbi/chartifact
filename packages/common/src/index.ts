export interface RendererCommonOptions {
    dataNameSelectedSuffix?: string;
    dataSignalPrefix?: string;
    groupClassName?: string;
}

export const defaultCommonOptions: RendererCommonOptions = {
    dataNameSelectedSuffix: '_selected',
    dataSignalPrefix: 'data_signal:',
    groupClassName: 'group',
};
