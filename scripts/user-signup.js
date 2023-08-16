
const signupHeader = document.getElementById('signup-header');
signupHeader.textContent = "Sign Up Here!"

const form = document.getElementById('signup-form');
form.addEventListener('submit', async (event) => {
    event.preventDefault();

    // send to server and await its response to progress
    const formData = new URLSearchParams(new FormData(form));
    const response = await fetch('/signup-submitted', {
        method: 'POST',
        body: formData,
        headers : {
            'content-type' : 'application/x-www-form-urlencoded'
        }
    });
    const result = await response.json();

    const feedback = document.getElementById("feedback");
    if (result.success) {
        feedback.textContent = "New user added! User the login page to log in."
    }
    else {
        feedback.textContent = "Error: " + result.message;
    }
});
