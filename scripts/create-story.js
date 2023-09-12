
const form = document.getElementById('create-form');
form.addEventListener('submit', async (event) => {
    event.preventDefault();

    // send data to server and awaits it response to progress
    const formData = new URLSearchParams(new FormData(form));
    const response = await fetch('/create-story', {
        method: 'POST',
        body: formData,
        headers : {
            'content-type' : 'application/x-www-form-urlencoded'
        }
    });
    const result = await response.json();
    console.log(result);

    const feedback = document.getElementById("feedback");
    if (result.success) {
        window.location.href = result.returnUrl;
    }
    else {
        feedback.textContent = result.message;
    }

});
