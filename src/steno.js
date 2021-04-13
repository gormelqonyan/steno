const utils = {
    "isPrime": function (n) {
        if (isNaN(n) || !isFinite(n) || n % 1 || n < 2) return false;
        if (n % 2 === 0) return (n === 2);
        if (n % 3 === 0) return (n === 3);
        let m = Math.sqrt(n);
        for (let i = 5; i <= m; i += 6) {
            if (n % i === 0) return false;
            if (n % (i + 2) === 0) return false;
        }
        return true;
    },
    "findNextPrime": function (n) {
        for (let i = n; true; i += 1)
            if (utils.isPrime(i)) return i;
    },
    "sum": function (func, end, options) {
        let sum = 0;
        options = options || {};
        for (let i = options.start || 0; i < end; i += (options.inc || 1))
            sum += func(i) || 0;

        return (sum === 0 && options.defValue ? options.defValue : sum);
    },
    "product": function (func, end, options) {
        let prod = 1;
        options = options || {};
        for (let i = options.start || 0; i < end; i += (options.inc || 1))
            prod *= func(i) || 1;

        return (prod === 1 && options.defValue ? options.defValue : prod);
    },
    "createArrayFromArgs": function (args, index, threshold) {
        let ret = new Array(threshold - 1);
        for (let i = 0; i < threshold; i += 1)
            ret[i] = args(i >= index ? i + 1 : i);

        return ret;
    },
    "loadImg": function (url) {
        let image = new Image();
        image.src = url;
        return image;
    }
};

export const config = {
    "t": 3,
    "threshold": 1,
    "codeUnitSize": 16,
    "args": function (i) {
        return i + 1;
    },
    "messageDelimiter": function (modMessage, threshold) {
        let delimiter = new Array(threshold * 3);
        for (let i = 0; i < delimiter.length; i += 1)
            delimiter[i] = 255;

        return delimiter;
    },
    "messageCompleted": function (data, i, threshold) {
        let done = true;
        for (let j = 0; j < 16 && done; j += 1) {
            done = done && (data[i + j * 4] === 255);
        }
        return done;
    }
};
export const getHidingCapacity = function (image, options) {
    options = options || {};

    let width = options.width || image.width,
        height = options.height || image.height,
        t = options.t || config.t,
        codeUnitSize = options.codeUnitSize || config.codeUnitSize;
    return t * width * height / codeUnitSize >> 0;
};
export const encode = function (message, image, options) {
    // Handle image url
    if (image.length) {
        image = utils.loadImg(image);
    } else if (image.src) {
        image = utils.loadImg(image.src);
    } else if (!(image instanceof HTMLImageElement)) {
        throw new Error('IllegalInput: The input image is neither an URL string nor an image.');
    }

    options = options || {};

    let t = options.t || config.t,
        threshold = options.threshold || config.threshold,
        codeUnitSize = options.codeUnitSize || config.codeUnitSize,
        prime = utils.findNextPrime(Math.pow(2, t)),
        args = options.args || config.args,
        messageDelimiter = options.messageDelimiter || config.messageDelimiter;

    if (!t || t < 1 || t > 7) throw new Error('IllegalOptions: Parameter t = " + t + " is not valid: 0 < t < 8');

    let shadowCanvas = document.createElement('canvas'),
        shadowCtx = shadowCanvas.getContext('2d');

    shadowCanvas.style.display = 'none';
    shadowCanvas.width = options.width || image.width;
    shadowCanvas.height = options.height || image.height;
    if (options.height && options.width) {
        shadowCtx.drawImage(image, 0, 0, options.width, options.height);
    } else {
        shadowCtx.drawImage(image, 0, 0);
    }

    let imageData = shadowCtx.getImageData(0, 0, shadowCanvas.width, shadowCanvas.height),
        data = imageData.data;

    // bundlesPerChar ... Count of full t-bit-sized bundles per Character
    // overlapping ... Count of bits of the currently handled character which are not handled during each run
    // dec ... UTF-16 Unicode of the i-th character of the message
    // curOverlapping ... The count of the bits of the previous character not handled in the previous run
    // mask ... The raw initial bitmask, will be changed every run and if bits are overlapping
    let bundlesPerChar = codeUnitSize / t >> 0,
        overlapping = codeUnitSize % t,
        modMessage = [],
        decM, oldDec, oldMask, left, right,
        dec, curOverlapping, mask;

    let i, j;

    for (i = 0; i <= message.length; i += 1) {
        dec = message.charCodeAt(i) || 0;
        curOverlapping = (overlapping * i) % t;
        if (curOverlapping > 0 && oldDec) {
            // Mask for the new character, shifted with the count of overlapping bits
            mask = Math.pow(2, t - curOverlapping) - 1;
            // Mask for the old character, i.e. the t-curOverlapping bits on the right
            // of that character
            oldMask = Math.pow(2, codeUnitSize) * (1 - Math.pow(2, -curOverlapping));
            left = (dec & mask) << curOverlapping;
            right = (oldDec & oldMask) >> (codeUnitSize - curOverlapping);
            modMessage.push(left + right);

            if (i < message.length) {
                mask = Math.pow(2, 2 * t - curOverlapping) * (1 - Math.pow(2, -t));
                for (j = 1; j < bundlesPerChar; j += 1) {
                    decM = dec & mask;
                    modMessage.push(decM >> (((j - 1) * t) + (t - curOverlapping)));
                    mask <<= t;
                }
                if ((overlapping * (i + 1)) % t === 0) {
                    mask = Math.pow(2, codeUnitSize) * (1 - Math.pow(2, -t));
                    decM = dec & mask;
                    modMessage.push(decM >> (codeUnitSize - t));
                } else if (((((overlapping * (i + 1)) % t) + (t - curOverlapping)) <= t)) {
                    decM = dec & mask;
                    modMessage.push(decM >> (((bundlesPerChar - 1) * t) + (t - curOverlapping)));
                }
            }
        } else if (i < message.length) {
            mask = Math.pow(2, t) - 1;
            for (j = 0; j < bundlesPerChar; j += 1) {
                decM = dec & mask;
                modMessage.push(decM >> (j * t));
                mask <<= t;
            }
        }
        oldDec = dec;
    }

    // Write Data
    let offset, index, subOffset, delimiter = messageDelimiter(modMessage, threshold),
        q, qS;
    for (offset = 0; (offset + threshold) * 4 <= data.length && (offset + threshold) <= modMessage.length; offset += threshold) {
        qS = [];
        for (i = 0; i < threshold && i + offset < modMessage.length; i += 1) {
            q = 0;
            for (j = offset; j < threshold + offset && j < modMessage.length; j += 1)
                q += modMessage[j] * Math.pow(args(i), j - offset);
            qS[i] = (255 - prime + 1) + (q % prime);
        }
        for (i = offset * 4; i < (offset + qS.length) * 4 && i < data.length; i += 4)
            data[i + 3] = qS[(i / 4) % threshold];

        subOffset = qS.length;
    }
    // Write message-delimiter
    for (index = (offset + subOffset); index - (offset + subOffset) < delimiter.length && (offset + delimiter.length) * 4 < data.length; index += 1)
        data[(index * 4) + 3] = delimiter[index - (offset + subOffset)];
    // Clear remaining data
    for (i = ((index + 1) * 4) + 3; i < data.length; i += 4) data[i] = 255;

    Object.defineProperty(imageData, "data", {writable: true});
    imageData.data = data;
    shadowCtx.putImageData(imageData, 0, 0);

    return shadowCanvas.toDataURL();
};

export const decode = function (image, options) {
    // Handle image url
    if (image.length) {
        image = utils.loadImg(image);
    } else if (image.src) {
        image = utils.loadImg(image.src);
    } else if (!(image instanceof HTMLImageElement)) {
        throw new Error('IllegalInput: The input image is neither an URL string nor an image.');
    }

    options = options || {};

    let t = options.t || config.t,
        threshold = options.threshold || config.threshold,
        codeUnitSize = options.codeUnitSize || config.codeUnitSize,
        prime = utils.findNextPrime(Math.pow(2, t)),
        args = options.args || config.args,
        messageCompleted = options.messageCompleted || config.messageCompleted;

    if (!t || t < 1 || t > 7) throw new Error('IllegalOptions: Parameter t = " + t + " is not valid: 0 < t < 8');

    let shadowCanvas = document.createElement('canvas'),
        shadowCtx = shadowCanvas.getContext('2d');

    shadowCanvas.style.display = 'none';
    shadowCanvas.width = options.width || image.width;
    shadowCanvas.height = options.width || image.height;
    if (options.height && options.width) {
        shadowCtx.drawImage(image, 0, 0, options.width, options.height);
    } else {
        shadowCtx.drawImage(image, 0, 0);
    }

    let imageData = shadowCtx.getImageData(0, 0, shadowCanvas.width, shadowCanvas.height),
        data = imageData.data,
        modMessage = [],
        q;

    let i, k, done;
    if (threshold === 1) {
        for (i = 3, done = false; !done && i < data.length && !done; i += 4) {
            done = messageCompleted(data, i, threshold);
            if (!done) modMessage.push(data[i] - (255 - prime + 1));
        }
    }

    let message = "", charCode = 0, bitCount = 0, mask = Math.pow(2, codeUnitSize) - 1;
    for (i = 0; i < modMessage.length; i += 1) {
        charCode += modMessage[i] << bitCount;
        bitCount += t;
        if (bitCount >= codeUnitSize) {
            message += String.fromCharCode(charCode & mask);
            bitCount %= codeUnitSize;
            charCode = modMessage[i] >> (t - bitCount);
        }
    }
    if (charCode !== 0) message += String.fromCharCode(charCode & mask);

    return message;
};
