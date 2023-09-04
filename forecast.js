async function loadForecast() {
    try {
      const response = await fetch('https://opendata.fmi.fi/wfs?service=WFS&version=2.0.0&request=getFeature&storedquery_id=fmi::forecast::edited::weather::scandinavia::point::simple&place=heisala');
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      } else {
        const responseText = await response.text();
        const parser = new DOMParser();
        const data = parser.parseFromString(responseText, "application/xml");
        setForecast(data);
      }
    } catch (error) {
      console.log('Fetch API error -', error);
    }
}

let weatherArray;

function loadWeatherIcons(endTime, startTime, callback) {
    
    const startTimeDate = new Date(startTime);
    startTime = startTimeDate.toISOString();

    const endTimeDate = new Date(endTime);
    endTime = endTimeDate.toISOString();

    const apiUrl = `https://opendata.fmi.fi/timeseries?place=heisala&param=smartsymbol,smartsymboltext&lang=en&startTime=${startTime}&endTime=${endTime}`;
    console.log(apiUrl);
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(responseData => {
            const weatherArray = responseData.split("\n"); // Assuming the text is separated by new lines
            if (callback) {
                callback(weatherArray); // Passing weatherArray to the callback function
            }
        })
        .catch(error => {
            console.log('Fetch API error -', error);
        });
}




// Data storage
const weatherData = {};

function setForecast(xmlDoc) {
    // Parse XML
    const xmlElements = xmlDoc.getElementsByTagName("wfs:member");
    const lastIndex = xmlElements.length - 1;
    let endTime = xmlElements[lastIndex].getElementsByTagName("BsWfs:Time")[0];
    endTime = new Date(endTime.textContent);

    let startTime = xmlElements[0].getElementsByTagName("BsWfs:Time")[0];
    startTime = new Date(startTime.textContent);

    /*
    1 selkeää
    2 puolipilvistä
    21 heikkoja sadekuuroja
    22 sadekuuroja
    23 voimakkaita sadekuuroja
    3 pilvistä
    31 heikkoa vesisadetta
    32 vesisadetta
    33 voimakasta vesisadetta
    41 heikkoja lumikuuroja
    42 lumikuuroja
    43 voimakkaita lumikuuroja
    51 heikkoa lumisadetta
    52 lumisadetta
    53 voimakasta lumisadetta
    61 ukkoskuuroja
    62 voimakkaita ukkoskuuroja
    63 ukkosta
    64 voimakasta ukkosta
    71 heikkoja räntäkuuroja
    72 räntäkuuroja
    73 voimakkaita räntäkuuroja
    81 heikkoa räntäsadetta
    82 räntäsadetta
    83 voimakasta räntäsadetta
    91 utua
    92 sumua
    */

    loadWeatherIcons(endTime, startTime, function(weatherArray) {

        console.log(weatherArray[65]);
        let weatherArrayIndex = 0;

        for (let i = 0; i < xmlElements.length; i++) {
            const parameterName = xmlElements[i].getElementsByTagName("BsWfs:ParameterName")[0].textContent;
            const parameterValue = xmlElements[i].getElementsByTagName("BsWfs:ParameterValue")[0].textContent;
            
            // Original time in UTC
            const time = new Date(xmlElements[i].getElementsByTagName("BsWfs:Time")[0].textContent);
            time.setUTCHours(time.getUTCHours() + 3); // Add 3 hours to make it Finland's time
            const date = time.toISOString().split("T")[0];
            const hour = time.getUTCHours();

            if (!weatherData[date]) {
                weatherData[date] = {};
            }
            
            if (!weatherData[date][hour]) {
                weatherData[date][hour] = {};
            }

            if (parameterName === "Temperature") {
                weatherData[date][hour].temperature = Math.round(parameterValue) + "°";

                // weather symbol
                weatherData[date][hour].weathersymbol = weatherArray[weatherArrayIndex] || 0;
                weatherArrayIndex ++;
            } 
            
            else if (parameterName === "Precipitation1h") {
                weatherData[date][hour].precipitation = parseFloat(parameterValue * 10);
            }

            else if (parameterName === "WindSpeedMS") {
                weatherData[date][hour].windspeed = Math.round(parameterValue);
                //weatherData[date][hour].windspeed = Math.round(parameterValue);
            }
            else if (parameterName === "WindGust") {
                // windSpeeds = windSpeeds + "-" + Math.ceil(parameterValue);
                //weatherData[date][hour].windspeed = Math.round(parameterValue);
            }
        }
    });



    // Create table and headers
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    table.className = "weatherTable";
    thead.className = "weatherTable-head";
    headerRow.className = "weatherTable-row";
    
    function resetClicked() {
        const thElements = document.querySelectorAll(".weatherTable-head th");
        thElements.forEach((th) => {
            th.classList.remove("clicked");
        });
    }

    // Define header texts
    const headerTexts = ['Tänään', 'Huomenna', 'Ylihuomenna'];
    
    for (let i = 0; i < headerTexts.length; i++) {
        const th = document.createElement("th");
        th.innerHTML = headerTexts[i];
        
        // Assuming you have the corresponding dates in weatherData
        const date = Object.keys(weatherData)[i];
        if (date) {
            th.onclick = function() {
                resetClicked();  // Reset the clicked state on all th elements
                this.classList.add("clicked");  // Add the clicked class to the clicked th
                updateTableBody(date, weatherData);
            };
        }
        headerRow.appendChild(th);

        // Highlight the first <th> element by default
        if (i === 0) {
            th.classList.add("clicked");
        }
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Add empty body
    const tbody = document.createElement("tbody");
    tbody.className = "weatherTable-body";
    table.appendChild(tbody);

    // Add table to DOM
    const tableDiv = document.getElementById("tableDiv");
    tableDiv.innerHTML = "";  // Clear any existing table
    tableDiv.appendChild(table);

    // Display the first date's data by default
    const firstDate = Object.keys(weatherData)[0];
    if (firstDate) {
        updateTableBody(firstDate, weatherData);
    }
}

function updateTableBody(date, weatherData) {
    const table = document.querySelector("#tableDiv table");
    let tbody = table.querySelector("tbody");

    // Clear existing rows
    tbody.innerHTML = "";

    // Add a row for the icons at the top
    const iconRow = document.createElement("tr");
    
    const clockIconCell = document.createElement("td");
    const clockIcon = document.createElement("i");
    clockIcon.className = "fa-solid fa-clock";
    clockIconCell.appendChild(clockIcon);
    iconRow.appendChild(clockIconCell);

    const wxIconCell = document.createElement("td");
    const wxIcon = document.createElement("img");
    wxIcon.src = "images/weatherIcons/light/1.svg";
    wxIcon.width = 30;
    wxIconCell.appendChild(wxIcon);
    iconRow.appendChild(wxIconCell);

    const tempIconCell = document.createElement("td");
    const tempIcon = document.createElement("i");
    tempIcon.className = "fa-solid fa-temperature-half";
    tempIconCell.appendChild(tempIcon);
    const tempText = document.createTextNode(" °C");
    tempIconCell.appendChild(tempText);
    iconRow.appendChild(tempIconCell);

    const windIconCell = document.createElement("td");
    const windIcon = document.createElement("i");
    windIcon.className = "fa-solid fa-wind";
    windIconCell.appendChild(windIcon);
    const windText = document.createTextNode(" m/s");
    windIconCell.appendChild(windText);
    iconRow.appendChild(windIconCell);

    const precipIconCell = document.createElement("td");
    const precipIcon = document.createElement("i");
    precipIcon.className = "fa-solid fa-droplet";
    precipIconCell.appendChild(precipIcon);
    const mmText = document.createTextNode(" mm");
    precipIconCell.appendChild(mmText);
    iconRow.appendChild(precipIconCell);

    tbody.appendChild(iconRow);

    for (const hour in weatherData[date]) {
        const data = weatherData[date][hour];
        const row = document.createElement("tr");
    
        // Time cell
        const hourCell = document.createElement("td");
        hourCell.innerText = hour;

        // Icon cell
        const iconCell = document.createElement("td");
        const icon = document.createElement("img");
        icon.src = getWeatherIconSrc(data.weathersymbol);
        icon.width = 30;
        iconCell.appendChild(icon);
    
        // Temperature cell
        const tempCell = document.createElement("td");
        tempCell.innerText = data.temperature;
    
        // Precipitation cell
        const precipCell = document.createElement("td");
        if (data.precipitation == 0) data.precipitation = "";
        precipCell.innerText = data.precipitation;

        // Windspeed cell
        const windspeedCell = document.createElement("td");
        windspeedCell.innerText = data.windspeed;

        row.appendChild(hourCell);
        row.appendChild(iconCell);
        row.appendChild(tempCell);
        row.appendChild(windspeedCell);
        row.appendChild(precipCell);

        tbody.appendChild(row);
    }
}

function getWeatherIconSrc(symbolId) {
    symbolId = symbolId.split(" ");
    symbolId = parseInt(symbolId[0], 10); 
    return `images/weatherIcons/light/${symbolId}.svg`;
}

