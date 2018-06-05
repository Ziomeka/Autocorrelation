self.addEventListener('message', function(e) {
    let dane = JSON.parse(e.data);

    function sum(x) {
        let sum = 0;
        x.forEach(function(i) { sum += i });
        return sum;
    }

    function avg(x) {
        return sum(x) / x.length;
    }

    function stdev(x) {
        let av = avg(x),
            sum = 0;
        x.forEach(function(i) { sum = sum + Math.pow((i - av), 2) });
        return Math.sqrt(sum / (x.length));
    }

    function prod(x, y) {
        let prod = [];
        for (let i = 0; i < x.length; i++) {
            prod[i] = x[i] * y[i];
        }
        if (x.length === y.length) {
            return prod;
        } else return -1;
    }

    function corr(x, y) {
        return (avg(prod(x, y)) - (avg(x) * avg(y))) / (stdev(x) * stdev(y));
    }

    function shiftLeft(x, lag) {
        let y = [];
        for (let i = 0; i < x.length - lag; i++) {
            y[i] = x[i + lag];
        }
        return y;
    }

    function shiftRight(x, lag) {
        let y = [];
        for (let i = 0; i < x.length - lag; i++) {
            y[i] = x[i];
        }
        return y;
    }

    function autocorr(x, lag) {
        let autoCorr = [],
            y1 = [],
            y2 = [];
        let len = x.length - lag;
        for (let i = 0; i < lag; i++) {
            y1 = shiftLeft(x, i);
            y2 = shiftRight(x, i);
            autoCorr[i] = corr(y1, y2);
        }
        return autoCorr;
    }

    function averaging(x, step) {
        let temp = [];
        let wynik = [];
        let num = Math.floor(x.length / step);
        for (let i = 0; i < step; i++) {
            temp[i] = [];
            for (let j = 0; j < num; j++) {
                temp[i][j] = x[i + j * step];
            }
        }
        for (let i = 0; i < step; i++) {
            wynik[i] = avg(temp[i]);
        }
        return wynik;
    }

    if (dane.autocorrelationStep === true) {
        self.postMessage("PROCESSING_AUTOCORRELATION");
        dane.autocoerelationData = autocorr(dane.rawData, dane.lag);
        self.postMessage(JSON.stringify(dane));
    }
    if (dane.averagingStep === true) {
        self.postMessage("PROCESSING_AVERAGING");
        dane.averagedData = averaging(dane.rawData, dane.step);
        console.log(dane.averagedData)
        self.postMessage(JSON.stringify(dane));
    }
});