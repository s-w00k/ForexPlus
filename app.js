(function () {
  var API_KEY = "GetYourAPIKeyFrom twelvedata"; //Add your TwelveData API key here

  if (!API_KEY) {
  alert("Please add your TwelveData API key in app.js");
}

  var state = {
    pair: "USD/JPY",
    interval: "5min",
    chart: null,
    intradayCandles: [],
    dailyCandles: []
  };

  var el = {
    pairSelect: document.getElementById("pairSelect"),
    intervalSelect: document.getElementById("intervalSelect"),
    refreshBtn: document.getElementById("refreshBtn"),

    currentPrice: document.getElementById("currentPrice"),
    dayLow: document.getElementById("dayLow"),
    //weekLow: document.getElementById("weekLow"),
    //monthLow: document.getElementById("monthLow"),
    //yearLow: document.getElementById("yearLow"),
    dailyRange: document.getElementById("dailyRange"),
    adrValue: document.getElementById("adrValue"),

    asiaHigh: document.getElementById("asiaHigh"),
    asiaLow: document.getElementById("asiaLow"),
    londonHigh: document.getElementById("londonHigh"),
    londonLow: document.getElementById("londonLow"),
    newYorkHigh: document.getElementById("newYorkHigh"),
    newYorkLow: document.getElementById("newYorkLow"),

    ema20Value: document.getElementById("ema20Value"),
    ema50Value: document.getElementById("ema50Value"),
    ema200Value: document.getElementById("ema200Value"),

    lastUpdated: document.getElementById("lastUpdated"),
    recentTableBody: document.getElementById("recentTableBody"),
    priceChart: document.getElementById("priceChart"),
      tradeSignal: document.getElementById("tradeSignal"),
  };

  function init() {
    bindEvents();
    loadDashboard();
  }

  function bindEvents() {
    el.pairSelect.value = state.pair;
    el.intervalSelect.value = state.interval;

    el.pairSelect.onchange = function () {
      state.pair = this.value;
      loadDashboard();
    };

    el.intervalSelect.onchange = function () {
      state.interval = this.value;
      loadDashboard();
    };

    el.refreshBtn.onclick = function () {
      loadDashboard();
    };
  }

  function loadDashboard() {
    setLoadingState();

    fetchIntradayData(state.pair, state.interval, function (err1, intradayCandles) {
      if (err1) {
        showError(err1);
        return;
      }

      fetchDailyData(state.pair, function (err2, dailyCandles) {
        if (err2) {
          showError(err2);
          return;
        }

        state.intradayCandles = intradayCandles;
        state.dailyCandles = dailyCandles;

        updateStats(intradayCandles, dailyCandles);
        renderChart(intradayCandles);
        renderTable(intradayCandles);
      });
    });
  }

  function setLoadingState() {
    var loading = "Loading...";

    el.currentPrice.innerHTML = loading;
    el.dayLow.innerHTML = loading;
    //el.weekLow.innerHTML = loading;
    //el.monthLow.innerHTML = loading;
    //el.yearLow.innerHTML = loading;
    el.dailyRange.innerHTML = loading;
    el.adrValue.innerHTML = loading;

    el.asiaHigh.innerHTML = "--";
    el.asiaLow.innerHTML = "--";
    el.londonHigh.innerHTML = "--";
    el.londonLow.innerHTML = "--";
    el.newYorkHigh.innerHTML = "--";
    el.newYorkLow.innerHTML = "--";

    el.ema20Value.innerHTML = "--";
    el.ema50Value.innerHTML = "--";
    el.ema200Value.innerHTML = "--";

    el.lastUpdated.innerHTML = loading;
    el.recentTableBody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';
  }

  function showError(message) {
    el.currentPrice.innerHTML = "Error";
    el.dayLow.innerHTML = "--";
    //el.weekLow.innerHTML = "--";
    //el.monthLow.innerHTML = "--";
    //el.yearLow.innerHTML = "--";
    el.dailyRange.innerHTML = "--";
    el.adrValue.innerHTML = "--";

    el.asiaHigh.innerHTML = "--";
    el.asiaLow.innerHTML = "--";
    el.londonHigh.innerHTML = "--";
    el.londonLow.innerHTML = "--";
    el.newYorkHigh.innerHTML = "--";
    el.newYorkLow.innerHTML = "--";

    el.ema20Value.innerHTML = "--";
    el.ema50Value.innerHTML = "--";
    el.ema200Value.innerHTML = "--";

    el.lastUpdated.innerHTML = "--";
    el.recentTableBody.innerHTML = '<tr><td colspan="5">' + escapeHtml(message) + '</td></tr>';
  }

  function fetchIntradayData(pair, interval, callback) {
    var url =
      "https://api.twelvedata.com/time_series" +
      "?symbol=" + encodeURIComponent(pair) +
      "&interval=" + encodeURIComponent(interval) +
      "&outputsize=5000" +
      "&apikey=" + encodeURIComponent(API_KEY);

    requestJson(url, function (err, json) {
      if (err) {
        callback(err);
        return;
      }

      callback(null, normalizeCandles(json));
    });
  }

  function fetchDailyData(pair, callback) {
    var url =
      "https://api.twelvedata.com/time_series" +
      "?symbol=" + encodeURIComponent(pair) +
      "&interval=1day" +
      "&outputsize=365" +
      "&apikey=" + encodeURIComponent(API_KEY);

    requestJson(url, function (err, json) {
      if (err) {
        callback(err);
        return;
      }

      callback(null, normalizeCandles(json));
    });
  }

  function requestJson(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);

    xhr.onreadystatechange = function () {
      var json;

      if (xhr.readyState !== 4) {
        return;
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        callback("Request failed. Status: " + xhr.status);
        return;
      }

      try {
        json = JSON.parse(xhr.responseText);
      } catch (e) {
        callback("Invalid API response.");
        return;
      }

      if (json.status === "error") {
        callback(json.message || "API returned an error.");
        return;
      }

      if (!json.values || !json.values.length) {
        callback("No candle data returned.");
        return;
      }

      callback(null, json);
    };

    xhr.onerror = function () {
      callback("Network error while loading forex data.");
    };

    xhr.send();
  }

  function normalizeCandles(apiResponse) {
    var values = apiResponse.values || [];
    var out = [];
    var i;
    var row;

    for (i = 0; i < values.length; i += 1) {
      row = values[i];

      out.push({
        datetime: row.datetime,
        open: parseFloat(row.open),
        high: parseFloat(row.high),
        low: parseFloat(row.low),
        close: parseFloat(row.close),
        timestamp: parseDateTime(row.datetime)
      });
    }

    out.sort(function (a, b) {
      return a.timestamp - b.timestamp;
    });

    return out;
  }

  function updateStats(intradayCandles, dailyCandles) {
    var latest = intradayCandles[intradayCandles.length - 1];
    var now = new Date();

    var dayCandles = filterByCurrentDay(intradayCandles, now);
    //var weekDailyCandles = filterDailyByCurrentWeek(dailyCandles, now);
    //var monthDailyCandles = filterDailyByCurrentMonth(dailyCandles, now);
    //var yearDailyCandles = filterDailyByCurrentYear(dailyCandles, now);

    var dailyHigh = getHighestHigh(dayCandles);
    var dailyLow = getLowestLow(dayCandles);
    var dailyRange = null;

    var adr = calculateADR(dailyCandles, 14);
    var sessionLevels = getCurrentSessionLevels(dayCandles);

    var closes = getCloseSeries(intradayCandles);
    var ema20 = calculateEMA(closes, 20);
    var ema50 = calculateEMA(closes, 50);
    var ema200 = calculateEMA(closes, 200);

    if (dailyHigh !== null && dailyLow !== null) {
      dailyRange = dailyHigh - dailyLow;
    }

    el.currentPrice.innerHTML = formatPrice(latest.close);
    el.dayLow.innerHTML = formatPrice(dailyLow);
    //el.weekLow.innerHTML = formatPrice(getLowestLow(weekDailyCandles));
    //el.monthLow.innerHTML = formatPrice(getLowestLow(monthDailyCandles));
    //el.yearLow.innerHTML = formatPrice(getLowestLow(yearDailyCandles));
    el.dailyRange.innerHTML = formatPips(dailyRange, state.pair);
    el.adrValue.innerHTML = formatPips(adr, state.pair);

    el.asiaHigh.innerHTML = formatPrice(sessionLevels.asia.high);
    el.asiaLow.innerHTML = formatPrice(sessionLevels.asia.low);
    el.londonHigh.innerHTML = formatPrice(sessionLevels.london.high);
    el.londonLow.innerHTML = formatPrice(sessionLevels.london.low);
    el.newYorkHigh.innerHTML = formatPrice(sessionLevels.newYork.high);
    el.newYorkLow.innerHTML = formatPrice(sessionLevels.newYork.low);

    el.ema20Value.innerHTML = formatPrice(getLastValidValue(ema20));
    el.ema50Value.innerHTML = formatPrice(getLastValidValue(ema50));
    el.ema200Value.innerHTML = formatPrice(getLastValidValue(ema200));

    el.lastUpdated.innerHTML = latest.datetime;
      
      evaluateTradeSignal(
  latest.close,
  ema20,
  ema50,
  ema200,
  sessionLevels,
  dailyLow,
  dailyRange,
  adr
);
  }

  function renderChart(candles) {
    var slice = candles.slice(Math.max(0, candles.length - 600));
    var labels = [];
    var closeData = [];
    var closeSeries = [];
    var ema20Raw;
    var ema50Raw;
    var ema200Raw;
    var ema20 = [];
    var ema50 = [];
    var ema200 = [];
    var i;
    var price;

    for (i = 0; i < slice.length; i += 1) {
      labels.push(formatChartLabel(slice[i].datetime));

      price = parseFloat(slice[i].close);
      if (isNaN(price)) {
        closeData.push(null);
        closeSeries.push(null);
      } else {
        closeData.push(price);
        closeSeries.push(price);
      }
    }

    ema20Raw = calculateEMA(closeSeries, 20);
    ema50Raw = calculateEMA(closeSeries, 50);
    ema200Raw = calculateEMA(closeSeries, 200);

    for (i = 0; i < ema20Raw.length; i += 1) {
      ema20.push(ema20Raw[i] === null ? null : roundTo(ema20Raw[i], 5));
      ema50.push(ema50Raw[i] === null ? null : roundTo(ema50Raw[i], 5));
      ema200.push(ema200Raw[i] === null ? null : roundTo(ema200Raw[i], 5));
    }

    if (state.chart) {
      state.chart.destroy();
    }

    state.chart = new Chart(el.priceChart, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
  label: state.pair + " Price",
  data: closeData,
  borderColor: "white",
  backgroundColor: "rgba(0,229,255,0.1)",
  borderWidth: 2,
  pointRadius: 0,
  tension: 0.2
},
{
  label: "EMA 20",
  data: ema20,
  borderColor: "#00e5ff",
  borderWidth: 1.5,
  pointRadius: 0
},
{
  label: "EMA 50",
  data: ema50,
  borderColor: "#ffcc00",
  borderWidth: 1.5,
  pointRadius: 0
},
{
  label: "EMA 200",
  data: ema200,
  borderColor: "#ff4d4d",
  borderWidth: 2,
  pointRadius: 0
}
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: {
          mode: "index",
          intersect: false
        },
        plugins: {
          legend: {
            labels: {
              color: "#e8eefc"
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: "#9bb0d1",
              maxTicksLimit: 10
            },
            grid: {
              color: "rgba(255,255,255,0.08)"
            }
          },
          y: {
            beginAtZero: false,
            ticks: {
              color: "#9bb0d1"
            },
            grid: {
              color: "rgba(255,255,255,0.08)"
            }
          }
        }
      }
    });
  }

  function renderTable(candles) {
    var html = "";
    var recent = candles.slice(Math.max(0, candles.length - 12)).reverse();
    var i;
    var row;

    for (i = 0; i < recent.length; i += 1) {
      row = recent[i];
      html += "<tr>";
      html += "<td>" + escapeHtml(row.datetime) + "</td>";
      html += "<td>" + formatPrice(row.open) + "</td>";
      html += "<td>" + formatPrice(row.high) + "</td>";
      html += "<td>" + formatPrice(row.low) + "</td>";
      html += "<td>" + formatPrice(row.close) + "</td>";
      html += "</tr>";
    }

    el.recentTableBody.innerHTML = html;
  }

  function getCurrentSessionLevels(dayCandles) {
    var asia = filterBySession(dayCandles, 0, 8);
    var london = filterBySession(dayCandles, 8, 16);
    var newYork = filterBySession(dayCandles, 13, 21);

    return {
      asia: {
        high: getHighestHigh(asia),
        low: getLowestLow(asia)
      },
      london: {
        high: getHighestHigh(london),
        low: getLowestLow(london)
      },
      newYork: {
        high: getHighestHigh(newYork),
        low: getLowestLow(newYork)
      }
    };
  }

  function filterBySession(candles, startHourUtc, endHourUtc) {
    var out = [];
    var i;
    var d;
    var hour;

    for (i = 0; i < candles.length; i += 1) {
      d = new Date(candles[i].timestamp);
      hour = d.getUTCHours();

      if (hour >= startHourUtc && hour < endHourUtc) {
        out.push(candles[i]);
      }
    }

    return out;
  }

  function calculateADR(dailyCandles, periods) {
    var count = 0;
    var sum = 0;
    var i;
    var start;

    if (!dailyCandles.length) {
      return null;
    }

    start = Math.max(0, dailyCandles.length - periods);

    for (i = start; i < dailyCandles.length; i += 1) {
      if (!isNaN(dailyCandles[i].high) && !isNaN(dailyCandles[i].low)) {
        sum += (dailyCandles[i].high - dailyCandles[i].low);
        count += 1;
      }
    }

    if (!count) {
      return null;
    }

    return sum / count;
  }

  function calculateEMA(values, period) {
    var ema = [];
    var multiplier = 2 / (period + 1);
    var sum = 0;
    var sma = null;
    var previousEma = null;
    var i;
    var value;

    for (i = 0; i < values.length; i += 1) {
      value = values[i];

      if (value === null || isNaN(value)) {
        ema.push(null);
        continue;
      }

      if (i < period) {
        sum += value;
        ema.push(null);

        if (i === period - 1) {
          sma = sum / period;
          ema[i] = sma;
          previousEma = sma;
        }
      } else {
        previousEma = ((value - previousEma) * multiplier) + previousEma;
        ema.push(previousEma);
      }
    }

    return ema;
  }

  function getCloseSeries(candles) {
    var out = [];
    var i;

    for (i = 0; i < candles.length; i += 1) {
      out.push(candles[i].close);
    }

    return out;
  }

  function getLowestLow(candles) {
    var lowest = null;
    var i;

    if (!candles.length) {
      return null;
    }

    for (i = 0; i < candles.length; i += 1) {
      if (!isNaN(candles[i].low) && (lowest === null || candles[i].low < lowest)) {
        lowest = candles[i].low;
      }
    }

    return lowest;
  }

  function getHighestHigh(candles) {
    var highest = null;
    var i;

    if (!candles.length) {
      return null;
    }

    for (i = 0; i < candles.length; i += 1) {
      if (!isNaN(candles[i].high) && (highest === null || candles[i].high > highest)) {
        highest = candles[i].high;
      }
    }

    return highest;
  }

  function filterByCurrentDay(candles, now) {
    var out = [];
    var i;
    var d;

    for (i = 0; i < candles.length; i += 1) {
      d = new Date(candles[i].timestamp);

      if (
        d.getUTCFullYear() === now.getUTCFullYear() &&
        d.getUTCMonth() === now.getUTCMonth() &&
        d.getUTCDate() === now.getUTCDate()
      ) {
        out.push(candles[i]);
      }
    }

    return out;
  }

  function filterDailyByCurrentWeek(candles, now) {
    var out = [];
    var i;
    var start = getStartOfWeekUTC(now);
    var end = new Date(start.getTime());
    var d;

    end.setUTCDate(end.getUTCDate() + 7);

    for (i = 0; i < candles.length; i += 1) {
      d = new Date(candles[i].timestamp);

      if (d >= start && d < end) {
        out.push(candles[i]);
      }
    }

    return out;
  }

  function filterDailyByCurrentMonth(candles, now) {
    var out = [];
    var i;
    var d;

    for (i = 0; i < candles.length; i += 1) {
      d = new Date(candles[i].timestamp);

      if (
        d.getUTCFullYear() === now.getUTCFullYear() &&
        d.getUTCMonth() === now.getUTCMonth()
      ) {
        out.push(candles[i]);
      }
    }

    return out;
  }

  function filterDailyByCurrentYear(candles, now) {
    var out = [];
    var i;
    var d;

    for (i = 0; i < candles.length; i += 1) {
      d = new Date(candles[i].timestamp);

      if (d.getUTCFullYear() === now.getUTCFullYear()) {
        out.push(candles[i]);
      }
    }

    return out;
  }

  function getStartOfWeekUTC(date) {
    var d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    var day = d.getUTCDay();
    var diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);

    d.setUTCDate(diff);
    d.setUTCHours(0, 0, 0, 0);

    return d;
  }

  function parseDateTime(str) {
    var parts = str.split(" ");
    var dateParts;
    var timeParts;

    if (parts.length < 2) {
      return new Date(str).getTime();
    }

    dateParts = parts[0].split("-");
    timeParts = parts[1].split(":");

    return Date.UTC(
      parseInt(dateParts[0], 10),
      parseInt(dateParts[1], 10) - 1,
      parseInt(dateParts[2], 10),
      parseInt(timeParts[0], 10),
      parseInt(timeParts[1], 10),
      parseInt(timeParts[2] || 0, 10)
    );
  }

  function formatChartLabel(datetime) {
    var parts = datetime.split(" ");

    if (parts.length < 2) {
      return datetime;
    }

    return parts[0].slice(5) + " " + parts[1].slice(0, 5);
  }

  function formatPrice(value) {
    if (value === null || typeof value === "undefined" || isNaN(value)) {
      return "--";
    }
    return Number(value).toFixed(5);
  }

  function formatPips(value, pair) {
    var pipSize;
    var pips;

    if (value === null || typeof value === "undefined" || isNaN(value)) {
      return "--";
    }

    pipSize = isJpyPair(pair) ? 0.01 : 0.0001;
    pips = value / pipSize;

    return roundTo(pips, 1) + " pips";
  }

  function isJpyPair(pair) {
    return pair.indexOf("JPY") !== -1;
  }

  function getLastValidValue(arr) {
    var i;

    for (i = arr.length - 1; i >= 0; i -= 1) {
      if (arr[i] !== null && !isNaN(arr[i])) {
        return arr[i];
      }
    }

    return null;
  }

  function roundTo(value, decimals) {
    var factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  init();
    
    function evaluateTradeSignal(price, ema20Arr, ema50Arr, ema200Arr, sessions, dailyLow, dailyRange, adr) {

  var ema20 = getLastValidValue(ema20Arr);
  var ema50 = getLastValidValue(ema50Arr);
  var ema200 = getLastValidValue(ema200Arr);

  var trendBullish = false;
  var nearLow = false;
  var bounce = false;
  var rangeOk = false;
  var sessionActive = false;

  var now = new Date();
  var hour = now.getUTCHours();

  if (price > ema20 && ema20 > ema50 && ema50 > ema200) {
    trendBullish = true;
  }

  var pipTolerance = price.toString().indexOf("JPY") !== -1 ? 0.10 : 0.0005;

  if (
    Math.abs(price - dailyLow) <= pipTolerance ||
    Math.abs(price - sessions.london.low) <= pipTolerance ||
    Math.abs(price - sessions.newYork.low) <= pipTolerance
  ) {
    nearLow = true;
  }

  if (price > ema20) {
    bounce = true;
  }

  if (dailyRange !== null && adr !== null) {
    if (dailyRange < (adr * 0.8)) {
      rangeOk = true;
    }
  }

  if ((hour >= 8 && hour <= 16) || (hour >= 13 && hour <= 21)) {
    sessionActive = true;
  }

  if (trendBullish && nearLow && bounce && rangeOk && sessionActive) {
    el.tradeSignal.innerHTML = "BUY";
el.tradeSignal.classList.add("signal-buy");
    el.tradeSignal.classList.remove("signal-buy", "signal-wait");
  } else {
    el.tradeSignal.innerHTML = "WAIT";
el.tradeSignal.classList.add("signal-wait");
    el.tradeSignal.classList.remove("signal-buy", "signal-wait");
  }

}
}());
