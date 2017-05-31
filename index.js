var through2 = require('through2');
var levels = {10: 'TRACE', 20: 'DEBUG', 30: 'INFO', 40: 'WARN', 50: 'ERROR', 60: 'FATAL'};
// pass config object as an argument to the function if needed
module.exports = function(config) {
    var skip = {};
    if (Array.isArray(config.skip)) {
        config.skip.forEach(function(method) {
            skip[method] = true;
        });
    }
    var stream = through2.obj(function(chunk, encoding, callback) {
        var parsed;
        var stringified;
        var $meta;
        var method;
        var l1pTraceId;
        try {
            if (typeof chunk === 'string') {
                parsed = JSON.parse(chunk);
                stringified = chunk;
            } else {
                parsed = chunk;
                stringified = JSON.stringify(chunk);
            }
        } catch (e) {
            parsed = {};
        }
        $meta = parsed.$meta;
        if (!$meta) {
            return callback();
        }
        method = $meta.method || parsed.msg;
        if (!method || skip[method]) {
            return callback();
        }
        this.push(parsed.time + ' ' + levels[parsed.level]);
        l1pTraceId = $meta['L1p-Trace-Id'] ||
                    ($meta.requestHeaders && $meta.requestHeaders['l1p-trace-id']) ||
                    (parsed.headers && parsed.headers['L1p-Trace-Id']) ||
                    (parsed.message && parsed.message.headers && parsed.message.headers['L1p-Trace-Id']);
        if (l1pTraceId) {
            this.push(' L1p-Trace-Id=' + l1pTraceId);
        }
        if ($meta.mtid) {
            this.push(' mtid=' + $meta.mtid);
        }
        this.push(' method=' + method + ' payload=' + stringified);
        if (config.metrics && $meta.timeTaken) {
            this.push('\n' + parsed.time + ' ' + levels[parsed.level]);
            this.push(' L1P_METRIC_TIMER:[' + method + '][' + $meta.timeTaken + ']\n');
        }
        callback();
    });
    stream.pipe(process.stdout);
    return stream;
};
