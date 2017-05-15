var through2 = require('through2');

// pass config object as an argument to the function if needed
module.exports = function() {
    var stream = through2.obj(function(chunk, encoding, callback) {
        var parsed;
        var stringified;
        try {
            if (typeof chunk === 'string') {
                parsed = JSON.parse(chunk);
                stringified = chunk;
            } else {
                parsed = chunk;
                stringified = JSON.stringify(chunk);
            }
            this.push(parsed.time);
            this.push(' ');
            this.push(stringified);
            callback();
        } catch (e) {
            callback(e);
        }
    });
    stream.pipe(process.stdout);
    return stream;
};
