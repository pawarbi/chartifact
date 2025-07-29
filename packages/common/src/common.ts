export interface RendererCommonOptions {
    /* dataSignalPrefix will set `isData` to true in the Signal Bus */
    dataSignalPrefix?: string;

    groupClassName?: string;
}

export const defaultCommonOptions: RendererCommonOptions = {
    dataSignalPrefix: 'data_signal:',
    groupClassName: 'group',
};
