(function(win) {

    win.urlParam = function(name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
        var r = window.location.search.substr(1).match(reg);
        if (r != null) return decodeURI(r[2]); return '';
    }

    /**
     * ajax方法
     * 仅支持返回json格式数据
     */
    win.ajax =  function(opts) {
        var request = new XMLHttpRequest();

        var params = null;
        if (opts.data) {
            var data = opts.data;
            if (typeof data == 'string') {
                params = data;
            } else if (typeof data == 'object') {
                params = [];
                for (var p in data) {
                    if (data.hasOwnProperty(p)) {
                        params.push(p + '=' + data[p]);
                    }
                }

                params = params.join('&');
            }
        }

        var type = opts.type || 'post', url = opts.url;

        if (params && type == 'get') {
            if (url.indexOf('?') >= 0) {
                url += '&' + params;
            } else {
                url += '?' + params;
            }
            params = '';
        }

        opts.async = typeof opts.async == 'undefined' ? true : opts.async;

        request.open(type, url, opts.async && true);
        var acceptType = 'application/json';
        if (opts.header) {
            var header = opts.header;
            if (header instanceof Array) {
                console.log('add request header');
                if (header[0] instanceof Array) {
                    var headers = header;
                    for (var i = 0; i < headers.length; i++) {
                        header = headers[i];
                        request.setRequestHeader(header[0], header[1]);
                    }
                } else {
                    request.setRequestHeader(header[0], header[1]);
                }
            }
        }

        request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        request.setRequestHeader('Accept', acceptType);
        request.setRequestHeader("Content-Type","application/x-www-form-urlencoded");


        request.onreadystatechange = function() {
            if (request.readyState == 4) {
                clearTimeout(t);
                var status = request.status, isSuccess = status >= 200 && status < 300 || status === 304;
                if (isSuccess) {
                    var data;
                    try {
                        data = JSON.parse(request.responseText);
                    } catch(e) {
                        if (opts.fail && typeof opts.fail == 'function') {
                            opts.fail.call(undefined, request.status, 'responseText is not a json data :' + request.responseText, request);
                        }
                    }

                    if (data.status == 2) {
                        alert('登录超时，即将为您重新登录');
                        window.location.href = location.href;
                    }

                    if (opts.success && typeof opts.success == 'function') {
                        opts.success.call(undefined, data, request);
                    }
                } else {
                    if (opts.fail && typeof opts.fail == 'function') {
                        opts.fail.call(undefined, request.status, request.responseText, request);
                    }
                }
            }
        };

        var t = setTimeout(function() {
            request.abort();
            if (opts.fail && typeof opts.fail == 'function') {
                opts.fail.call(undefined, 'timeout', '网络连接超时，请检查网络是否连接', request);
            }
        }, opts.timeout || 20000);

        request.send(params);
    };

    var cbIndex = 0;
    win.jsonp = function (url, cb) {
        cbIndex ++;
        var callbackName = 'callback_jsonp' + cbIndex;
        win[callbackName] = function(text) {
            try {
                if (typeof text == 'string') {
                    var data = JSON.parse(text);
                } else {
                    var data = text;
                }


                cb(data);
            } catch (e) {
                cb({hasError: true, info: '格式化json对象出错'});
            }
            delete win[callbackName];
            document.body.removeChild(script);
        };
        var script = document.createElement('script');
        script.type = 'text/javascript';
        if (url.indexOf('?') >= 0) {
            url += '&callback=' + callbackName;
        } else {
            url += '?callback=' + callbackName;
        }
        script.src = url;
        document.body.appendChild(script);
    }

})(window);
/***
 * 着手开发于2017-12-11
 * author：一只神秘的猿
 * name: DeftScroll
 */

/****1.2版本
 * 开发于2017-12-21
 */
(function (win,doc,Math) {
    var rAF = window.requestAnimationFrame	||
        window.webkitRequestAnimationFrame	||
        window.mozRequestAnimationFrame		||
        window.oRequestAnimationFrame		||
        window.msRequestAnimationFrame		||
        function (callback) { window.setTimeout(callback, 1000 / 60); };
    function DScroll(el,options) {

        this.height = 0;//里面框的高度
        this.boxHeight = 0;//容器的高度
        this.element = null;
        this.children = null;
        this.style = null;
        this.scrollBox = null;//滚动条框
        this.scrollItem = null;//滚动条
        this.options = options;//参数
        this.overHeight = 0;//未显示的内容高度
        this.bottomHeight = 0;//底部未显示的高度
        this.events = {};
        this.startY = 0;
        this.isAnimating = false;
        this.oStartY = 0;
        this.endY = 0;
        this.y = 0;

        if (typeof el === "string") {
            this.element = doc.querySelector(el);
        } else {
            throw "获取不到正确的dom。";
        }

        if (this.element) {
            var child = this.element.children[0];
            this.children = child;
        } else {
            throw "无法获取列表父级盒子。"
        }

        this._init();
        this._eventHandle();
    }

    DScroll.prototype = {

        _init: function () {
            if (this.children) {
                this.height = this.children.scrollHeight;
                this.boxHeight = this.element.offsetHeight;
                this.overHeight = this.height - this.boxHeight;
                this.style = this.children.style;
            }

            if (this.height > this.boxHeight) {

                if (!this.options || !this.options.scrollBar) {
                    return;
                }

                this.scrollBox = doc.createElement("div");
                this.scrollItem = doc.createElement("div");
                this.scrollBox.appendChild(this.scrollItem);
                this.element.appendChild(this.scrollBox);

                //设置滚动条类名
                if (this.options && typeof this.options.barName === "string") {
                    this.scrollBox.className = "clipScrollBox " + this.options.barName;
                } else {
                    this.scrollBox.className = "clipScrollBox";
                }

                this.scrollItem.className = "clipScrollItem";

                if (this.scrollBox.className === "clipScrollBox") {
                    this.scrollBox.setAttribute(
                        "style","position:absolute; width: 5px; height:100%; top: 0; right: 0; border: 1px solid #fff; background: rgba(255,255,255,.7); border-radius: 4px; overflow: hidden; z-index: 1000");
                    this.scrollItem.setAttribute("style","width: 100%; height: " +  this.boxHeight * 100 / this.height + "%; background: #999; border-radius: 4px;")
                } else {
                    this.scrollBox.setAttribute("style","position: absolute; height:100%; top: 0; right: 0; overflow: hidden; z-index: 1000");
                    this.scrollItem.setAttribute("style","width: 100%; height: " +  this.boxHeight * 100 / this.height + "%;")
                }
            }

        },

        transform: function (destY) {

            if (destY) {
                this.y = destY;
            }

            this.children.style.transform = "translate3d(0," + this.y + "px,0)";
        },

        changePosition: function () {
            var y = 0;
            if (this.y <= 0 && this.y >= -this.overHeight) {

                this.scrollItem.style.transform = "translate3d(0," + Math.abs(this.y) * (this.boxHeight - this.boxHeight * this.boxHeight / this.height) / (this.height - this.boxHeight) + "px,0)";

            } else if (this.y > 0) {

                y = 0;
                this.scrollItem.style.transform = "translate3d(0," + Math.abs(y) * (this.boxHeight - this.boxHeight * this.boxHeight / this.height) / (this.height - this.boxHeight) + "px,0)";

            } else {

                y = -this.overHeight;

                this.scrollItem.style.transform = "translate3d(0," + Math.abs(y) * (this.boxHeight - this.boxHeight * this.boxHeight / this.height) / (this.height - this.boxHeight) + "px,0)";
            }
        },

        //事件控制器
        _eventHandle: function (e) {
            var self = this;

            this.element.addEventListener("touchstart",function (e) {

                self.startY = e.touches[0].pageY;
                self.oStartY = self.startY;
                self.startTime = utils.getTime();

                self.isAnimating && self.stop();
            },false);

            this.element.addEventListener("touchmove",function (e) {

                if (self.y > 0) {

                    self.diffY = e.touches[0].pageY - self.startY;
                    self.startY = e.touches[0].pageY;
                    self.y += self.diffY * .3;

                } else if (self.y <= self.boxHeight - self.height) {

                    self.diffY = e.touches[0].pageY - self.startY;
                    self.startY = e.touches[0].pageY;
                    self.y += self.diffY * .3;

                } else {

                    self.diffY = e.touches[0].pageY - self.startY;
                    self.startY = e.touches[0].pageY;
                    self.y += self.diffY;

                    if (self.options && self.options.scrollBar) {
                        self.changePosition();
                    }

                }

                self.bottomHeight = self.overHeight + self.y;

                //利用requestAnimationFrame做transform的动画过程中，不允许添加DOM，个人猜测js机制不允许……暂时关闭scrolling接口
                self._sendEvent("scrolling");
                self.transform();
            },false);

            this.element.addEventListener("touchend",function (e) {

                self.endTime = utils.getTime();
                self.endY = e.changedTouches[0].pageY;

                self._end(e);


            },false);
        },

        stop: function () {
            if (this.isAnimating) {
                this.isAnimating = false;
            }
        },

        _end: function (e) {
            var duration = this.endTime - this.startTime,
                newY = Math.round(this.endY);

            if (duration < 300) {

                aniData = utils.momentum(newY,this.oStartY,duration,this.y,this.boxHeight,-this.overHeight);
                this.speed = aniData.speed;

                this.children.style.transitionTimingFunction = utils.ease.quadratic.style;
                this._animate(aniData.destination,aniData.duration,utils.ease.quadratic.fn,aniData.speed);
            } else if (this.y > 0) {

                this.scrollTo(0,20,200);


            } else if (this.y <= -this.overHeight) {


                this.scrollTo(-this.overHeight,20,200);


            } else {

                if (this.events["scrollEnd"]) {
                    this._sendEvent("scrollEnd");
                }

            }
        },

        //刷新列表
        refresh: function () {

            this._sendEvent("destroy");
            this.events.destroy = [];

            if (this.children) {
                this.height = this.children.scrollHeight;
                this.boxHeight = this.element.offsetHeight;
                this.overHeight = this.height - this.boxHeight;
                this.style = this.children.style;
            }

            if (this.options && this.options.scrollBar) {

                if (this.scrollBox.className === "clipScrollBox") {
                    this.scrollBox.setAttribute(
                        "style","position:absolute; width: 5px; height:100%; top: 0; right: 0; border: 1px solid #fff; background: rgba(255,255,255,.7); border-radius: 4px; overflow: hidden; z-index: 1000");
                    this.scrollItem.setAttribute("style","width: 100%; height: " +  this.boxHeight * 100 / this.height + "%; background: #999; border-radius: 4px;")
                } else {
                    this.scrollBox.setAttribute("style","position: absolute; height:100%; top: 0; right: 0; overflow: hidden; z-index: 1000");
                    this.scrollItem.setAttribute("style","width: 100%; height: " +  this.boxHeight * 100 / this.height + "%;")
                }

                this.changePosition();
            }
        },

        //事件绑定，实质就是自定义一个事件名称，将需要执行的方法存放在这个数组中，在代码需要的时候遍历这个事件数组，去执行里面的方法。
        on: function (type,fn) {

            if (!this.events[type]) {
                this.events[type] = [];
            }

            this.events[type].push(fn);

        },

        //事件触发器，在代码合适的地方调用该方法，这个方法会遍历events中的对应的事件名下的所有方法，并且依次执行。这里，我们的方法都是实例化改对象时候使用者写入的方法。
        _sendEvent: function (type) {

            if (!this.events[type]) {
                this.events[type] = [];
            }

            var l = this.events[type].length,i = 0;

            for ( ; i < l; i++) {
                this.events[type][i].apply(this,[].slice.call(arguments, 1));//保证从第一个参数传递
            }

        },

        _animate: function (destY,duration,easingFn,speed) {
            var startTime = utils.getTime(),
                self = this,
                startY = this.y,
                destTime = startTime + duration,
                time = 0;

            function stepAnimation() {
                var now = utils.getTime(),
                    newY,
                    easing;
                if ( now >= destTime ) {
                    self.isAnimating = false;

                    // INSERT POINT: _end

                    if ( destY > 0 ) {

                        time = destY / speed;
                        self.scrollTo(0, time,speed);

                    } else if (destY < -self.overHeight) {

                        time = (Math.abs(destY) - self.overHeight) / speed;
                        self.scrollTo(-self.overHeight, time,speed);

                    } else {

                        self.transform(destY);
                        self._sendEvent('scrollEnd');
                    }

                    return;
                }

                self._sendEvent("scrolling");
                now = (now - startTime) / duration;
                easing = easingFn(now);
                newY = (destY - startY) * easing + startY;
                self.transform(newY);

                self.bottomHeight = self.overHeight + self.y;

                if (self.options && self.options.scrollBar) {
                    self.changePosition();
                }

                if (self.isAnimating) {
                    rAF(stepAnimation);
                }
            }

            this.isAnimating = true;
            stepAnimation();
        },

        scrollTo: function (position,time,speed) {

            this._animate(position,time * 15,utils.ease.quadratic.fn,speed / 15);
        },

        tap: function (element,callBack) {
            var startY = 0,
                endY = 0,
                isMove = false,
                startTime = 0,
                endTime = 0,
                maxTime = 500;

            function start(e) {
                startY = e.touches[0].pageY;
                startTime = utils.getTime();
            }

            function move(e) {
                isMove = true;
            }

            function end(e) {
                endTime = utils.getTime();
                endY = e.changedTouches[0].pageY;

                if (Math.abs(endY - startY > 10)) {
                    return;
                }

                if (isMove) {
                    isMove = false;
                    return;
                }

                if (endTime - startTime > maxTime) {
                    return;
                }

                callBack();
            }

            element.addEventListener("touchstart",start,false);

            element.addEventListener("touchmove",move,false);

            element.addEventListener("touchend",end,false);

            this.on("destroy",function () {
                element.removeEventListener("touchstart",start,false);
                element.removeEventListener("touchmove",move,false);
                element.removeEventListener("touchend",end,false);
            });
        },
    };

    //工具对象
    var utils = (function () {
        var me = {};

        me.getTime =  function () {
            return Date.now() || new Date().getTime();
        };

        //计算执行动画所需的参数
        me.momentum =  function (current,startY,time,y,wrapperSize,lowerMargin) {
            var deceleration = 0.0006,
                distance = current - startY,
                speed = Math.abs(distance / time),
                data = null;

            destination = y + ( speed * speed ) / ( 2 * deceleration ) * ( distance < 0 ? -1 : 1 );
            duration = Math.round(Math.abs(speed / deceleration));

            if (destination < lowerMargin) {
                destination = wrapperSize ? lowerMargin - ( wrapperSize / 2.5 * ( speed / 8 ) ) : lowerMargin;
                distance = Math.abs(destination - y);
                duration = distance / speed;
            } else if (destination > 0) {
                destination = wrapperSize ? wrapperSize / 2.5 * ( speed / 8 ) : 0;
                distance = Math.abs(y) + destination;
                duration = distance / speed;
            }

            data = {
                destination: Math.round(destination),
                duration: duration,
                speed: speed,
            };

            return data;
        };

        me.bounce = function (current,targetY,speed) {
            var distance = Math.abs(targetY - current),
                speed = speed * .6,

            time = distance / speed;

            return {
                time: time,
                speed: speed,
            };

        };

        me.extend = function (ease,obj) {
            for (var i in obj) {
                ease[i] = obj[i];
            }
        };

        me.extend(me.ease = {}, {
            quadratic: {
                style: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                fn: function (k) {
                    return k * ( 2 - k );
                }
            },
            circular: {
                style: 'cubic-bezier(0.1, 0.57, 0.1, 1)',	// Not properly "circular" but this looks better, it should be (0.075, 0.82, 0.165, 1)
                fn: function (k) {
                    return Math.sqrt(1 - ( --k * k ));
                }
            },
            back: {
                style: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                fn: function (k) {
                    var b = 4;
                    return ( k = k - 1 ) * k * ( ( b + 1 ) * k + b ) + 1;
                }
            },
            bounce: {
                style: '',
                fn: function (k) {
                    if (( k /= 1 ) < ( 1 / 2.75 )) {
                        return 7.5625 * k * k;
                    } else if (k < ( 2 / 2.75 )) {
                        return 7.5625 * ( k -= ( 1.5 / 2.75 ) ) * k + 0.75;
                    } else if (k < ( 2.5 / 2.75 )) {
                        return 7.5625 * ( k -= ( 2.25 / 2.75 ) ) * k + 0.9375;
                    } else {
                        return 7.5625 * ( k -= ( 2.625 / 2.75 ) ) * k + 0.984375;
                    }
                }
            },
            elastic: {
                style: '',
                fn: function (k) {
                    var f = 0.22,
                        e = 0.4;

                    if (k === 0) {
                        return 0;
                    }
                    if (k == 1) {
                        return 1;
                    }

                    return ( e * Math.pow(2, -10 * k) * Math.sin(( k - f / 4 ) * ( 2 * Math.PI ) / f) + 1 );
                }
            }
        });

        return me;
    })();

    DScroll.utils = utils;

    if (typeof module != "undefined" && module.exports) {
        module.exports = DScroll;
    } else if ( typeof define == 'function' && define.amd ) {
        define( function () { return DScroll; } );
    } else {
        window.DScroll = DScroll;
    }
})(window,document,Math);
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