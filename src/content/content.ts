import "@webcomponents/webcomponentsjs";
import { TopicViewerLoading, TopicViewer } from './components';
import { getParent, isLoading, isTopicViewer, createLoading, fetchTopicContent } from './utils';

const appendTopicViewer = async (content: Node, topic: HTMLElement) => {
    const topicViewer = document.createElement('topic-viewer');
    topicViewer.shadowRoot?.querySelector('div.topic-viewer-container')?.appendChild(content);
    topicViewer.setAttribute('topic-height', topic.offsetHeight.toString());
    topic.parentElement?.insertBefore(topicViewer, topic.nextElementSibling);
}

if (document.querySelectorAll('a.topic-link').length > 0) {
    customElements.define('topic-viewer-loading', TopicViewerLoading);
    customElements.define('topic-viewer', TopicViewer);
    document.querySelector('#Main>.box')?.addEventListener('click', (evt: Event) => {
        const el = evt.target! as HTMLElement;
        if (el.tagName.toLowerCase() == 'a' && el.className.indexOf('topic-link') >= 0) {
            const anchor = el as HTMLAnchorElement;
            const topicItem = getParent(el, 'div.cell.item');
            if (topicItem === null) {
                return;
            }
            evt.preventDefault();
            if (isLoading(topicItem.nextElementSibling)) {
                return;
            }
            if (isTopicViewer(topicItem.nextElementSibling)) {
                topicItem.nextElementSibling?.remove();
                return;
            }
            const loadingElement = createLoading();
            document.querySelector('topic-viewer')?.remove();
            topicItem.parentElement?.insertBefore(loadingElement, topicItem.nextElementSibling);
            topicItem.scrollIntoView();
            fetchTopicContent(anchor.href)
                .then(content => {
                    loadingElement.remove();
                    if (content) {
                        appendTopicViewer(content, topicItem);
                    }
                })
                .catch((err) => {
                    loadingElement.remove();
                    console.error(err);
                });
        }
    });
}

