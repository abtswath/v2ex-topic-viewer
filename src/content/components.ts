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

export class TopicViewer extends HTMLElement {

    private styleSheets = `.topic-viewer-loading{height:40px;line-height:40px;font-weight:bold;position:absolute;top:50%;left:50%;transform:translateX(-50%) translateY(-50%);z-index:99;}.topic-viewer-loading>span{margin:0 5px;opacity:0;animation-delay:0ms;animation-duration:2000ms;animation-timing-function:linear;animation-iteration-count:infinite}@keyframes fade-v{0%{opacity:0}15%{opacity:1}80%{opacity:1}85%{opacity:0}100%{opacity:0}}@keyframes fade-2{15%{opacity:0}30%{opacity:1}80%{opacity:1}85%{opacity:0}100%{opacity:0}}@keyframes fade-e{30%{opacity:0}45%{opacity:1}80%{opacity:1}85%{opacity:0}100%{opacity:0}}@keyframes fade-x{45%{opacity:0}60%{opacity:1}80%{opacity:1}85%{opacity:0}100%{opacity:0}}.topic-viewer-container{height: 100%;width: 100%;overflow:auto;border-bottom:1px solid var(--box-border-color);position: relative;}#Main{margin:0 auto;max-width:770px;width:100%;}.topic-viewer-hide{display:none;}`;

    private loadingText = ['V', '2', 'E', 'X'];

    private container: HTMLElement;

    private loadingElement: HTMLElement;

    private currentPage = 1;

    private contentURL: URL | null = null;

    private loading = false;

    constructor() {
        super();
        const shadowRoot = this.attachShadow({ mode: 'open' });
        this.appendStyleSheets();
        this.container = document.createElement('div');
        this.container.className = 'topic-viewer-container';
        shadowRoot.appendChild(this.container);
        this.loadingElement = this.createLoading();
    }

    connectedCallback() {
        const propHeight = this.getAttribute('data-height');
        if (propHeight !== null) {
            this.container.style.height = propHeight;
        }
        const uri = this.getAttribute('data-uri');
        if (uri !== null) {
            this.contentURL = new URL(uri);
            this.fetchTopic();
        }
    }

    protected removeContent() {
        this.$('#Main')?.remove();
    }

    protected putContent(content: Node) {
        this.container.appendChild(content);
        this.hookPaginationEvent();
        this.hookReply();
        this.hookButton();
    }

    protected hookButton() {
        this.$('#reply-box a[href=#]')?.addEventListener('click', this.goTop);
        this.$('#topic_buttons a:nth-of-type(1)')?.addEventListener('click', this.favoriteAndUnfavoriteTopic);
        this.hookIgnoreTopicButton();
    }

    private hookIgnoreTopicButton() {
        const ignoreButton = this.$('#topic_buttons a:nth-of-type(3)');
        if (ignoreButton !== null) {
            const newIgnoreButton = this.cloneAndDisableInlineEvent({ el: ignoreButton });
            ignoreButton.replaceWith(newIgnoreButton);
            newIgnoreButton.addEventListener('click', () => {
                const str = (newIgnoreButton as HTMLAnchorElement).getAttribute('disabled_onclick');
                if (str === null) {
                    return;
                }
                const matches = str.match(/location.href = '(.*)';/);
                if (matches !== null) {
                    if (window.confirm('确定不想再看到这个主题？')) {
                        fetch(matches[1])
                            .then(() => {
                                this.fetchTopic();
                            })
                            .catch((err) => {
                                console.error(err);
                            });
                    }
                }
            });
        }
    }

    private favoriteAndUnfavoriteTopic(e: Event) {
        e.preventDefault();
        const uri = (e.target as HTMLAnchorElement).href;
        fetch(uri)
            .then(() => {
                this.fetchTopic();
            })
            .catch((err) => {
                console.error(err);
            });
    }

    private goTop(e: Event) {
        e.preventDefault();
        this.$('#Main')?.scrollIntoView();
    }

    private $(selector: string) {
        return this.container.querySelector(selector);
    }

    private $all(selector: string) {
        return this.container.querySelectorAll(selector);
    }

    protected hookPaginationEvent() {
        [
            ...Array.from(this.$all('a.page_current')),
            ...Array.from(this.$all('a.page_normal'))
        ].forEach(el => {
            el.addEventListener('click', (e) => this.pageAnchorHandler(e, (el as HTMLAnchorElement).href));
        });
        [
            ...Array.from(this.shadowRoot!.querySelectorAll('td[title=上一页]')),
            ...Array.from(this.shadowRoot!.querySelectorAll('td[title=下一页]'))
        ].forEach(el => {
            (el as HTMLElement).replaceWith(this.cloneAndDisableInlineEvent({ el }));
        });
        this.shadowRoot!.querySelectorAll('td[disabled_onclick]').forEach(el => {
            const onClickAttrValue = el.getAttribute('disabled_onclick');
            el.addEventListener('click', (e) => this.pageButtonHandler(e, onClickAttrValue));
        })
        this.$all('input.page_input').forEach(el => {
            (el as HTMLElement).replaceWith(this.cloneAndDisableInlineEvent({ el, event: 'onkeydown', deep: true }));
        });
        this.$all('input[disabled_onkeydown]').forEach(el => {
            el.addEventListener('keydown', (e) => this.pageInputHandler(e as KeyboardEvent, (el as HTMLInputElement)));
        });
    }

    private cloneAndDisableInlineEvent({ el, tag = 'div', event = 'click', deep = true }: {
        el: Element,
        event?: string,
        tag?: string,
        deep?: boolean
    }) {
        const newNode = el.cloneNode(deep) as HTMLElement;
        const newHTML = newNode.outerHTML.replace(event, `disabled_${event}`);
        const container = document.createElement(tag);
        container.innerHTML = newHTML;
        return container.firstChild!.cloneNode(true);
    }

    protected hookReply() {
        this.$('input[value=回复]')?.parentElement?.parentElement?.addEventListener('submit', (evt: SubmitEvent) => {
            evt.preventDefault();
            const form = (evt.target as HTMLFormElement);
            const action = form.getAttribute('action');
            const method = form.getAttribute('method');
            const value = (form.querySelector('#reply_content') as HTMLTextAreaElement).value;
            const once = (form.querySelector('#once') as HTMLInputElement)?.value;
            if (action === null || value === null || value.trim() === '') {
                return;
            }
            const formData = new FormData();
            formData.append('content', value);
            formData.append('once', once);
            fetch(action, {
                method: method || 'post',
                body: formData
            })
                .then(() => {
                    this.fetchTopic();
                })
                .catch(() => { });
        });
    }

    private pageInputHandler(e: KeyboardEvent, el: HTMLInputElement) {
        if (e.code && e.code === 'Enter') {
            if (el.value.trim() !== '') {
                const value = Number(el.value);
                if (!isNaN(value)) {
                    this.turnThePage(value);
                }
            }
        }
    }

    private pageButtonHandler(e: Event, str: string | null) {
        if (str !== null) {
            const matches = str.match(/p=([\d]+)/);
            if (matches !== null) {
                const page = Number(matches[1]);
                if (!isNaN(page)) {
                    this.turnThePage(page);
                }
            }
        }
    }

    private pageAnchorHandler(e: Event, href: string) {
        e.preventDefault();
        const url = new URL(href);
        const p = url.searchParams.get('p');
        if (p !== null) {
            const page = Number(p);
            if (!isNaN(page)) {
                this.turnThePage(page);
            }
        }
    }

    private turnThePage(page: number) {
        this.currentPage = page;
        this.fetchTopic();
    }

    private getContentURL() {
        this.contentURL?.searchParams.set('p', `${this.currentPage}`);
        return this.contentURL?.toString() || '';
    }

    protected async fetchTopic() {
        this.removeContent();
        this.showLoading();
        const content = await this.fetch();
        this.hideLoading();
        content && this.putContent(content);
    }

    private async fetch() {
        const response = await fetch(this.getContentURL());
        const content = await response.text();
        const parser = new DOMParser();
        return parser.parseFromString(content, 'text/html').querySelector('#Main')?.cloneNode(true);
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
        return this.$('.topic-viewer-loading') !== null;
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
        this.loadingText.forEach(x => {
            const span = document.createElement('span');
            span.style.animationName = `fade-${x.toLowerCase()}`;
            span.innerText = x;
            loading.appendChild(span);
        });
        return loading;
    }
}
