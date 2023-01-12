const underTopicRadio = document.querySelector('#under-topic') as HTMLInputElement;
const rightRadio = document.querySelector('#right') as HTMLInputElement;

const setCheckedContainerPosition = (radio: HTMLInputElement) => {
    chrome.storage.local.set({
        settings: {
            containerPosition: radio.value
        }
    });
};
const handleRadioClicked = (evt: MouseEvent) => {
    setCheckedContainerPosition(evt.target as HTMLInputElement)
};
underTopicRadio.addEventListener('click', handleRadioClicked);
rightRadio.addEventListener('click', handleRadioClicked);

chrome.storage.local.get('settings')
    .then((data) => {
        switch (data?.settings?.containerPosition) {
            case 'right':
                rightRadio.checked = true;
                break;
            default:
                underTopicRadio.checked = true;
                break;
        }
    })
    .catch((err) => {
        console.error(err);
        underTopicRadio.checked = true;
    });
