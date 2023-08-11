/*
var buttonDiv = document.getElementById("buttonDiv");
var buttonCounter = buttonDiv.getElementsById("buttonCounter");
var numButtons = 0;

buttonCounter.innerHTML = "1";
*/

document.getElementById("buttonMaker").addEventListener('click',makeButton);

//*
function makeButton() {
    // var mytext = self.textContent;
    const buttonList = document.getElementById("buttonList");
    const buttonItem = document.createElement("li");
    const newButton = document.createElement("button");
    buttonItem.appendChild(newButton);
    buttonList.appendChild(buttonItem);
    newButton.buttonCounter = buttonCounter(newButton);
    newButton.addEventListener('click', newButton.buttonCounter.increment);
    newButton.textContent = newButton.buttonCounter.getCount();
};

function buttonCounter(button) {
    let count = 0;
    let myButton = button;

    function increment(event) {
        count++;
        myButton.textContent = count;
    }

    function getCount() {
        return count;
    }

    return {
        increment,
        getCount
    }
}

//*/
// firstbutton.on_click = makeButton;


// let newButton = document.createElement("button");
// newButton.innerHTML = "new button!";
// document.body.appendChild(newButton);
// makeButton();


