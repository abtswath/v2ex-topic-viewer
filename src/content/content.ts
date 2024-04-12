import "@webcomponents/webcomponentsjs";
import { TopicViewer } from './components';

export const getParent = (el: HTMLElement, selector: string): HTMLElement | null => {
    if (!el.parentElement) {
        return null;
    }
    if (el.parentElement.matches(selector)) {
        return el.parentElement;
    }
    return getParent(el.parentElement, selector);
};

let lastClickedTopic = '';

const isSameAsLastClicked = (href: string) => {
    const url = new URL(href);
    const result = url.pathname === lastClickedTopic;
    lastClickedTopic = url.pathname;
    return result;
}

const shouldCloseViewer = (href: string) => {
    return isSameAsLastClicked(href) && document.querySelector('topic-viewer') !== null;
}

const createRightContainer = () => {
    const styleSheets = `body{width:50%}.right-topic-viewer{position:fixed;right:0;top:0;width:50%;height:100vh;z-index:9999;box-shadow:0 2px 3px rgb(0 0 0 / 10%);border-bottom:1px solid var(--box-border-color);background-color:var(--box-background-color)}`;
    const styleElement = document.createElement('style');
    styleElement.textContent = styleSheets;
    const container = document.createElement('div');
    container.className = 'right-topic-viewer';
    container.appendChild(styleElement);
    document.body.appendChild(container);
    return container;
}

let rightContainer: HTMLElement | null = null;

const insertAfterTopicItem = (topicViewer: HTMLElement, topicItem: HTMLElement) => {
    rightContainer?.remove();
    topicViewer.setAttribute('data-height', `calc(100vh - ${topicItem.offsetHeight}px)`);
    topicItem.parentElement?.insertBefore(topicViewer, topicItem.nextElementSibling);
    topicItem.scrollIntoView();
}
const insertPageRight = (topicViewer: HTMLElement, topicItem: HTMLElement) => {
    if (rightContainer === null) {
        rightContainer = createRightContainer();
    }
    topicViewer.setAttribute('data-height', '100%');
    rightContainer.appendChild(topicViewer);
    topicItem.scrollIntoView();
}

const markLinkVisited = (url: string) => {
    const current_url = window.location.href;
    history.pushState(history.state, '', url);
    history.pushState(history.state, '', current_url);
}

const viewTopic = (evt: MouseEvent) => {
    if (evt.ctrlKey) {
        return;
    }
    const el = evt.target as HTMLAnchorElement;
    const topicItem = getParent(el, 'div.cell');
    if (topicItem === null) {
        return;
    }
    evt.preventDefault();
    const anchor = el as HTMLAnchorElement;
    if (shouldCloseViewer(anchor.href)) {
        lastClickedTopic = '';
        document.querySelector('topic-viewer')?.remove();
        rightContainer?.remove();
        rightContainer = null;
        topicItem.scrollIntoView();
        return;
    }
    markLinkVisited(anchor.href);
    document.querySelector('topic-viewer')?.remove();
    const topicViewer = document.createElement('topic-viewer');
    topicViewer.setAttribute('data-uri', anchor.href);
    chrome.storage.local.get('settings')
        .then((data) => {
            switch (data?.settings?.containerPosition) {
                case 'right':
                    insertPageRight(topicViewer, topicItem);
                    break;
                default:
                    insertAfterTopicItem(topicViewer, topicItem);
                    break;
            }
        })
        .catch((err) => {
            console.error(err);
            insertAfterTopicItem(topicViewer, topicItem);
        });
};

if (document.querySelectorAll('a.topic-link').length > 0) {
    customElements.define('topic-viewer', TopicViewer);
    document.querySelectorAll('a.topic-link').forEach(el => {
        (el as HTMLElement).addEventListener('click', viewTopic);
    });
}
