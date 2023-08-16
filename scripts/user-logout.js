console.log("user-logout.js script loaded.");
const logoutBtn = document.getElementById('logoutBtn');

logoutBtn.addEventListener('click', async (event) => {
    console.log("logout attempt");
    event.preventDefault();

    // send data to server and awaits it response to progress
    const response = await fetch('/logout', {
        method: 'POST',
        // body: formData,
        // headers : {
        //     'content-type' : 'application/x-www-form-urlencoded'
        // }
    })
    .then(result => {
        console.log("fetch result=");
        console.log(result);
    });
    window.location.href = "/login.html";

    // const feedback = document.getElementById("feedback");
    // // either is success or fail
    // if (result.success) {
    //     // user is signed in, go to home page?
    //     window.location.href = "/home.html"
    // }
    // else {
    //     // sign-in failed. give error and allow them to try again
    //     feedback.textContent = result.message;
    //     setTimeout(() => {
    //         feedback.textContent = "";
    //     }, 5000);
    // }

});
