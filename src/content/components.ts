const topicViewStylesheets = `.topic-viewer-container{overflow:auto;border-bottom:1px solid var(--box-border-color)}#Main{margin:0 auto;max-width:770px;width:100%;}`;
const topicViewerLoadingStyleSheets = `.topic-viewer-loading{height:40px;border-bottom:1px solid var(--box-border-color);line-height:40px;font-weight:bold}.topic-viewer-loading>span{margin:0 5px;opacity:0;animation-delay:0ms;animation-duration:2000ms;animation-timing-function:linear;animation-iteration-count:infinite}@keyframes fade-v{0%{opacity:0}15%{opacity:1}80%{opacity:1}85%{opacity:0}100%{opacity:0}}@keyframes fade-2{15%{opacity:0}30%{opacity:1}80%{opacity:1}85%{opacity:0}100%{opacity:0}}@keyframes fade-e{30%{opacity:0}45%{opacity:1}80%{opacity:1}85%{opacity:0}100%{opacity:0}}@keyframes fade-x{45%{opacity:0}60%{opacity:1}80%{opacity:1}85%{opacity:0}100%{opacity:0}}`;
const loadingText = ['V', '2', 'E', 'X'];

export class TopicViewer extends HTMLElement {

    private container: HTMLElement;

    constructor() {
        super();
        const style = document.createElement('style');
        style.textContent = topicViewStylesheets;
        const shadowRoot = this.attachShadow({ mode: 'open' });
        Array.from(document.querySelectorAll('link[type="text/css"]')).forEach(x => shadowRoot.appendChild(x.cloneNode(true)));
        document.querySelectorAll('style').forEach(x => shadowRoot.appendChild(x.cloneNode(true)));
        shadowRoot.appendChild(style);
        this.container = document.createElement('div');
        this.container.className = 'topic-viewer-container';
        shadowRoot.appendChild(this.container);
    }

    connectedCallback() {
        const topicHeight = this.getAttribute('topic-height');
        this.container.style.height = topicHeight ? `calc(100vh - ${topicHeight}px)` : '100vh';
    }
}

export class TopicViewerLoading extends HTMLElement {
    constructor() {
        super();
        const style = document.createElement('style');
        style.textContent = topicViewerLoadingStyleSheets;
        const loading = document.createElement('div');
        loading.className = 'topic-viewer-loading';
        loadingText.forEach(x => {
            const span = document.createElement('span');
            span.style.animationName = `fade-${x.toLowerCase()}`;
            span.innerText = x;
            loading.appendChild(span);
        });
        const shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.appendChild(style);
        shadowRoot.appendChild(loading);
    }
}
