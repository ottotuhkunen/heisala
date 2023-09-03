async function loadForecast() {
    try {
      const response = await fetch('https://opendata.fmi.fi/wfs?service=WFS&version=2.0.0&request=getFeature&storedquery_id=fmi::forecast::harmonie::surface::point::simple&place=heisala');
  
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

function setForecast(xmlDoc) {
    // Data storage
    const weatherData = {};

    // Parse XML
    const xmlElements = xmlDoc.getElementsByTagName("wfs:member");

    let windSpeeds;
    let weatherIconHelper;

    // 0 = clear (fa-solid fa-sun)
    // 1 = few clouds (fa-cloud-sun)
    // 2 = cloudy (fa-cloud)
    // 3 = fog (fa-smog)
    // 4 = light rain (fa-cloud-sun-rain)
    // 5 = rain (fa-cloud-rain)
    // 6 = heavy rain (fa-cloud-showers-heavy)
    // 7 = ice rain (fa-cloud-meatball)
    // 8 = snow (fa-snowflake")

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
            weatherData[date][hour].temperature = Math.round(parameterValue);
        } 

        if (parameterName === "TotalCloudCover") {
            weatherData[date][hour].cloudcover = Math.round(parameterValue);
            if (parameterValue >= 0 && parameterValue <= 20) weatherIconHelper = 0;
            else if (parameterValue > 20 && parameterValue <= 60) weatherIconHelper = 1;
            else if (parameterValue > 60 && parameterValue <= 100) weatherIconHelper = 2;
        } 
        
        else if (parameterName === "PrecipitationAmount") {
            weatherData[date][hour].precipitation = parseFloat(parameterValue * 10);
            if (parameterValue >= 0.0 && parameterValue <= 0.6) weatherIconHelper = 4;
            else if (parameterValue > 0.6 && parameterValue <= 0.15) weatherIconHelper = 5;
            else if (parameterValue > 15) weatherIconHelper = 6;
        }

        else if (parameterName === "WindSpeedMS") {
            windSpeeds = Math.round(parameterValue);
            console.log(windSpeeds)
            //weatherData[date][hour].windspeed = Math.round(parameterValue);
        }
        else if (parameterName === "WindGust") {
            windSpeeds = windSpeeds + "-" + Math.ceil(parameterValue);
            //weatherData[date][hour].windspeed = Math.round(parameterValue);
        }

        weatherData[date][hour].windspeed = windSpeeds;
        weatherData[date][hour].weathericonId = weatherIconHelper;

    }

    // Create table and headers
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    
    for (const date in weatherData) {
        const th = document.createElement("th");
        th.innerHTML = date;
        th.onclick = function() {
            updateTableBody(date, weatherData);
        };
        headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Add empty body
    const tbody = document.createElement("tbody");
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
    const wxIcon = document.createElement("i");
    wxIcon.className = "fa-solid fa-snowflake";
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
        hourCell.innerText = hour; // Using hour directly from the loop variable

        // Icon cell
        const iconCell = document.createElement("td");
        const icon = document.createElement("i");
        icon.className = getWeatherIconClass(data.weathericonId);
        iconCell.appendChild(icon);
    
        // Temperature cell
        const tempCell = document.createElement("td");
        tempCell.innerText = data.temperature;
    
        // Precipitation cell
        const precipCell = document.createElement("td");
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

function getWeatherIconClass(weathericonId) {
    switch (weathericonId) {
        case 0:
            return 'fa-solid fa-solid fa-sun';
        case 1:
            return 'fa-solid fa-cloud-sun';
        case 2:
            return 'fa-solid fa-cloud';
        case 3:
            return 'fa-solid fa-smog';
        case 4:
            return 'fa-solid fa-cloud-sun-rain';
        case 5:
            return 'fa-solid fa-cloud-rain';
        case 6:
            return 'fa-solid fa-cloud-showers-heavy';
        case 7:
            return 'fa-solid fa-cloud-meatball';
        case 8:
            return 'fa-solid fa-snowflake';
        default:
            return '';
    }
}
