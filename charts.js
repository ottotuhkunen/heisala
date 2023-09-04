let chartUpdateInterval;

function normalView() {
    document.getElementById("mainContainer").style.display = "block";
    document.getElementById("chartsContainer").style.display = "none";
    document.getElementById("tableDiv").style.display = "none";

    // buttons
    document.getElementById("airfieldViewButton").classList.add("topNavActive");
    document.getElementById("chartButton").classList.remove("topNavActive");
    document.getElementById("forecastButton").classList.remove("topNavActive");
    document.getElementById("cameraButton").classList.remove("topNavActive");

    // Stop updating charts
    clearInterval(chartUpdateInterval);
}
function chartDisplay() {
    document.getElementById("mainContainer").style.display = "none";
    document.getElementById("chartsContainer").style.display = "flex";
    document.getElementById("tableDiv").style.display = "none";

    // buttons
    document.getElementById("airfieldViewButton").classList.remove("topNavActive");
    document.getElementById("chartButton").classList.add("topNavActive");
    document.getElementById("forecastButton").classList.remove("topNavActive");
    document.getElementById("cameraButton").classList.remove("topNavActive");

    // initial load charts
    loadCharts();

    // charts update every 60 seconds
    chartUpdateInterval = setInterval(() => {
        loadCharts();
    }, 60000);
}

function forecastDisplay() {
    document.getElementById("mainContainer").style.display = "none";
    document.getElementById("chartsContainer").style.display = "none";
    document.getElementById("forecastButton").classList.add("topNavActive");
    document.getElementById("tableDiv").style.display = "block";

    // buttons
    document.getElementById("airfieldViewButton").classList.remove("topNavActive");
    document.getElementById("chartButton").classList.remove("topNavActive");
    document.getElementById("cameraButton").classList.remove("topNavActive");

    loadForecast();

    // Stop updating charts
    clearInterval(chartUpdateInterval);
}

function cameraDisplay() {
    
    // Stop updating charts
    clearInterval(chartUpdateInterval);
}

async function loadCharts() {
    try {
      const response = await fetch('https://opendata.fmi.fi/wfs?service=WFS&version=2.0.0&request=getFeature&storedquery_id=fmi::observations::weather::simple&fmisid=100908');
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      } else {
        const responseText = await response.text();
        const parser = new DOMParser();
        const data = parser.parseFromString(responseText, "application/xml");
        initializeChart(data);
        loadWaterTemp();
      }
    } catch (error) {
      console.log('Fetch API error -', error);
    }
}

function initializeChart(xmlDoc) {
    var xmlElements = xmlDoc.getElementsByTagName("wfs:member");
    var windDirectionData = [];
    var windSpeedData = [];
    var windGustData = [];
    var tempData = [];
    var dewData = [];
    var humidityData = [];
    var qnhData = [];
    var visibilityData = [];

    for (var i = 0; i < xmlElements.length; i++) {
        var parameterName = xmlElements[i].getElementsByTagName("BsWfs:ParameterName")[0].textContent;
        var parameterValue = parseFloat(xmlElements[i].getElementsByTagName("BsWfs:ParameterValue")[0].textContent);
        var time = new Date(xmlElements[i].getElementsByTagName("BsWfs:Time")[0].textContent).getTime();
        var localTime = convertToUserTime(time);

        // wind direction
        if (parameterName === "wd_10min") {
            windDirectionData.push([localTime, parameterValue]);
        }
        // wind speed
        if (parameterName === "ws_10min") {
            windSpeedData.push([localTime, parameterValue]);
        }
        // wind gust
        if (parameterName === "wg_10min") {
            windGustData.push([localTime, parameterValue]);
        }
        // temperature
        if (parameterName === "t2m") {
            tempData.push([localTime, parameterValue]);
        }
        // dewpoint
        if (parameterName === "td") {
            dewData.push([localTime, parameterValue]);
        }
        // humidity
        if (parameterName === "rh") {
            humidityData.push([localTime, parameterValue]);
        }
        // qnh
        if (parameterName === "p_sea") {
            qnhData.push([localTime, parameterValue]);
        }
        // visibility
        if (parameterName === "vis") {
            //if (parameterValue > 16000) parameterValue = 16000;
            visibilityData.push([localTime, parameterValue]);
        }
    }
    
    var minTime2 = new Date().getTime() - 8200000;

    // wind direction
    const plotDirections = $.plot("#windDirectionChart", [
        {
            data: windDirectionData,
            lines: { show: true },
            points: { show: false },
            color: "#3495e5",
            label: "Tuulen suunta AVG",
            yaxis: 1
        },
        {
            data: [[null, null]],
            lines: { show: false },
            points: { show: false },
            yaxis: 2
        }
    ], {
        xaxis: {
            mode: "time",
            timeformat: "%H:%M",
            min: minTime2,
            tickSize: [30, "minute"]
        },
        yaxes: [
            {
                ticks: [
                    [0, "N"],
                    [45, "NE"],
                    [90, "E"],
                    [135, "SE"],
                    [180, "S"],
                    [225, "SW"],
                    [270, "W"],
                    [315, "NW"],
                    [360, "N"]
                ],
                tickFormatter: (v, axis) => {
                    return `${v.toFixed(0).padStart(3, '0')} (${axis.ticks.find(t => t[0] === v)[1]})`;
                }
            },
            { 
                position: "right",
                min: 0,
                max: 360,
                ticks: [
                    [0, "0°"],
                    [90, "90°"],
                    [180, "180°"],
                    [270, "270°"],
                    [360, "360°"]
                ]
            }
        ],
        legend: {
            show: true,
            position: "nw",
        },
        grid: {
            borderWidth: 1
        }
    });

    // wind speed
    const plotSpeeds = $.plot("#windSpeedChart", [
        {
            data: windSpeedData,
            lines: { show: true },
            points: { show: false },
            color: "#3495e5",
            label: "Keskituuli"
        },
        {
            data: windGustData,
            lines: { show: true },
            points: { show: false },
            color: "gray",
            label: "Puuskat"
        }
    ], {
        xaxis: {
            mode: "time",
            timeformat: "%H:%M",
            min: minTime2,
            tickSize: [30, "minute"]
        },
        yaxis: {
            position: "right",
            tickFormatter: function (val, axis) {
                return Math.round(val) + " m/s";
            }
        },
        legend: {
            show: true,
            position: "nw"
        },
        grid: {
            borderWidth: 1
        }
    });
    

    // temperature, dewpoint and humidity
    const plotTemperatures = $.plot("#temperaturesChart", [
        {
            data: tempData,
            lines: { show: true },
            points: { show: false },
            color: "#3495e5",
            label: "Lämpötila",
            yaxis: 1
        },
        {
            data: dewData,
            lines: { show: true },
            points: { show: false },
            color: "#2b4c70",
            label: "Kastepiste",
            yaxis: 1
        },
        {
            data: humidityData,
            lines: { show: false },
            points: { show: true, fillColor: "gray", lineWidth: 0, radius: 1 },
            color: "gray",
            label: "Kosteus %",
            yaxis: 2
        }
    ], {
        xaxis: {
            mode: "time",
            timeformat: "%H:%M",
            min: minTime2,
            tickSize: [30, "minute"]
        },
        yaxes: [
            {
                tickFormatter: function (val, axis) {
                    return Math.round(val) + "°C";
                }
            },
            { 
                position: "right",
                min: 0,
                max: 100,
                axisLabel: "Ilman kosteus [%]",
                axisLabelUseCanvas: true,
                axisLabelFontSizePixels: 12,
                axisLabelPadding: 5,
                axisLabelAngle: 90,
                axisLabelColor: "white"
            }
        ],
        legend: {
            show: true,
            position: "nw"
        },
        grid: {
            borderWidth: 1
        }
    });

    // qnh
    const plotQnh = $.plot("#qnhChart", [{
        data: qnhData,
        lines: { show: true },
        points: { show: true, fillColor: "green", lineWidth: 0, radius: 1.5 },
        shadowSize: 0,
        label: "Ilmanpaine",
        color: "green"
    }], {
        xaxis: {
            mode: "time",
            timeformat: "%H:%M",
            timezone: "UTC",
            min: minTime2,
            tickSize: [30, "minute"]
        },
        yaxis: {
            position: "right",
        },
        legend: {
            show: true,
            position: "nw"
        },
        grid: {
            borderWidth: 1
        }
    });

    let maxVisibility = Math.max.apply(Math, visibilityData.map((item) => item[1]));

    // generate visibility ticks dynamically
    let ticks = [];
    if (maxVisibility <= 2000) {
        // Use 200m intervals if the max visibility is 2km or less
        for (let i = 0; i <= maxVisibility; i += 200) {
            ticks.push([i, i + " m"]);
        }
    } else if (maxVisibility <= 10000) {
        // Use 1km intervals if the max visibility is between 2km and 10km
        for (let i = 0; i <= maxVisibility; i += 1000) {
            ticks.push([i, i/1000 + " km"]);
        }
    } else {
        // Use 5km intervals if the max visibility is above 10km
        for (let i = 0; i <= maxVisibility; i += 10000) {
            ticks.push([i, i/1000 + " km"]);
        }
    }

    // visibility
    const plotVisibility = $.plot("#visibilityChart", [{
        data: visibilityData,
        lines: { show: true },
        points: { show: true, fillColor: "#3495e5", lineWidth: 0, radius: 1.5 },
        shadowSize: 0,
        label: "Näkyvyys 10min",
        color: "#3495e5"
    }], {
        xaxis: {
            mode: "time",
            timeformat: "%H:%M",
            timezone: "UTC",
            min: minTime2,
            tickSize: [30, "minute"]
        },
        yaxis: {
            ticks: ticks,
            position: "right"
        },
        legend: {
            show: true,
            position: "nw"
        },
        grid: {
            borderWidth: 1
        }
    });
}

async function loadWaterTemp() {
    try {
      const response = await fetch('https://opendata.fmi.fi/wfs?service=WFS&version=2.0.0&request=getFeature&storedquery_id=fmi::observations::wave::daily::simple&fmisid=654923');
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      } else {
        const responseText = await response.text();
        const parser = new DOMParser();
        const data = parser.parseFromString(responseText, "application/xml");
        initializeChart2(data);
      }
    } catch (error) {
      console.log('Fetch API error -', error);
    }
}

function initializeChart2(xmlDoc) {
    var xmlElements = xmlDoc.getElementsByTagName("wfs:member");
    var waterTempMin = [];
    var waterTempAvg = [];
    var waterTempMax = [];

    for (var i = 0; i < xmlElements.length; i++) {
        var parameterName = xmlElements[i].getElementsByTagName("BsWfs:ParameterName")[0].textContent;
        var parameterValue = parseFloat(xmlElements[i].getElementsByTagName("BsWfs:ParameterValue")[0].textContent);
        var time = new Date(xmlElements[i].getElementsByTagName("BsWfs:Time")[0].textContent).getTime();
        var localTime = convertToUserTime(time);

        // water minimum temperature
        if (parameterName === "TW_P1D_MIN") {
            waterTempMin.push([localTime, parameterValue]);
        }
        // water average temperature
        if (parameterName === "TW_P1D_AVG") {
            waterTempAvg.push([localTime, parameterValue]);
        }
        // water maximum temperature
        if (parameterName === "TW_P1D_MAX") {
            waterTempMax.push([localTime, parameterValue]);
        }
    }

    const plotWaterTemperature = $.plot("#waterTempChart", [
        {
            data: waterTempAvg,
            lines: { show: true },
            points: { show: false },
            color: "#3495e5",
            label: "Veden keskilämpötila"
        },
        {
            data: waterTempMin,
            lines: { show: true },
            points: { show: false },
            color: "gray",
            label: "Veden alhaisin lämpötila"
        },
        {
            data: waterTempMax,
            lines: { show: true },
            points: { show: false },
            color: "gray",
            label: "Veden korkein lämpötila"
        }
    ], {
        xaxis: {
            mode: "time",
            minTickSize: [1, "day"],
            tickFormatter: function(value, axis) {
              const date = new Date(value);
              const day = date.getDate();
              const month = date.getMonth() + 1; // Month is zero-based
              return `${day}.${month}`;
            }
        },
        yaxis: {
            position: "right",
            tickFormatter: function (val, axis) {
                return Math.round(val) + "°C";
            }
        },
        legend: {
            show: true,
            position: "nw"
        },
        grid: {
            borderWidth: 1
        }
    });
}

function convertToUserTime(utcTimestamp) {
    const date = new Date(utcTimestamp); // Create a date object with the UTC timestamp
    const localOffset = date.getTimezoneOffset() * 60000; // Get the local timezone offset in milliseconds
    const localTime = utcTimestamp - localOffset; // Convert to user's local time
    return localTime;
  }