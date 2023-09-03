const loginHeader = document.getElementById('login-header');
loginHeader.textContent = "Login Here!"

const form = document.getElementById('login-form');
form.addEventListener('submit', async (event) => {
    event.preventDefault();

    // send data to server and awaits it response to progress
    const formData = new URLSearchParams(new FormData(form));
    const response = await fetch('/login-submitted', {
        method: 'POST',
        body: formData,
        headers : {
            'content-type' : 'application/x-www-form-urlencoded'
        }
    });
    const result = await response.json();

    const feedback = document.getElementById("feedback");
    if (result.success) {
        window.location.href = "/home"
    }
    else {
        feedback.textContent = result.message;
    }

});
