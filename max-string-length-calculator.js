// Credit to https://stackoverflow.com/users/5108418/tamas-hegedus for the original code snippet
// Source: https://stackoverflow.com/a/34958490
// Modified Code a bit.
// This code will be used for debug info.

function alloc(x) {
    if (x < 1) return '';
    var halfi = Math.floor(x/2);
    var half = alloc(halfi);
    return 2*halfi < x ? half + half + 'a' : half + half;
}

function test(x) {
    try {
        return alloc(x);
    } catch (e) {
        return null;
    }
}

function binsearch(predicateGreaterThan, min, max) {
    while (max > min) {
        var mid = Math.floor((max + min) / 2);
        var val = predicateGreaterThan(mid);
        if (val) {
            min = mid + 1;
        } else {
            max = mid;
        }
    }
    return max;
}

var maxStrLen = binsearch(test, 10, Math.pow(2, 52)) - 1;
console.debug('Max string length is:');
console.debug(maxStrLen + ' characters');
console.debug(2*maxStrLen + ' bytes');
console.debug(2*maxStrLen/1024/1024 + ' megabytes');
console.debug('');
console.debug('Store longest string');
window.LONGEST_STRING = alloc(maxStrLen);

console.debug('Try to read first char');
console.debug(window.LONGEST_STRING.charAt(0));
console.debug('Try to read last char');
console.debug(window.LONGEST_STRING.charAt(maxStrLen - 1));
console.debug('Try to read length');
console.debug(window.LONGEST_STRING.length);
