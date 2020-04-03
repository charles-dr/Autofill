
docReady(function() {
    checkActivation();
    document.getElementById('btn-activate').addEventListener('click', activateUser);
    document.getElementById('btn-authorize').addEventListener('click', authorizeUser);
    document.getElementById('to_authorize').addEventListener('click', showAuthorizeForm);
    document.getElementById('to_activate').addEventListener('click', showActivateForm);
})


function activateUser(e) {
    console.log('[activate User]');
    e.preventDefault();
    
    const data = {
        key: document.getElementById('act_key').value,
        activation: {
            hwid: document.getElementById('hwid').value,
            device_name: document.getElementById('device_name').value
        }
    };
    if (true) {
        document.querySelector('#btn-activate img').style.display = 'inherit';
        document.getElementById('btn-activate').attributes.disabled = 'true';
        ajaxPost(authURL(`/activations`), data, { 'Content-Type': 'application/json' })
        .then(function(res) {
            console.log(res);
            if (res.success && res.success === true) {
                document.querySelector('#btn-activate img').style.display = 'none';
                document.getElementById('btn-activate').attributes.disabled = 'false';
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
        document.getElementById('btn-authorize').attributes.disabled = 'true';
        ajaxGet(authURL(`/activations/${token}`), { 'Content-Type': 'application/json' })
        .then(function(res) {
            // console.log(res);
            if (res.success && res.success === true) {
                document.querySelector('#btn-authorize img').style.display = 'none';
                document.getElementById('btn-authorize').attributes.disabled = 'false';
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

// show authorization form, and hide activation form
function showAuthorizeForm() {
    document.getElementById('authorize_form').style.display = 'block';
    document.getElementById('activate_form').style.display = 'none';
}

// show activation form, and hide authorization form
function showActivateForm() {
    document.getElementById('activate_form').style.display = 'block';
    document.getElementById('authorize_form').style.display = 'none';
}

// check if user already authorized. if yes, open settings.html
function checkActivation() {
    chrome.storage.local.get(["data"], function (store) {
        if (store && store.data && store.data.activation) {
            const token = store.data.activation.activation_token;
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
                } else {
                    showActivateForm();
                }
            })
            .catch(function(error) {
                console.log(error);
                showActivateForm();
            });
        } else {
            showActivateForm();
        }        
    })
}

