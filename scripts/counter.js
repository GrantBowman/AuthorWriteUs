
var counter = document.getElementById("counter");
var value = 0;

var button_add = document.getElementById("plusBtn");
var button_sub = document.getElementById("minusBtn");

var input_custom = document.getElementById("customAmount");
var button_custom = document.getElementById("customAmountBtn");

button_add.onclick = function add_one() {
    value++;
    counter.innerHTML = value;
}


button_sub.onclick = function sub_one() {
    value--;
    counter.innerHTML = value;
}


button_custom.onclick = function apply_val() {
    var delta = parseInt(input_custom.value, 10);
    value += delta;
    counter.innerHTML = value;
    input_custom.value = 0;
}
