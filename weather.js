// get time
function getDate(){
    var dateUtc = new Date();
    var day = dateUtc.getDate();
    var month = dateUtc.getMonth() + 1;
    if ( day < 10 ) { day = "0" + day; }
    if ( month < 10 ) { month = "0" + month; }

    var h = dateUtc.getHours();
    var m = dateUtc.getMinutes();
    var s = dateUtc.getSeconds();

    if ( m < 10 ) { m = "0" + m; }
    if ( h < 10 ) { h = "0" + h; }
    if ( s < 10 ) { s = "0" + s; }

    var timeAwos = h + ":" + m + ":" + s;
    const awosTime = document.getElementById('utcTime');

    if(awosTime) {
        awosTime.textContent = timeAwos;
    }
} setInterval(getDate, 1000);


// load current weather
async function loadFMI() {
    try {
      const response = await fetch("https://opendata.fmi.fi/wfs?service=WFS&version=2.0.0&request=getFeature&storedquery_id=fmi::observations::weather::simple&fmisid=100908");
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      } else {
        const responseText = await response.text();
        const parser = new DOMParser();
        const data = parser.parseFromString(responseText, "application/xml");
        setData(data);
        console.log("FMI data loaded at", new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.log('Fetch API error -', error);
    }
} setInterval(loadFMI, 60000);


// display current weather data from FMI
function setData(xmlDoc) {
    var xmlSize = xmlDoc.getElementsByTagName("BsWfs:ParameterName");
    var table = new Array(xmlSize.length);

    for(var i = 0; i < xmlSize.length; i++) {
        table[i] = new Array(2);
        table[i][0] = xmlDoc.getElementsByTagName("BsWfs:ParameterName")[i].childNodes[0].nodeValue;
        table[i][1] = xmlDoc.getElementsByTagName("BsWfs:ParameterValue")[i].childNodes[0].nodeValue;
    }

    table = table.slice(-15, -1);
    
    let windGust = 0;
    let qnh = 0;
    let ta = 0;
    let td = 0;
    let wawa = "//";
    let vis = 0;
    let windDirection = 0;
    let windSpeed = 0;
    let cloudCoverage = 0;

    for (var i = 0; i < table.length; i++) {
        if (table[i][0] === "p_sea") {
            qnh = table[i][1];
        }
        if (table[i][0] === "ws_10min") {
            windSpeed = Math.round(table[i][1]);
            if (isNaN(windSpeed)) windSpeed = 0;
            // wind calm
            if (windSpeed < 0.6) {
                windSpeed = 0;

            }   
        }
        if (table[i][0] === "wd_10min") {
            windDirection = Math.floor(table[i][1] / 10) * 10;
            if (isNaN(windDirection)) windDirection = 360;
        }
        if (table[i][0] === "wg_10min") {
            windGust = Math.ceil(table[i][1]);
            if (isNaN(windGust)) windGust = windSpeed + 1;
        }
        if (table[i][0] === "wawa") {
            wawa = table[i][1];
        }
        if (table[i][0] === "t2m") {
            ta = table[i][1];
        }
        if (table[i][0] === "td") {
            td = table[i][1];
        }
        if (table[i][0] === "vis") {
            vis = table[i][1];
        }
        if (table[i][0] === "n_man") {
            cloudCoverage = Math.round(table[i][1]);
        }
    }

    setCloudCoverage(cloudCoverage);
    setCurrentWx(wawa);

    // wind warning
    if (windGust >= 14) document.getElementById("windWarning").style.visibility = ("visible");
    else document.getElementById("windWarning").style.visibility = ("hidden");

    // qnh
    var qnhParts = qnh.split(".");

    // visibility
    if (vis > 4000) {
        vis = Math.round(vis / 1000) * 1000;
        vis = (vis / 1000) + " km";
    }
    else if (vis <= 4000) {
        vis = Math.round(vis / 100) * 100;
        vis = vis + " m"
    }
    else vis = Math.ceil(vis) + " m";

    const visibilityField = document.getElementById('vis');       
    visibilityField.textContent = vis;

    const tempField = document.getElementById('ta');       
    tempField.textContent = ta;

    const dewField = document.getElementById('td');       
    dewField.textContent = td;

    const qnhField = document.getElementById('qnh');       
    qnhField.textContent = qnhParts[0];

    const qnhDecimalField = document.getElementById('qnhDecimal');       
    qnhDecimalField.textContent = "." + qnhParts[1];

    var arrow = document.getElementById("arrow");
    arrow.style.transform = "rotate(" + (windDirection - 90) + "deg)";
    console.log(windDirection);

    const windDirField = document.getElementById('windDir');       
    windDirField.textContent = windDirection + "°";

    const windSpdField = document.getElementById('windSpd');       
    windSpdField.textContent = windSpeed + " m/s";

    const windGustField = document.getElementById('windSpdMax');       
    windGustField.textContent = "puuskat " + windGust + " m/s";
}

function setCloudCoverage(coverage) {
    const coverageField = document.getElementById("weatherDesc");
    const cloudIconField = document.getElementById("weatherIcon");
    if (coverage == 0) {
        coverageField.textContent = "Selkeää";
        cloudIconField.className = ("fa-solid fa-sun");
    } 
    else if (coverage == 1) {
        coverageField.textContent = "Melkein selkeää";
        cloudIconField.className = ("fa-solid fa-sun");
    } 
    else if (coverage == 2) {
        coverageField.textContent = "Verrattain selkeää";
        cloudIconField.className = ("fa-solid fa-cloud-sun");
    } 
    else if (coverage == 3) {
        coverageField.textContent = "Hajanaisia pilviä (3/8)";
        cloudIconField.className = ("fa-solid fa-cloud-sun");
    } 
    else if (coverage == 4) {
        coverageField.textContent = "Hajanaisia pilviä (4/8)";
        cloudIconField.className = ("fa-solid fa-cloud-sun");
    } 
    else if (coverage == 5) {
        coverageField.textContent = "Puolipilvistä (5/8)";
        cloudIconField.className = ("fa-solid fa-cloud-sun");
    } 
    else if (coverage == 6) {
        coverageField.textContent = "Verrattain pilvistä (6/8)";
        cloudIconField.className = ("fa-solid fa-cloud");
    } 
    else if (coverage == 7) {
        coverageField.textContent = "Melkein pilvistä (7/8)";
        cloudIconField.className = ("fa-solid fa-cloud");
    }
    else if (coverage == 8) {
        coverageField.textContent = "Pilvistä (8/8)";
        cloudIconField.className = ("fa-solid fa-cloud");
    }
    else if (coverage == 9) coverageField.textContent = "Sumua (9/8)";
}

// display weather codes
function setCurrentWx(wawa) {
    const currentWx = document.getElementById("weatherDesc2");
    const cloudIconField = document.getElementById("weatherIcon");
    if (wawa == 0) currentWx.textContent = "";

    else if (wawa == 4) currentWx.textContent = "auerta";
    else if (wawa == 5) currentWx.textContent = "auerta";
    else if (wawa == 10) currentWx.textContent = "utua";

    else if (wawa == 20) currentWx.textContent = "sumua edellisen tunnin aikana";
    else if (wawa == 21) currentWx.textContent = "sadetta edellisen tunnin aikana";
    else if (wawa == 22) currentWx.textContent = "tihkusadetta edellisen tunnin aikana";
    else if (wawa == 23) currentWx.textContent = "vesisadetta edellisen tunnin aikana";
    else if (wawa == 24) currentWx.textContent = "lumisadetta edellisen tunnin aikana";
    else if (wawa == 25) currentWx.textContent = "jäätävää vesisadetta edellisen tunnin aikana";

    // fog
    else if (wawa == 30) currentWx.textContent = "sumua";
    else if (wawa == 31) currentWx.textContent = "paikoin sumua";
    else if (wawa == 32) currentWx.textContent = "sumua";
    else if (wawa == 33) currentWx.textContent = "sumua";
    else if (wawa == 34) currentWx.textContent = "sumua";

    // light rain
    else if (wawa == 40) currentWx.textContent = "sadetta";
    else if (wawa == 41) currentWx.textContent = "heikkoa sadetta";
    else if (wawa == 50) currentWx.textContent = "tihkusadetta";
    else if (wawa == 51) currentWx.textContent = "heikkoa tihkua";
    else if (wawa == 61) currentWx.textContent = "heikkoa vesisadetta";
    else if (wawa == 81) currentWx.textContent = "heikkoja vesikuuroja";
    else if (wawa == 82) currentWx.textContent = "vesikuuroja";

    // rain
    else if (wawa == 52) currentWx.textContent = "kohtalaista tihkua";
    else if (wawa == 53) currentWx.textContent = "kovaa tihkua";
    else if (wawa == 60) currentWx.textContent = "vesisadetta";
    else if (wawa == 62) currentWx.textContent = "vesisadetta";
    else if (wawa == 80) currentWx.textContent = "sadekuuroja";

    // heavy rain
    else if (wawa == 42) currentWx.textContent = "kovaa sadetta";
    else if (wawa == 63) currentWx.textContent = "kovaa vesisadetta";
    else if (wawa == 83) currentWx.textContent = "kovia vesikuuroja";
    else if (wawa == 84) currentWx.textContent = "ankaria vesikuuroja (>32 mm/h)";

    // ice rain
    else if (wawa == 54) currentWx.textContent = "jäätävää heikkoa tihkua";
    else if (wawa == 55) currentWx.textContent = "jäätävää tihkua";
    else if (wawa == 56) currentWx.textContent = "jäätävää kovaa tihkua";
    else if (wawa == 64) currentWx.textContent = "jäätävää heikkoa vesisadetta";
    else if (wawa == 65) currentWx.textContent = "jäätävää vesisadetta";
    else if (wawa == 66) currentWx.textContent = "jäätävää kovaa vesisadetta";
    else if (wawa == 67) currentWx.textContent = "heikkoa lumensekaista vesisadetta";
    else if (wawa == 68) currentWx.textContent = "lumensekaista vesisadetta";
    else if (wawa == 74) currentWx.textContent = "heikkoa jääjyvässadetta";
    else if (wawa == 75) currentWx.textContent = "jääjyvässadetta";
    else if (wawa == 76) currentWx.textContent = "kovaa jääjyvässadetta";
    else if (wawa == 89) currentWx.textContent = "raekuuroja";

    // snow
    else if (wawa == 70) currentWx.textContent = "lumisadetta";
    else if (wawa == 71) currentWx.textContent = "heikkoa lumisadetta";
    else if (wawa == 72) currentWx.textContent = "lumisadetta";
    else if (wawa == 73) currentWx.textContent = "tiheää lumisadetta";
    else if (wawa == 77) currentWx.textContent = "lumijyväsiä";
    else if (wawa == 85) currentWx.textContent = "heikkoja lumikuuroja";
    else if (wawa == 86) currentWx.textContent = "lumikuuroja";
    else if (wawa == 87) currentWx.textContent = "kovia lumikuuroja";
   

    else if (wawa == 78) currentWx.textContent = "jääkiteitä";

    // set weather icon
    if (wawa == 4 || wawa == 5 || wawa == 10 || wawa >= 30 && wawa <= 34) {
        // fog
        cloudIconField.className = ("fa-solid fa-smog");
    }
    else if (wawa == 40 || wawa == 41 || wawa == 50 || wawa == 51 || wawa == 61 || wawa == 81 || wawa == 82) {
        // light rain
        cloudIconField.className = ("fa-solid fa-cloud-sun-rain");
    }
    else if (wawa == 52 || wawa == 53 || wawa == 60 || wawa == 62 || wawa == 80) {
        // rain
        cloudIconField.className = ("fa-solid fa-cloud-rain");
    }
    else if (wawa == 42 || wawa == 63 || wawa == 83 || wawa == 84) {
        // heavy rain
        cloudIconField.className = ("fa-solid fa-cloud-showers-heavy");
    }
    else if (wawa >= 54 && wawa <= 56 || wawa >= 64 && wawa <= 68 || wawa >= 74 && wawa <= 76 || wawa == 89) {
        // ice rain
        cloudIconField.className = ("fa-solid fa-cloud-meatball");
    }
    else if (wawa >= 70 && wawa <= 73 || wawa == 77 || wawa >= 85 && wawa <= 87) {
        // snow
        cloudIconField.className = ("fa-solid fa-snowflake");
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // light/dark mode theme toggle
    const themeToggleButton = document.getElementById('mode');
    const themeStylesheet = document.getElementById('theme-stylesheet');
        
    // Load theme from URL or local storage
    // Default = dark mode
    let currentTheme = getThemeFromUrl() || localStorage.getItem('theme') || 'dark';

    // Apply the loaded theme
    applyTheme();

    themeToggleButton.addEventListener('click', function() {
        // Toggle the theme
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        if (currentTheme == "dark") themeToggleButton.textContent = "To light mode";
        if (currentTheme == "light") themeToggleButton.textContent = "To dark mode";
        
        localStorage.setItem('theme', currentTheme);
        applyTheme();

        // Update the URL to reflect the theme without reloading the page
        const newUrl = `${window.location.pathname}?theme=${currentTheme}`;
        history.replaceState(null, null, newUrl);
    });


    function getThemeFromUrl() {
        return new URLSearchParams(window.location.search).get('theme');
    }

    function applyTheme() {
        if (currentTheme === 'dark') {
            themeStylesheet.setAttribute('href', 'dark-mode.css');
            themeToggleButton.textContent = "To light mode";
            //document.querySelector('.logo').src = 'images/vatsca.png';
        } else {
            themeStylesheet.setAttribute('href', 'light-mode.css');
            themeToggleButton.textContent = "To dark mode";
            //document.querySelector('.logo').src = 'images/vatscaDark.png';
        }
    }
});