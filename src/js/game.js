(function(doc, win) {
    doc.body.addEventListener('touchmove', function (e) {
        e.preventDefault();
    }, false);

    var box = document.querySelector("#myBox>div");
    var loaded = false;
    var myTest = new DScroll("#myBox",{
        scrollBar: true,
    });

    //模拟ajax添加条目
    function createNewItem() {
        var i = 0, l = 10;

        for ( ; i < l; i++) {
            var myDom = document.createElement("p");
            myDom.innerText = "我是添加的条目" + (i + 1);
            box.appendChild(myDom);
        }
    };

    //子元素绑定点击事件
    function bindTouch() {
        var i = 0,
            l = document.querySelectorAll("#myBox>div>p").length;

        for (; i < l; i++) {

            (function (k) {
                var dom = document.querySelectorAll("#myBox>div>p").item(k);
                myTest.tap(dom,function () {
                    alert("您点击的是第" + (k + 1) + "个段落。");
                });
            })(i);

        }
    };

    myTest.on("scrolling",function () {
        if (this.bottomHeight < 100 && !loaded) {
            loaded = true;
            createNewItem();

            //刷新操作会清空子元素的绑定事件
            myTest.refresh();

            //刷新后统一绑定点击事件
            bindTouch();
        }
    });

    bindTouch();

})(document, window);