const userQueue = document.getElementById('userQueue');
const sse = new EventSource("/writing-sse");

sse.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
    console.log("sse received:");
    console.log(data);

    if (data.users) {
        updateUserQueue(data.users);
    }
    // sent: writer (T/F)
    //   ^ if true, also send prevInput
    if (data.isWriter !== "undefined") {
        assignWriter(data.isWriter, data.previousInput);
    }
});

// Add an event listener for beforeunload or unload event
window.addEventListener("beforeunload", function (event) {

    // NOTE: this desync'd devices if said no to confirmation
    // leave warning+confirmation (since replaces spot in queue)
    // event.returnValue = "Are you sure you want to leave?";
    sse.close()
});

function updateUserQueue(users) {
    // clear user list since we about to re-display
    while (userQueue.firstChild) {
        userQueue.removeChild(userQueue.firstChild);
    }
    
    users.forEach((user) => {
        const listitem = document.createElement("li");
        listitem.textContent = user;
        userQueue.appendChild(listitem);
    });
}

const previousInput = document.getElementById('previousInput');
const writingInput = document.getElementById('writingInput');
const submitBtn = document.getElementById('submitBtn');
// show form and prev input if time to write, hide if not
// if write: show: form, button, previousinput. hide: "waiting for your turn"
// if not writer: hide form, button, previousinput. show "waiting for your turn"
function assignWriter(isWriter, previousInputContent) {
    if (isWriter) {
        writingInput.style.display = '';
        submitBtn.style.display = '';

        previousInput.textContent = "Previous Input:\n\t" + previousInputContent;

    }
    else if (!isWriter) {
        writingInput.style.display = "none";
        submitBtn.style.display = "none";

        previousInput.textContent = "Please wait for your turn to write."
    }
}
