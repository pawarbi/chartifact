export function urlParam(urlParamName: string, value: any) {
    if (value === undefined || value === null) return '';
    if (Array.isArray(value)) {
        return value.map(vn => `${urlParamName}[]=${encodeURIComponent(vn)}`).join('&');
    } else {
        return `${urlParamName}=${encodeURIComponent(value)}`;
    }
}

export function getJsonScriptTag(container: Element, errorHandler: (error: Error) => void) {
    const scriptTag = container.previousElementSibling;
    if (scriptTag?.tagName !== 'SCRIPT' || scriptTag.getAttribute('type') !== 'application/json') {
        errorHandler(new Error('Invalid JSON script tag'));
        return null;
    }
    if (!scriptTag.textContent) {
        errorHandler(new Error('Empty JSON script tag'));
        return null;
    }
    try {
        return JSON.parse(scriptTag.textContent);
    } catch (error) {
        errorHandler(error);
        return null;
    }
}

export function pluginClassName(pluginName: string) {
    return `chartifact-plugin-${pluginName}`;
}

export const newId = () => ([...Date.now().toString(36) + Math.random().toString(36).slice(2)]).sort(() => 0.5 - Math.random()).join('');
