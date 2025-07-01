// static/js/script_web.js

let isValidFlat = false;
let isValidPhone = false;
let isValidEmail = false;
let previousImageLink = "";

// --- Modal helpers (optional, replace alert() if you want modal feedback) ---
function showModal(title, message, isSuccess) {
    const messageModal = document.getElementById('messageModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalIcon = document.getElementById('modalIcon');
    if (modalTitle) modalTitle.textContent = title;
    if (modalMessage) modalMessage.textContent = message;
    if (modalIcon) modalIcon.innerHTML = isSuccess
        ? '<span class="success-icon">&#10004;</span>'
        : '<span class="error-icon">&#10060;</span>';
    if (messageModal) messageModal.style.display = 'block';
}
function closeModal() {
    const messageModal = document.getElementById('messageModal');
    if (messageModal) messageModal.style.display = 'none';
}

// --- Reset form and UI ---
function resetFormAndUI() {
    const captureForm = document.getElementById('captureForm');
    if (captureForm) captureForm.reset();
    const phoneError = document.getElementById('phoneError');
    if (phoneError) phoneError.textContent = '';
    const flatError = document.getElementById('flatError');
    if (flatError) flatError.textContent = '';
    const emailError = document.getElementById('emailError');
    if (emailError) emailError.textContent = '';
    isValidFlat = false;
    isValidPhone = false;
    isValidEmail = false;
    const previewContainer = document.getElementById('previewContainer');
    if (previewContainer) previewContainer.classList.add('hidden');
    const displayContainer = document.getElementById('displayContainer');
    if (displayContainer) displayContainer.classList.add('hidden');
    const videoContainer = document.getElementById('videoContainer');
    if (videoContainer) videoContainer.classList.remove('hidden');
    const capturedImage = document.getElementById('capturedImage');
    if (capturedImage) capturedImage.src = '';
    const imageDataInput = document.getElementById('imageData');
    if (imageDataInput) imageDataInput.value = '';
    previousImageLink = "";
    const video = document.getElementById('video');
    if (video) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => { video.srcObject = stream; })
            .catch(() => {});
    }
}

// --- Field validations ---
function validatePhoneField() {
    const phoneInput = document.getElementById('visitor_phone');
    const phoneError = document.getElementById('phoneError');
    if (!phoneInput) return;
    const phone = phoneInput.value.trim();
    if (!phone) {
        if (phoneError) phoneError.textContent = 'Phone number is required';
        isValidPhone = false;
    } else if (!/^\d{10}$/.test(phone)) {
        if (phoneError) phoneError.textContent = 'Phone number must be exactly 10 digits';
        isValidPhone = false;
    } else {
        if (phoneError) phoneError.textContent = '';
        isValidPhone = true;
    }
}
function validateEmailField() {
    const emailInput = document.getElementById('Email');
    const emailError = document.getElementById('emailError');
    if (!emailInput) return;

    const email = emailInput.value.trim();
    console.log("Email entered:", email);

    if (!email) {
        if (emailError) emailError.textContent = 'Email is required';
        isValidEmail = false;
    } else if (!/^[\w\.-]+@[\w\.-]+\.\w{2,}$/.test(email)) {
        if (emailError) emailError.textContent = 'Invalid email address';
        isValidEmail = false;
    } else {
        if (emailError) emailError.textContent = '';
        isValidEmail = true;
    }
}
function validateFlatField() {
    const flatInput = document.getElementById('visit_flat');
    const flatError = document.getElementById('flatError');
    if (!flatInput) return;
    const flatNumber = flatInput.value.trim();
    if (!flatNumber) {
        if (flatError) flatError.textContent = 'Flat number is required';
        isValidFlat = false;
        return;
    }
    fetch(`/validate_flat?flat_no=${encodeURIComponent(flatNumber)}`)
        .then(response => response.json())
        .then(data => {
            if (data.valid) {
                if (flatError) flatError.textContent = '';
                isValidFlat = true;
            } else {
                if (flatError) flatError.textContent = 'Invalid flat number';
                isValidFlat = false;
            }
        })
        .catch(() => {
            if (flatError) flatError.textContent = 'Error validating flat number';
            isValidFlat = false;
        });
}
function validateNameField() {
    const nameInput = document.getElementById('visitor_name');
    if (!nameInput) return false;
    if (nameInput.value.trim().length < 2) {
        nameInput.setCustomValidity("Name must be at least 2 characters.");
        return false;
    }
    nameInput.setCustomValidity("");
    return true;
}
function validateVisitTypeField() {
    const visitTypeInput = document.getElementById('visit_type');
    if (!visitTypeInput) return false;
    if (visitTypeInput.value.trim().length < 2) {
        visitTypeInput.setCustomValidity("Visit type must be at least 2 characters.");
        return false;
    }
    visitTypeInput.setCustomValidity("");
    return true;
}
function validateFromWhereField() {
    const fromWhereInput = document.getElementById('from_where');
    if (!fromWhereInput) return false;
    if (fromWhereInput.value.trim().length < 2) {
        fromWhereInput.setCustomValidity("This field must be at least 2 characters.");
        return false;
    }
    fromWhereInput.setCustomValidity("");
    return true;
}

// --- On phone blur: fetch previous visitor data ---
function onPhoneBlur() {
    validatePhoneField();
    const phoneInput = document.getElementById('visitor_phone');
    if (!phoneInput || !isValidPhone) return;
    const phoneNumber = phoneInput.value.trim();
    fetch(`/get_visitor?visitor_phone=${phoneNumber}`)
        .then(response => response.json())
        .then(data => {
            if (data.visitor_name) {
                const nameInput = document.getElementById('visitor_name');
                if (nameInput) nameInput.value = data.visitor_name;
                const typeInput = document.getElementById('visit_type');
                if (typeInput) typeInput.value = data.visit_type;
                const fromInput = document.getElementById('from_where');
                if (fromInput) fromInput.value = data.from_where;
                const flatInput = document.getElementById('visit_flat');
                if (flatInput) flatInput.value = data.visit_flat;
                const emailInput = document.getElementById('Email');
                if (emailInput) emailInput.value = data.Email || '';
                validateFlatField();
                if (data.image_link) {
                    previousImageLink = data.image_link;
                    showPreviousImage(data.image_link);
                }
            } else {
                previousImageLink = "";
                hidePreviousImage();
            }
        })
        .catch(() => {});
}
function showPreviousImage(imageLink) {
    const capturedImage = document.getElementById('capturedImage');
    const displayContainer = document.getElementById('displayContainer');
    const previewContainer = document.getElementById('previewContainer');
    const videoContainer = document.getElementById('videoContainer');
    if (capturedImage) capturedImage.src = `/${imageLink}`;
    if (displayContainer) displayContainer.classList.remove('hidden');
    if (previewContainer) previewContainer.classList.add('hidden');
    if (videoContainer) videoContainer.classList.add('hidden');
    const imageDataInput = document.getElementById('imageData');
    if (imageDataInput) imageDataInput.value = '';
}
function hidePreviousImage() {
    const displayContainer = document.getElementById('displayContainer');
    const capturedImage = document.getElementById('capturedImage');
    const imageDataInput = document.getElementById('imageData');
    const videoContainer = document.getElementById('videoContainer');
    if (displayContainer) displayContainer.classList.add('hidden');
    if (capturedImage) capturedImage.src = '';
    if (imageDataInput) imageDataInput.value = '';
    if (videoContainer) videoContainer.classList.remove('hidden');
}

// --- Webcam and image capture logic ---
function setupWebcam() {
    const video = document.getElementById('video');
    if (video) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => { video.srcObject = stream; })
            .catch(() => {});
    }
}
function captureImage() {
    const video = document.getElementById('video');
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/jpeg');
    const previewCanvas = document.getElementById('previewCanvas');
    if (previewCanvas) {
        previewCanvas.width = canvas.width;
        previewCanvas.height = canvas.height;
        previewCanvas.getContext('2d').drawImage(canvas, 0, 0, canvas.width, canvas.height);
    }
    const previewContainer = document.getElementById('previewContainer');
    if (previewContainer) previewContainer.classList.remove('hidden');
    const videoContainer = document.getElementById('videoContainer');
    if (videoContainer) videoContainer.classList.add('hidden');
    const displayContainer = document.getElementById('displayContainer');
    if (displayContainer) displayContainer.classList.add('hidden');
    const imageDataInput = document.getElementById('imageData');
    if (imageDataInput) imageDataInput.value = imageData;
}
function retakeImage() {
    const previewContainer = document.getElementById('previewContainer');
    if (previewContainer) previewContainer.classList.add('hidden');
    const displayContainer = document.getElementById('displayContainer');
    if (displayContainer) displayContainer.classList.add('hidden');
    const imageDataInput = document.getElementById('imageData');
    if (imageDataInput) imageDataInput.value = '';
    const capturedImage = document.getElementById('capturedImage');
    if (capturedImage) capturedImage.src = '';
    const videoContainer = document.getElementById('videoContainer');
    if (videoContainer) videoContainer.classList.remove('hidden');
    setupWebcam();
}
function saveImage() {
    const previewCanvas = document.getElementById('previewCanvas');
    if (!previewCanvas) return;

    const imageData = previewCanvas.toDataURL('image/jpeg');

    const capturedImage = document.getElementById('capturedImage');
    if (capturedImage) {
        capturedImage.src = imageData;
        capturedImage.style.display = 'block';
    }

    // Try removing ALL 'hidden' and forcing video/image to show
    const containers = ['displayContainer',  'previewContainer'];
    containers.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('hidden');
    });

    const imageDataInput = document.getElementById('imageData');
    if (imageDataInput) imageDataInput.value = imageData;
}



// --- Main event listeners ---
document.addEventListener('DOMContentLoaded', () => {
    setupWebcam();

    // Modal close events (optional)
    const modalOkButton = document.getElementById('modalOkButton');
    const closeButton = document.querySelector('.close-button');
    if (modalOkButton) modalOkButton.addEventListener('click', closeModal);
    if (closeButton) closeButton.addEventListener('click', closeModal);
    window.addEventListener('click', function(event) {
        const messageModal = document.getElementById('messageModal');
        if (event.target === messageModal) closeModal();
    });

    // Real-time and blur validation
    const phoneInput = document.getElementById('visitor_phone');
    if (phoneInput) {
        phoneInput.addEventListener('blur', onPhoneBlur);
        phoneInput.addEventListener('input', validatePhoneField);
    }
    const emailInput = document.getElementById('Email');
    if (emailInput) {
        emailInput.addEventListener('input', validateEmailField);
    }
    const flatInput = document.getElementById('visit_flat');
    if (flatInput) {
        flatInput.addEventListener('blur', validateFlatField);
        flatInput.addEventListener('input', validateFlatField);
    }
    const nameInput = document.getElementById('visitor_name');
    if (nameInput) nameInput.addEventListener('input', validateNameField);
    const visitTypeInput = document.getElementById('visit_type');
    if (visitTypeInput) visitTypeInput.addEventListener('input', validateVisitTypeField);
    const fromWhereInput = document.getElementById('from_where');
    if (fromWhereInput) fromWhereInput.addEventListener('input', validateFromWhereField);

    // Image capture buttons
    const captureButton = document.getElementById('captureButton');
    if (captureButton) captureButton.addEventListener('click', (event) => {
        event.preventDefault();
        captureImage();
    });
    const retakeButton = document.getElementById('retakeButton');
    if (retakeButton) retakeButton.addEventListener('click', retakeImage);
    const saveButton = document.getElementById('saveButton');
    if (saveButton) saveButton.addEventListener('click', saveImage);

    // Form submission
    const captureForm = document.getElementById('captureForm');
    if (captureForm) {
        captureForm.addEventListener('submit', (event) => {
            event.preventDefault();
            validatePhoneField();
            validateEmailField();
            validateFlatField();
            const isNameValid = validateNameField();
            const isVisitTypeValid = validateVisitTypeField();
            const isFromWhereValid = validateFromWhereField();

            const phoneInput = document.getElementById('visitor_phone');
            const emailInput = document.getElementById('Email');
            const nameInput = document.getElementById('visitor_name');
            const typeInput = document.getElementById('visit_type');
            const fromInput = document.getElementById('from_where');
            const flatInput = document.getElementById('visit_flat');
            const imageDataInput = document.getElementById('imageData');
            const phone = phoneInput ? phoneInput.value.trim() : '';
            const email = emailInput ? emailInput.value.trim() : '';
            const name = nameInput ? nameInput.value.trim() : '';
            const visitType = typeInput ? typeInput.value.trim() : '';
            const fromWhere = fromInput ? fromInput.value.trim() : '';
            const flat = flatInput ? flatInput.value.trim() : '';
            let imageData = imageDataInput ? imageDataInput.value : '';

            // Validation alerts (replace with showModal if you want)
            if (!phone) { alert('Phone number is required'); return; }
            if (!isValidPhone) { alert('Phone number must be exactly 10 digits'); return; }
            if (!email) { alert('Email is required'); return; }
            if (!isValidEmail) { alert('Invalid email address'); return; }
            if (!name) { alert('Name is required'); return; }
            if (!isNameValid) { alert('Name must be at least 2 characters.'); return; }
            if (!visitType) { alert('Visit type is required'); return; }
            if (!isVisitTypeValid) { alert('Visit type must be at least 2 characters.'); return; }
            if (!fromWhere) { alert('From is required'); return; }
            if (!isFromWhereValid) { alert('This field must be at least 2 characters.'); return; }
            if (!flat) { alert('Flat number is required'); return; }
            if (!isValidFlat) { alert('Please enter a valid flat number'); return; }
            if (!imageData && previousImageLink) {
                imageData = previousImageLink;
                if (imageDataInput) imageDataInput.value = previousImageLink;
            }
            if (!imageData) { alert('Please capture an image or use the previous one'); return; }

            // AJAX submit
            const formData = new FormData(captureForm);
            if (imageData === previousImageLink) {
                formData.set('imageData', previousImageLink);
            }
            fetch('/add_visitor', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                // You can use showModal(data.success ? "Success" : "Error", data.message, data.success);
                alert(data.message);
                if (data.success) {
                    resetFormAndUI();
                }
            })
            .catch(() => {
                // showModal("Error", "Failed to submit form. Please try again.", false);
                alert('Failed to submit form. Please try again.');
            });
        });
    }
});
