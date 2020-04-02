
docReady(function () {
    loadData();

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
})

function loadData() {
    chrome.storage.local.get(["data"], function (result) {
        console.log('[loadData]', result);
        if (result && result.data.profile) {
            fillProfileForm(result.data.profile);
        }
        // let profiles = [];
        // if (result && result.profiles) {
        //     profiles = result.profiles;
        // }

        // const defaultProfileIndex = 0;
        // if (profiles.length == 0) {
        //     return;
        // }

        // const fillIndex = profiles[defaultProfileIndex] ? defaultProfileIndex : 0;
        // fillProfileForm(profiles[fillIndex]);
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
        data.profiles = profiles;
        data.profile = profile;
        data.mode = '1';

        chrome.storage.local.set({ data: data }, function () {
            alert('Data has been successfully saved!');
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


