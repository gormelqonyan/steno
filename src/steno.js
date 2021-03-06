const utils = {
    // parz tive e te voch
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

    // gtnum e n tvic bardzr parz tivy
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
    "t": 4,
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
    "messageCompleted": function (data, i) {
        let done = true;
        for (let j = 0; j < 16 && done; j += 1) {
            done = done && (data[i + j * 4] === 255);
        }
        return done;
    }
};

export const encode = function (message, image) {
    // Handle image url
     if (image.src) {
        image = utils.loadImg(image.src);
    } else {
        throw new Error('???????????? ??????????');
    }

    let t = config.t,
        threshold = config.threshold,
        codeUnitSize = config.codeUnitSize,
        prime = 17

    if (!t || t < 1 || t > 7) throw new Error('IllegalOptions: Parameter t = " + t + " is not valid: 0 < t < 8');

    let shadowCanvas = document.createElement('canvas'),
        shadowCtx = shadowCanvas.getContext('2d');

    shadowCanvas.style.display = 'none';
    shadowCanvas.width = image.width;
    shadowCanvas.height = image.height;
    shadowCtx.drawImage(image, 0, 0);

    let imageData = shadowCtx.getImageData(0, 0, shadowCanvas.width, shadowCanvas.height),
        data = imageData.data;

    // bundlesPerChar ... Count of full t-bit-sized bundles per Character
    // overlapping ... Count of bits of the currently handled character which are not handled during each run
    // dec ... UTF-16 Unicode of the i-th character of the message
    // mask ... The raw initial bitmask, will be changed every run and if bits are overlapping

    // codeUnitSize == 16;
    // t = 4

    let bundlesPerChar = Math.floor(codeUnitSize / t),
        modMessage = [],
        decM,
        dec, mask;

    let i, j;

    // ???????????????? ?????? ?????????????????????????????????? ?? ???????? ???????? ???????????????? ?????? ????????????
    for (i = 0; i <= message.length; i += 1) {
        if (i < message.length) {
            dec = message.charCodeAt(i) || 0;
            mask = Math.pow(2, t) - 1;
            for (j = 0; j < bundlesPerChar; j += 1) {
                decM = dec & mask;
                modMessage.push(decM >> (j * t));
                mask <<= t;
            }
        }
    }

    // Write Data
    let offset, subOffset, q, qS;

    // modeMessage ?? ?????????? ???????????????? ?????? ???????????? ?? ?????????? ?????????????? ???????????????? 4 ???????? 1 ???????????? ??????
    for (offset = 0; (offset + threshold) * 4 <= data.length && (offset + threshold) <= modMessage.length; offset += threshold) {
        qS = [];
        //
        for (i = 0; i < threshold && i + offset < modMessage.length; i += 1) {
            q = 0;
            // ?????????? ?????????????? ???????????? ?????? ???????? ?????? ?????????????????? ?????? ????????????????????
            for (j = offset; j < threshold + offset && j < modMessage.length; j += 1) {
                q += modMessage[j]
                qS[i] = (255 - prime + 1) + (q % prime);
            }
        }
        // ?????????????? ???????????????????? ???????????????? ?????????????????? ?????? 3 ?????? ?????????????? 1
        for (i = offset * 4; i < (offset + qS.length) * 4 && i < data.length; i += 4) {
            data[i + 3] = qS[(i / 4) % threshold];
        }
        subOffset = qS.length;
    }

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
        modMessage = [];

    let i, done;
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
