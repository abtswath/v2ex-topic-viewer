export const getParent = (el: HTMLElement, selector: string): HTMLElement | null => {
    if (!el.parentElement) {
        return null;
    }
    if (el.parentElement.matches(selector)) {
        return el.parentElement;
    }
    return getParent(el.parentElement, selector);
};
export const createLoading = () => {
    return document.createElement('topic-viewer-loading');
}
export const isLoading = (el: Element | null) => {
    return el && el.tagName.toLowerCase() === 'topic-viewer-loading';
}
export const isTopicViewer = (el: Element | null) => {
    return el && el.tagName.toLowerCase() === 'topic-viewer';
}
export const fetchTopicContent = (uri: string) => {
    return fetch(uri)
        .then(response => {
            return response.text();
        })
        .then(async content => {
            const parser = new DOMParser();
            return parser.parseFromString(content, 'text/html').querySelector('#Main')?.cloneNode(true);
        });
}
