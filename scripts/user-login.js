console.log("user-login.js script loaded.");
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
    // either is success or fail
    if (result.success) {
        // user is signed in, go to home page?
        window.location.href = "/home"
    }
    else {
        // sign-in failed. give error and allow them to try again
        feedback.textContent = result.message;
        setTimeout(() => {
            feedback.textContent = "";
        }, 5000);
    }

});
