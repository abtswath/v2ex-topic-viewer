import "@webcomponents/webcomponentsjs";
import { TopicViewerLoading, TopicViewer } from './components';

export const getParent = (el: HTMLElement, selector: string): HTMLElement | null => {
    if (!el.parentElement) {
        return null;
    }
    if (el.parentElement.matches(selector)) {
        return el.parentElement;
    }
    return getParent(el.parentElement, selector);
};

interface TopicViewerHandler {
    open(topicLink: HTMLAnchorElement): void
    close(): void
}

abstract class AbstractTopicViewerHandler implements TopicViewerHandler {

    protected loadingElement: HTMLElement | null = null;

    protected topicItem: HTMLElement | null = null;

    public async open(topicLink: HTMLAnchorElement) {
        this.topicItem = getParent(topicLink, 'div.cell.item');
        const loading = this.loading();
        try {
            const content = await this.fetchTopic(topicLink.href);
            loading.remove();
            content && this.put(content);
        } catch (error) {
            loading.remove();
        }
    }

    protected async fetchTopic(uri: string) {
        const response = await fetch(uri);
        const content = await response.text();
        const parser = new DOMParser();
        return parser.parseFromString(content, 'text/html').querySelector('#Main')?.cloneNode(true);
    }

    public abstract close(): void;

    protected abstract loading(): HTMLElement;

    protected abstract put(content: Node): void;

    protected createLoading(): HTMLElement {
        return document.createElement('topic-viewer-loading');
    }

    protected createTopicViewer(content: Node) {
        const topicViewer = document.createElement('topic-viewer');
        topicViewer.shadowRoot?.querySelector('div.topic-viewer-container')?.appendChild(content);
        return topicViewer;
    }
}

class RightContainerHandler extends AbstractTopicViewerHandler implements TopicViewerHandler {

    private container: HTMLElement | null = null;

    private styleElement: HTMLElement | null = null;

    private stylesheets = `body{width:50%}.right-topic-viewer{position:fixed;right:0;top:0;width:50%;height:100vh;z-index:9999;box-shadow:0 2px 3px rgb(0 0 0 / 10%);border-bottom:1px solid var(--box-border-color);background-color:var(--box-background-color)}`;

    private createStyleSheets() {
        this.styleElement = document.createElement('style');
        this.styleElement.textContent = this.stylesheets;
        document.head.appendChild(this.styleElement!);
    }

    protected createContainer() {
        this.createStyleSheets();
        const container = document.createElement('div');
        container.className = 'right-topic-viewer';
        document.body.appendChild(container);
        return container;
    }

    protected loading(): HTMLElement {
        if (!this.container) {
            this.container = this.createContainer();
        } else {
            this.container.childNodes.forEach(x => x.remove());
        }
        const loading = this.createLoading();
        if ((loading.shadowRoot?.querySelector('.topic-viewer-loading') as HTMLElement)) {
            (loading.shadowRoot?.querySelector('.topic-viewer-loading') as HTMLElement).style.border = 'none';
            (loading.shadowRoot?.querySelector('.topic-viewer-loading') as HTMLElement).style.position = 'absolute';
            (loading.shadowRoot?.querySelector('.topic-viewer-loading') as HTMLElement).style.top = '50%';
            (loading.shadowRoot?.querySelector('.topic-viewer-loading') as HTMLElement).style.left = '50%';
            (loading.shadowRoot?.querySelector('.topic-viewer-loading') as HTMLElement).style.transform = 'translateX(-50%) translateY(-50)';
        }
        this.container.appendChild(loading);
        return loading;
    }

    protected put(content: Node): void {
        this.container?.appendChild(this.createTopicViewer(content));
    }

    public close(): void {
        this.container?.remove();
        this.styleElement?.remove();
        this.container = null;
        this.styleElement = null;
    }

}

class UnderTopicHandler extends AbstractTopicViewerHandler implements TopicViewerHandler {

    private topicViewer: HTMLElement | null = null;

    protected loading(): HTMLElement {
        this.close();
        this.topicItem?.scrollIntoView();
        document.querySelector('topic-viewer')?.remove();
        const loading = this.createLoading();
        this.insertAfterTopicItem(loading);
        return loading;
    }

    private insertAfterTopicItem(el: HTMLElement) {
        this.topicItem?.parentElement?.insertBefore(el, this.topicItem.nextElementSibling);
    }

    protected put(content: Node): void {
        this.topicViewer = this.createTopicViewer(content);
        this.topicViewer.setAttribute('topic-height', this.topicItem?.offsetHeight.toString() || '0');
        this.insertAfterTopicItem(this.topicViewer);
    }

    public close(): void {
        this.topicViewer?.remove();
    }

}

const underTopicHandler = new UnderTopicHandler();
const rightContainerHandler = new RightContainerHandler();

const isLoading = () => {
    return document.querySelector('topic-viewer-loading') !== null;
}

let lastClickedTopic = '';

const isSameAsLastClicked = (href: string) => {
    const url = new URL(href);
    const result = url.pathname === lastClickedTopic;
    lastClickedTopic = url.pathname;
    return result;
}

const shouldCloseViewer = (href: string) => {
    return document.querySelector('topic-viewer') !== null && isSameAsLastClicked(href);
}

if (document.querySelectorAll('a.topic-link').length > 0) {
    customElements.define('topic-viewer-loading', TopicViewerLoading);
    customElements.define('topic-viewer', TopicViewer);
    document.querySelector('#Main>.box')?.addEventListener('click', (evt: Event) => {
        const el = evt.target! as HTMLElement;
        if (el.tagName.toLowerCase() == 'a' && el.className.indexOf('topic-link') >= 0) {
            const topicItem = getParent(el, 'div.cell.item');
            if (topicItem === null) {
                return;
            }
            evt.preventDefault();
            if (isLoading()) {
                return;
            }
            const anchor = el as HTMLAnchorElement;
            if (shouldCloseViewer(anchor.href)) {
                rightContainerHandler.close();
                underTopicHandler.close();
                return;
            }
            chrome.storage.local.get('settings')
                .then((data) => {
                    switch (data?.settings?.containerPosition) {
                        case 'right':
                            rightContainerHandler.open(anchor);
                            break;
                        default:
                            underTopicHandler.open(anchor);
                            break;
                    }
                })
                .catch((err) => {
                    console.error(err);
                    underTopicHandler.open(anchor);
                });
        }
    });
}

