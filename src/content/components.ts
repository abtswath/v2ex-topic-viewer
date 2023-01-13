const addClass = (el: HTMLElement, classes: string[] | string) => {
    if (!Array.isArray(classes)) {
        classes = [classes];
    }
    const classNameList = [...el.className.split(' '), ...classes];
    el.className = classNameList.filter(x => x.trim() !== '').join(' ');
}

const removeClass = (el: HTMLElement, classes: string[] | string) => {
    if (!Array.isArray(classes)) {
        classes = [classes];
    }
    el.className = el.className.split(' ').filter(x => classes.indexOf(x) < 0).join(' ');
}

export const FRAME_NAME = 'topic-viewer-iframe';

export class TopicViewer extends HTMLElement {

    private styleSheets = `.topic-viewer-loading{background-color:#fff;width:100%;height:100%;font-weight:bold;position:absolute;top:0;left:0;z-index:99;}.topic-viewer-loading-box{line-height:40px;height:40px;position:absolute;left:50%;top:50%;transform:translateX(-50%) translateY(-50%)}.topic-viewer-loading>.topic-viewer-loading-box>span{margin:0 5px;opacity:0;animation-delay:0ms;animation-duration:2000ms;animation-timing-function:linear;animation-iteration-count:infinite}@keyframes fade-v{0%{opacity:0}15%{opacity:1}80%{opacity:1}85%{opacity:0}100%{opacity:0}}@keyframes fade-2{15%{opacity:0}30%{opacity:1}80%{opacity:1}85%{opacity:0}100%{opacity:0}}@keyframes fade-e{30%{opacity:0}45%{opacity:1}80%{opacity:1}85%{opacity:0}100%{opacity:0}}@keyframes fade-x{45%{opacity:0}60%{opacity:1}80%{opacity:1}85%{opacity:0}100%{opacity:0}}.topic-viewer-container{height:100%;width:100%;overflow:auto;border-bottom:1px solid var(--box-border-color);position:relative;}.topic-viewer-container iframe{width:100%;height:100%;border:none;display:block;}.topic-viewer-hide{display:none}`;

    private loadingText = ['V', '2', 'E', 'X'];

    private container: HTMLElement;

    private loadingElement: HTMLElement;

    private loading = false;

    constructor() {
        super();
        const shadowRoot = this.attachShadow({ mode: 'open' });
        this.appendStyleSheets();
        this.container = document.createElement('div');
        this.container.className = 'topic-viewer-container';
        shadowRoot.appendChild(this.container);
        this.loadingElement = this.createLoading();
        this.showLoading();
    }

    connectedCallback() {
        const propHeight = this.getAttribute('data-height');
        if (propHeight !== null) {
            this.container.style.height = propHeight;
        }
        const iframe = this.createIframe();
        iframe.src = this.getAttribute('data-uri') || '';
        this.container.appendChild(iframe);
    }

    protected createIframe() {
        const iframe = document.createElement('iframe');
        iframe.name = FRAME_NAME;
        
        iframe.onload = () => {
            iframe.contentDocument?.head.appendChild(this.iframeStyleSheets());
            this.hideLoading();
            iframe.contentWindow && (iframe.contentWindow.onbeforeunload = () => {
                this.showLoading();
            });
        }
        return iframe;
    }

    protected iframeStyleSheets() {
        const style = document.createElement('style');
        style.textContent = `body{width:100%;min-width:100%}#Top{display:none}#Bottom{display:none}#Rightbar{display:none}#Wrapper>.content{min-width:100%}#Main{margin:0 auto;width:100%;max-width:770px;padding:0 10px;box-sizing:border-box;}`;
        return style;
    }

    protected showLoading() {
        this.loading = true;
        if (!this.loadingExists()) {
            this.container.appendChild(this.loadingElement);
        }
        removeClass(this.loadingElement, 'topic-viewer-hide');
    }

    protected hideLoading() {
        this.loading = false;
        addClass(this.loadingElement, 'topic-viewer-hide');
    }

    private loadingExists() {
        return this.container.querySelector('.topic-viewer-loading') !== null;
    }

    private appendStyleSheets() {
        Array.from(document.querySelectorAll('link[type="text/css"]')).forEach(x => this.shadowRoot?.appendChild(x.cloneNode(true)));
        document.querySelectorAll('style').forEach(x => this.shadowRoot?.appendChild(x.cloneNode(true)));
        const style = document.createElement('style');
        style.textContent = this.styleSheets;
        this.shadowRoot?.appendChild(style);
    }

    private createLoading() {
        const loading = document.createElement('div');
        loading.className = 'topic-viewer-loading';
        const box = document.createElement('div');
        box.className = 'topic-viewer-loading-box';
        this.loadingText.forEach(x => {
            const span = document.createElement('span');
            span.style.animationName = `fade-${x.toLowerCase()}`;
            span.innerText = x;
            box.appendChild(span);
        });
        loading.appendChild(box);
        return loading;
    }
}
