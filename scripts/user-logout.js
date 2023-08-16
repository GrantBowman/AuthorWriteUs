
const logoutBtn = document.getElementById('logoutBtn');

logoutBtn.addEventListener('click', async (event) => {
    event.preventDefault();

    // send data to server and awaits it response to progress
    const response = await fetch('/logout', { method: 'POST' });
    window.location.href = "/home";
});
