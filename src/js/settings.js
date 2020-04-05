
docReady(function () {
    loadData();
    // checkAuthAndExist();
    tabSelected(document.querySelector('.tabs .tab'));

    document.getElementById('btn-save-profile').addEventListener('click', function (e) {
        console.log('[Save Profile]');
        e.preventDefault();
        if (validateForm() === false) {
            alert('Please fill all the fields!')
            return;
        }
        const formData = getFormData();
        saveProfile(formData);
    });

    document.getElementById('profile_names').addEventListener('change', function () {
        const value = this.value;
        chrome.storage.local.get(["data"], function (store) {
            if (!store || !store.data) return;
            let profile = {};
            for (let prf of store.data.profiles) {
                // console.log('[]', prf.name, value)
                if (prf.name == value) {
                    store.data.profile = prf;
                    chrome.storage.local.set({ data: store.data }, function () {
                        loadData();
                    })
                }
            }
        });
    });

    // tab
    document.querySelectorAll('.tabs .tab').forEach(function (tab) {
        tab.addEventListener('click', function () {
            tabSelected(this);
        });
    })
})

function loadData() {
    chrome.storage.local.get(["data"], function (result) {
        console.log('[loadData]', result);
        if (result && result.data.profile) {
            fillProfileForm(result.data.profile);
            fillProfilesSelect(result.data);
            if (result.data.activation) {
                fillActivationSection(result.data.activation);
            }
        }
    })
}

// save profile data to profiles[]
function saveProfile(profile) {
    chrome.storage.local.get(["data"], function (result) {
        let profiles = [];
        let data = {};

        if (result && result.data) {
            data = result.data;
        }
        if (data && data.profiles) {
            profiles = data.profiles;
        }

        // seek the existing profile with profile_name
        const position = checkSavedProfileWithSameName(profiles, profile);
        if (position > -1) {
            profiles[position] = profile;
        } else {
            profiles.push(profile);
        }
        data.profiles = filterProfile(profiles);
        data.profile = profile;
        data.mode = '1';

        chrome.storage.local.set({ data: data }, function () {
            alert('Data has been successfully saved!');
            loadData();
        });
    });
}

function validateForm() {
    requiredFields = document.querySelectorAll('input[required]');
    for (let required of requiredFields) {
        if (!required.value) return false;
    }
    return true;
}

function getFormData() {
    let data = {
        name: document.getElementById('profile-name').value.trim(),
        email: document.getElementById('email').value.trim(),
        bill: {
            fName: document.getElementById('first-name').value.trim(),
            lName: document.getElementById('last-name').value.trim(),
            address1: document.getElementById('address1').value.trim(),
            address2: document.getElementById('address2').value.trim(),
            city: document.getElementById('city').value.trim(),
            country: document.getElementById('country').value.trim(),
            province: document.getElementById('state').value.trim(),
            zip: document.getElementById('zipcode').value.trim(),
            phone: document.getElementById('phone').value.trim(),
        },
        card: {
            number: document.getElementById('card-number').value.trim(),
            expMonth: document.getElementById('month').value.trim(),
            expYear: document.getElementById('year').value.trim(),
            cvv: document.getElementById('cvv').value.trim(),
        }
    };
    // let inputs = document.querySelectorAll('input');
    // for (let input of inputs) {
    //     const name = input.getAttribute('name');
    //     const value = input.value;
    //     data[name] = value;
    // }
    return data;
}

/**
 * @description check profile exists in profiles array
 */
function checkSavedProfileWithSameName(profiles, profile) {
    if (typeof profiles == 'object' && profiles.length > 0) {
        for (let i = 0; i < profiles.length; i++) {
            if (profiles[i].name === profile.name) return i;
        }
    }
    return -1;
}

function fillProfilesSelect(data) {
    let optionsHTML = '';
    for (let profile of data.profiles) {
        const selected = profile.name == data.profile.name ? 'selected' : '';
        optionsHTML += `<option value="${profile.name}" ${selected}>${profile.name}</option>`;
    }
    const select = document.getElementById('profile_names');
    if (data.profiles.length === 0) {
        optionsHTML = `<option disabled>No profiles</option>`;
    } else {
        optionsHTML = `<option disabled>Select profile</option>` + optionsHTML;
    }
    select.innerHTML = optionsHTML;
}

/**
 * @description fill the profile form with the given data
 */
function fillProfileForm(profile) {
    document.getElementById('profile-name').value = profile.name;
    document.getElementById('email').value = profile.email;
    document.getElementById('first-name').value = profile.bill.fName;
    document.getElementById('last-name').value = profile.bill.lName;
    document.getElementById('address1').value = profile.bill.address1;
    document.getElementById('address2').value = profile.bill.address2;
    document.getElementById('city').value = profile.bill.city;
    document.getElementById('country').value = profile.bill.country;
    document.getElementById('state').value = profile.bill.province;
    document.getElementById('zipcode').value = profile.bill.zip;
    document.getElementById('phone').value = profile.bill.phone;
    document.getElementById('card-number').value = profile.card.number;
    document.getElementById('month').value = profile.card.expMonth;
    document.getElementById('year').value = profile.card.expYear;
    document.getElementById('cvv').value = profile.card.cvv;
}

// filter profile with new rule
function filterProfile(profiles) {
    if (typeof profiles == 'object') {
        let filtered = [];
        for (let profile of profiles) {
            if (profile.bill && profile.card) filtered.push(profile);
        }
        return filtered;
    }
    return profiles;
}

/** Check if user already is authorized, if not, close self tab */
function checkAuthAndExist() {
    chrome.storage.local.get(["data"], function (store) {
        if (store && store.data && store.data.activation) {
            const token = store.data.activation.activation_token;
            ajaxGet(authURL(`/activations/${token}`), { 'Content-Type': 'application/json' })
                .then(function (res) {
                    // console.log(res);
                    if (res.success && res.success === true) {
                    } else {
                        unauthorizeUser();
                        closeSelf();
                    }
                })
                .catch(function (error) {
                    console.log(error);
                    unauthorizeUser();
                    closeSelf();
                });
        }
    });

}

// close self tab
function closeSelf() {
    chrome.tabs.getCurrent(function (tab) {
        chrome.tabs.remove([tab.id], function () {
            console.error('[Unauthorized!]');
        })
    })
}

// action for tab selection
function tabSelected(elem) {
    const targetId = elem.attributes['data-target'].value;
    document.querySelectorAll('.tabs .tab').forEach(function (tab) {
        tab.classList.remove('active');
    });
    elem.classList.add('active');
    // document.getElementById('header').innerText = elem.innerText;

    // tab panes
    document.querySelectorAll('.tab-pane').forEach(function(tabPane) {
        tabPane.style.display = 'none';
    })
    document.getElementById(`${targetId}`).style.display = 'block';
}

function fillActivationSection(activation) {
    document.getElementById('actv_key').value       = activation.key
    document.getElementById('actv_hwid').value      = activation.activation.hwid;
    document.getElementById('actv_device').value    = activation.activation.device_name;
    document.getElementById('actv_token').value     = activation.activation_token;
}

