window.onload = function() {
    const BEFORE_LOAD = 1,
        FILE_LOADING_STARTED = 2,
        FILE_LOADED = 3,
        FILE_TYPE_ERROR = 4,
        FILE_ERROR = 5,
        SAMPLE_DATA_LOADED = 6,
        NOTHING_DONE = 0,
        AUTOCORR_DONE = 1,
        AVERAGE_DONE = 2;


    let state = BEFORE_LOAD,
        algorithmState = NOTHING_DONE,
        fileInput = document.getElementById('fileInput'),
        sampleFile = document.getElementById('sampleFile'),
        fileDisplayArea = document.getElementById('upload-file-info'),
        lag = document.getElementById('lag'),
        lagValue = document.getElementById('lagValue'),
        stepValue = document.getElementById('stepValue'),
        run = document.getElementById('run'),
        runAvg = document.getElementById('runAvg'),
        dane = {
            rawData: [],
            autocoerelationData: [],
            averagedData: [],
            autocorrelationStep: false,
            averagingStep: false,
            lag: 0,
            step: 0
        };


    //Wczytywanie pliku z dysku
    var dataFromFile = new Worker('getData.js');
    dataFromFile.addEventListener('message', function(e) {
        if (e.data === 'FILE_LOADING_STARTED') {
            state = FILE_LOADING_STARTED;
            redrawFileLoaderUI();
        } else if (e.data === 'FILE_TYPE_ERROR') {
            state = FILE_TYPE_ERROR;
            redrawFileLoaderUI();
        } else if (e.data === 'FILE_ERROR') {
            state = FILE_ERROR;
            redrawFileLoaderUI();
        } else {
            state = FILE_LOADED;
            dane.rawData = e.data;
            redrawFileLoaderUI();
        }
    });

    function getFile(e) {
        var file = fileInput.files[0];
        dataFromFile.postMessage(file);
    }

    //Wczytanie danych przykładowych
    var dataFromSample = new Worker('sampleData.js');
    dataFromSample.addEventListener('message', function(e) {
        state = SAMPLE_DATA_LOADED;
        dane.rawData = e.data;
        redrawFileLoaderUI();
    });

    function getSampleData(e) {
        let drop = document.getElementById('sampleFileDropDown');
        let val = drop.options[drop.selectedIndex].value;
        dataFromSample.postMessage(val);
        return false;
    }

    //Wyświelanie bloku wczytwania pliku
    function redrawFileLoaderUI() {
        switch (state) {
            case BEFORE_LOAD:
                fileDisplayArea.innerHTML = "No file loaded";
                break;
            case FILE_LOADING_STARTED:
                fileDisplayArea.innerHTML = "Loading";
                break;
            case FILE_TYPE_ERROR:
                fileDisplayArea.innerHTML = "Sorry, csv files only";
                break;
            case FILE_ERROR:
                fileDisplayArea.innerHTML = "Illegal chracter only numbers allowed. Data loading failed";
                break;
            case FILE_LOADED:
                fileDisplayArea.innerHTML = "File " + fileInput.files[0].name + " loaded<br> Data length: " + dane.rawData.length;
                run.disabled = false;
                lag.style.display = 'block';
                lagValue.setAttribute("value", Math.floor(dane.rawData.length / 3));
                break;
            case SAMPLE_DATA_LOADED:
                fileDisplayArea.innerHTML = "Sample file loaded: <br> Data length: " + dane.rawData.length;
                run.disabled = false;
                lag.style.display = 'block';
                lagValue.setAttribute("value", Math.floor(dane.rawData.length / 3));
                break;
        }
    }

    //Obliczenia autocorelacji
    var aurocorr = new Worker('autocorr.js');
    aurocorr.addEventListener('message', function(e) {
        if (e.data === "PROCESSING_AUTOCORRELATION") {
            $('#chart1').html('<h1>Processing please wait</h1>');
            $('#chart2').html('');
            $('.button-reset')[0].style.display = "none";
            $('#averaging')[0].style.display = "none";

        } else if (e.data === "PROCESSING_AVERAGING") {
            $('#chart3').html('<h1>Processing average please wait</h1>');
        } else {
            dane = JSON.parse(e.data);
            displayOutcome();
        }
    });

    function resultAutocorr() {
        dane.autocoerelationData = [];
        dane.autocorrelationStep = true;
        dane.averagingStep = false;
        dane.lag = lagValue.value;
        aurocorr.postMessage(JSON.stringify(dane));
        dane.autocorrelationStep = false;
        algorithmState = AUTOCORR_DONE;
    }

    function resultAverageing() {
        dane.step = stepValue.value;
        dane.averagedData = [];
        dane.autocorrelationStep = false;
        dane.averagingStep = true;
        aurocorr.postMessage(JSON.stringify(dane));
        algorithmState = AVERAGE_DONE;
    }


    //Wyświetlanie wyniku
    $.jqplot.config.enablePlugins = true;
    $.jqplot._noToImageButton = true;

    function displayOutcome() {
        if (algorithmState === AUTOCORR_DONE) {
            $('#chart1').html(' ');
            $('#chart2').html(' ');
            $('.button-reset')[0].style.display = "inline";
            var plot1 = $.jqplot('chart1', [dane.rawData], {
                title: 'Dane wejściowe',
                axesDefaults: { labelRenderer: $.jqplot.CanvasAxisLabelRenderer },
                axes: {
                    xaxis: {
                        label: "Sample number",
                        pad: 0
                    },
                    yaxis: {
                        label: "Y Axis",
                    }
                },
                seriesDefaults: {
                    rendererOptions: {
                        smooth: true
                    },
                    markerOptions: { size: 0, style: "x" }
                },
                cursor: {
                    zoom: true,
                    looseZoom: true,
                    constrainOutsideZoom: false
                }

            });

            var plot2 = $.jqplot('chart2', [dane.autocoerelationData], {
                title: 'Autokorelacja',
                axesDefaults: { labelRenderer: $.jqplot.CanvasAxisLabelRenderer },
                axes: {
                    xaxis: {
                        label: "Sample number",
                        pad: 0
                    },
                    yaxis: {
                        label: "Y Axis",
                        max: 1
                    }
                },
                seriesDefaults: {
                    rendererOptions: {
                        smooth: true
                    },
                    markerOptions: { size: 0, style: "x" }
                },
                cursor: {
                    zoom: true,
                    looseZoom: true,
                    constrainOutsideZoom: false
                }
            });
            $('.button-reset').click(function() {
                plot1.resetZoom();
                plot2.resetZoom()
            });
            $('#averaging')[0].style.display = "block";
            $('#chart3').html('');
        }
        if (algorithmState === AVERAGE_DONE) {
            $('#chart3').html('');
            var plot3 = $.jqplot('chart3', [dane.averagedData], {
                title: 'Averaged data - one period',
                axesDefaults: { labelRenderer: $.jqplot.CanvasAxisLabelRenderer },
                axes: {
                    xaxis: {
                        label: "Sample number",
                        pad: 0
                    },
                    yaxis: {
                        label: "Y Axis",
                    }
                },
                seriesDefaults: {
                    rendererOptions: {
                        smooth: true
                    },
                    markerOptions: { size: 0, style: "x" }
                },
                cursor: {
                    zoom: true,
                    looseZoom: true,
                    constrainOutsideZoom: false
                }

            });
        }
    }

    // Program
    if (!(window.File && window.FileList && window.FileReader && window.Blob && typeof(Worker) !== "undefined")) {
        document.getElementById('chageBrowser').style.display = "block";
    }
    redrawFileLoaderUI();

    fileInput.addEventListener('change', getFile);
    sampleFile.addEventListener('click', getSampleData);
    run.addEventListener('click', resultAutocorr);
    runAvg.addEventListener('click', resultAverageing);

}