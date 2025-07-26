export function urlParam(urlParamName: string, value: any) {
    if (value === undefined || value === null) return '';
    if (Array.isArray(value)) {
        return value.map(vn => `${urlParamName}[]=${encodeURIComponent(vn)}`).join('&');
    } else {
        return `${urlParamName}=${encodeURIComponent(value)}`;
    }
}

export function getJsonScriptTag(container: Element): HTMLScriptElement | null {
    const scriptTag = container.previousElementSibling;
    if (scriptTag?.tagName !== 'SCRIPT' || scriptTag.getAttribute('type') !== 'application/json') {
        return null;
    }
    if (!scriptTag.textContent) {
        return null;
    }
    return scriptTag as HTMLScriptElement;
}
