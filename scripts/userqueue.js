const userqueue = document.getElementById('userqueue');
const sse = new EventSource("/writingsse");
// EventSource.close()

sse.addEventListener("message", (event) => {
    const data = event.data;
    console.log("event =");
    console.log(event);
    console.log("event.data =");
    console.log(data);

    updateUserQueue(data);
});

function updateUserQueue(data) {
    // clear user list since we about to re-display
    userqueue.innerhtml = '';

    data.users.forEach((user) => {
        const listitem = Document.createElement("li");
        listitem.textContent = user.username;
        userqueue.appendChild(listitem);
    });
}

/*
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
        if (result.returnUrl) {
            window.location.href = "/home";
        }
    }
    else {
        feedback.textContent = "Error: " + result.message;
    }
});
*/