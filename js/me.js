$(document).ready(function () {
    var IP = 'http://10.154.70.90'
    // 實例化Mitel
    var phone = new Window.Micc(IP);

    // 初始化綁定事件
    phone.init()


    $('#clear').click(function () {
        $('#eventInfo').text('');
    })
    $('#historyList').click(function () {
        phone.history();
        var agentId = $phone.session('agentId'), ext = $phone.session('ext'), pwd = $phone.session('pwd');
        console.log(agentId, ext, pwd, token)
    })

    if ($phone.session('flag')) {
        var agentId = $phone.session('agentId'), ext = $phone.session('ext'), pwd = $phone.session('pwd');

       $phone.agentId = agentId,$phone.ext=ext,$phone.pwd=pwd;
        if (agentId && ext && pwd) {
            $('#agentId').val(agentId);
            $('#ext').val(ext);
            $('#pwd').val(pwd);
            $phone.login(agentId, pwd, function(data) {
                    console.log('登錄成功！');
                    $phone.connectToEmployeeHub(data);
                });
        }
    }


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

