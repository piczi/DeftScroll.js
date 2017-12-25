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