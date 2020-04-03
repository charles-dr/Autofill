

document.getElementById('btn-activate').addEventListener('click', activateUser);
document.getElementById('btn-authorize').addEventListener('click', authorizeUser);
document.getElementById('to_authorize').addEventListener('click', showAuthorizeForm);
document.getElementById('to_activate').addEventListener('click', showActivateForm);

function activateUser() {
    console.log('[activate User]');
    
    const data = {
        key: document.getElementById('act_key').value,
        activation: {
            hwid: document.getElementById('hwid').value,
            device_name: document.getElementById('device_name').value
        }
    };
    if (token) {
        ajaxPost(authURL(`/activations`), data, { 'Content-Type': 'application/json' })
        .then(function(res) {
            console.log(res);
            if (res.success && res.success === true) {
                storeActivationInfo(res);
                chrome.tabs.create({url: 'src/settings.html'})
            }
        })
        .catch(function(error) {
            console.log(error)
        });
    }
}

function authorizeUser(e) {
    console.log('[authorize user]');
    e.preventDefault();
    // chrome.tabs.create({url: 'src/settings.html'})
    const token = document.getElementById('act_token').value;
    if (token) {
        document.querySelector('#btn-authorize img').style.display = 'inherit';
        document.querySelector('#btn-authorize img').attributes.disabled = 'true';
        ajaxGet(authURL(`/activations/${token}`), { 'Content-Type': 'application/json' })
        .then(function(res) {
            // console.log(res);
            if (res.success && res.success === true) {
                document.querySelector('#btn-authorize img').style.display = 'none';
                document.querySelector('#btn-authorize img').attributes.disabled = 'false';
                storeActivationInfo(res, function() {
                    chrome.tabs.create({url: 'src/settings.html'})
                });
            }
        })
        .catch(function(error) {
            console.log(error)
        });
    }
}

function showAuthorizeForm() {
    document.getElementById('authorize_form').style.display = 'block';
    document.getElementById('activate_form').style.display = 'none';
}

function showActivateForm() {
    document.getElementById('activate_form').style.display = 'block';
    document.getElementById('authorize_form').style.display = 'none';
}

