var fs = require('fs');

// 后端服务器地址和端口
var proxyTarget = 'jx-cb-bk00.jx.baidu.com';
var proxyTargetPort = 8280; 
// mockup开关
var MOCKUP = true;
// mockup目录
var mockupDir = '/file';

exports.port = 8849;
exports.directoryIndexes = true;
exports.documentRoot = __dirname;
exports.getLocations = function () {
    return [
        { 
            location: /\/$/, 
            handler: home( 'index.html' )
        },
        { 
            location: /^\/redirect-local/, 
            handler: redirect('redirect-target', false) 
        },
        { 
            location: /^\/redirect-remote/, 
            handler: redirect('http://www.baidu.com', false) 
        },
        { 
            location: /^\/redirect-target/, 
            handler: content('redirectd!') 
        },
        { 
            location: '/empty', 
            handler: empty() 
        },
        { 
            location: /^\/api\/.*$/, 
            handler: [
                function(context) {
                    var pathname = context.request.pathname;
                    var method = context.request.method;
                    var conf = context.conf;
                    var docRoot  = conf.documentRoot;
                    var prefix = docRoot + mockupDir + pathname.replace(/^\/api/, '');
                    var filePath = prefix;
                    // /api开始的请求使用mockup
                    if (MOCKUP) {
                        addJSONSuffix();
                        if (!fs.existsSync(filePath)) {
                        }
                        console.log('[MOCKUP]', pathname, '[' + method + ']', ' --> ', filePath);
                    }
                    file(filePath)(context);
                    
                    function addJSONSuffix() {
                        if (!/\.\w+$/.test(pathname)) {
                            filePath += '.json';
                            context.header[ 'Content-Type' ] = 'application/json';
                        }
                    }
                },
                require('./localMock'),
                function(context) {
                    if (context.status == 404) {
                        proxy(proxyTarget, proxyTargetPort)(context);
                    }
                }
            ]
        },
        { 
            location: /^.*$/, 
            handler: [
                file()
            ]
        }
    ];
};

exports.injectResource = function ( res ) {
    for ( var key in res ) {
        global[ key ] = res[ key ];
    }
};
