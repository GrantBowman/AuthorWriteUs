
const usernameHolders = document.getElementsByClassName('username');

async function doThing () {
    const result = fetch('/get-username', {
        method: 'GET',
    })
    .then((result) => result.json())
    .then((result) => {
        const username = result.username;
        
        if (username) {
            for (const usernameHolder of usernameHolders) {
                usernameHolder.textContent = username;
            }
        }
    })
    .catch((err) => {
        console.log(err);
    });
}

doThing();