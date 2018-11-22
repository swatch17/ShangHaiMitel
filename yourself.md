Mitel Demo指南

由于该软电话与弹屏属于两个系统，所以在主叫号(ani)的取值和每通电话的ID(convesationId)的取值需要在弹屏页面完成。

在弹屏页面底部加上一下代码

<script>

​        window.onload = function () {

​            function queryParam(name, str) {

​                var reg = new RegExp("(^|&)" + name + "=([^&|^#]*)(&|#|$)");

​                var str = str ? str : window.location.href;

​                var r = str.substr(str.indexOf("?") + 1).match(reg);

​                console.log(r)

​                return (r != null) ? decodeURIComponent(r[2]) : null;

​            }

 

​            var ani = queryParam('ANI');//主叫號碼

​            var callId = queryParam('conversationId');//會話ID(每通電話的唯一標誌)

​        }

​    </script>

 

在使用前，检查浏览器是否允许弹屏如谷歌Chrome

![img](file:///C:/Users/swatc/AppData/Local/Temp/msohtmlclip1/01/clip_image002.jpg)

需要关掉组值，否则无法弹屏

设置-----高级 ------隐私设置和安全性----隐私设置和安全性—内容设置-----弹出式窗口和重定向

**关于弹屏参数**

由于这只是一个测试Demo,所以为了测试效果，暂时将跳转页面写死，真实页面地址将再浏览器日志中打印出来按F12键，选择Console将会看到。