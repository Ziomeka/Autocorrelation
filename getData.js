self.addEventListener('message', function(e) {
    const FILE_TYPE = "text.csv";
    let file = e.data;
    let textFile = '';
    let fileData = [];
    self.postMessage('FILE_LOADING_STARTED');
    if (file.type.match(FILE_TYPE)) {
        var reader = new FileReaderSync();
        textFile = reader.readAsText(file);
        textFile = textFile.replace(/\r?\n/g, ',');
        //console.log(textFile);
        //console.log(dataCsvValidation(textFile));
        if (dataCsvValidation(textFile)) {
            fileData = textFile.split(",");
            for (let i = 0; i < fileData.length; i++) {
                fileData[i] = parseFloat(fileData[i]);
            }
            self.postMessage(fileData);
        } else {
            self.postMessage('FILE_ERROR');
        }
    } else {
        self.postMessage('FILE_TYPE_ERROR');
    }
});

function dataCsvValidation(data) {
    let valid = true;
    let aviableChars = '1234567890-,.E';
    for (let i = 0; i <= data.length; i++) {
        if (!aviableChars.includes(data.charAt(i))) {
            console.log('Failed: ' + data.charAt(i));
            valid = false;
        }
    }
    return valid;
}