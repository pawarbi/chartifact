export interface RendererCommonOptions {
    dataNameSelectedSuffix?: string;

    /* dataSignalPrefix will set `isData` to true in the Signal Bus */
    dataSignalPrefix?: string;

    groupClassName?: string;
}

export const defaultCommonOptions: RendererCommonOptions = {
    dataNameSelectedSuffix: '_selected',
    dataSignalPrefix: 'data_signal:',
    groupClassName: 'group',
};
