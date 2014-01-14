var fs = require('fs');
var path = require('path');

/**
 * 默认的url --> 本地路径无法覆盖的规则，写在这里
 * 格式：[{}, {}...]
 * 每个item有location和handler两个属性:
 *  location支持正则、字符串，函数;
 *  handler支持函数、对象和字符串，字符串表示文件名
 */
var ruleList = [
    {
        location: /api\/\w+\/update/,
        handler: {
            success: true,
            message: '更新成功！'
        }
    },
    {
        location: /api\/\w+\/create/,
        handler: {
            success: true,
            message: '创建成功！'
        }
    },
    {
        location: '/test/whatever',
        handler: 'account.js'
    }
];

module.exports = exports = function (context) {
    if (context.status != 404) {
        return;
    }
    var request = context.request;
    var url = request.url;
    var content;
    var target;

    context.stop();

    if (ruleList instanceof Array) {
        for (var i = 0, len = ruleList.length; i < len; i++) {
            var item = ruleList[i];
            var location = item.location;

            if ( 
                (location instanceof RegExp && location.test(url))
                || (typeof location == 'string' && url.indexOf(location) > -1)
                || (typeof location == 'function' && location(request))
            ) {
                var handler = item.handler;
                if (typeof handler === 'string') {
                    var filePath = path.resolve(__dirname, handler);
                    if (fs.existsSync(filePath)) {
                        content = fs.readFileSync(filePath);
                        target = filePath;
                    }
                }
                else if (typeof handler === 'object') {
                    content = JSON.stringify(handler);
                    target = '[Object]';
                }
                else if (typeof handler === 'function') {
                    content = handler(context);
                    target = '[Function]';
                }
                if (content) {
                    context.status = 200;
                    context.content = content;
                    console.log('[RULE]', request.pathname, ' --> ', target);
                    break;
                }
            }
        }
    }
    if (!content) {
        context.status = 404;
    }
    context.start();
}
