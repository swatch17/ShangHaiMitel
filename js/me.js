var phone = new Window.Micc();
console.log(phone);

phone.Ringingui()
function toFix2(num) {
    var numStr = '' + num;
    var index = numStr.indexOf('.');
    return numStr.substr(0, index) + numStr.substr(index, index + 2)
}

toFix2(0.889)
