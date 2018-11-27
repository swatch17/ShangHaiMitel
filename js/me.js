$(document).ready(function () {
    var IP = 'http://10.154.70.90'
    // 實例化Mitel
    var phone = new Window.Micc(IP);

    // 初始化綁定事件
    phone.init()


    $('#clear').click(function () {
        $('#eventInfo').text('');
    })


})

// 獲取地地址欄中的參數
function queryParam(name, str) {
    var reg = new RegExp("(^|&)" + name + "=([^&|^#]*)(&|#|$)");
    var str = str ? str : window.location.href;
    var r = str.substr(str.indexOf("?") + 1).match(reg);
    console.log(r)
    return (r != null) ? decodeURIComponent(r[2]) : null;
}


// 匹配手機號
function matchNumber(n) {
    var o = n.substr(1);
    var reg = /^1[345678]\d{9}$/;
    if (reg.test(o)) {
        console.log(o);
        return o;
    } else {
        console.log(n);
        return n;
    }
}


