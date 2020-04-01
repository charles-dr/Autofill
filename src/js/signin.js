
document.getElementById('btn-authorize').addEventListener('click', authorizeUser);

function authorizeUser() {
    console.log('[authorize user]');
    chrome.tabs.create({url: 'src/settings.html'}) 
}