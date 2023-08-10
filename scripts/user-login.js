console.log("user-login.js script loaded.");
const loginHeader = document.getElementById('login-header');
loginHeader.textContent = "Login Here!"

const form = document.getElementById('login-form');
form.addEventListener('submit', async (event) => {
    const formData = new FormData(form);

    // Convert FormData to URL-encoded string
    const urlEncodedData = new URLSearchParams(formData).toString();
    
    const response = await fetch('/login-submitted', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: urlEncodedData
    });

    const result = await response.text();
    console.log(`user-login.js result= ${result}`);
});
