// Copyright (c) 2014 Amornchai Kanokpullwad. All rights reserved.
// Use of this source code is governed by a GNU V2 license that can be
// found in the LICENSE file.

var currencyURL = "http://rate-exchange.appspot.com/currency"
var lineCreatorUrl = "https://creator.line.me"
var checkLoginUrl = "https://creator.line.me/signup/line_auth"

var currencyService = {

  // function for convert JPY to user currency
  convertJPY: function(to, amount, period) {
    var req = new XMLHttpRequest();
    req.period = period
    req.open("GET", currencyURL + "?from=JPY&to=" + to + "&q=" + amount, true);
    req.onload = this.convertJPYHandler_.bind(this);
    req.send(null);
  },
  convertJPYHandler_: function(e) {
    document.getElementById('loading').style.display = 'none';
    var response = e.target.response;
    var responseJson = JSON.parse(response);
    var revenue = responseJson.v.toFixed(0);
    console.log(e.target.period + " revenue in currency = " + revenue);
    document.getElementById(e.target.period + "Cur")
      .innerHTML = numberWithCommas(revenue);
  }

}

var lineService = {

  // function for check login
  checkLogin: function() {
    var req = new XMLHttpRequest();
    req.open("GET", checkLoginUrl, true);
    req.onload = this.checkLoginHandler_.bind(this);
    req.send(null);
    document.getElementById('loading').style.display = 'block';
  },
  checkLoginHandler_: function(e) {
    var response = e.target.response;
    var responseHtml = new DOMParser().parseFromString(response, 'text/html');
    var title = responseHtml.title;
    
    if (title == "MY PAGE - LINE Creators Market") {
      // continue to get revenue
      var xPathRes = responseHtml.evaluate(".//a[text()='Sales Report']/@href",
            responseHtml, null, XPathResult.ANY_TYPE, null);
      var actualATag = xPathRes.iterateNext();
      
      if (actualATag) {
        var revenueLink = actualATag.value;
        if (revenueLink != "") {
          this.getRevenue(lineCreatorUrl + revenueLink);
        }
        return;
      } 
        
      // unexpected error if reached here
      document.getElementById('loading').style.display = 'none';

    } else {
      // open login tab
      chrome.tabs.create({url: checkLoginUrl});
    }
  },

  // get revenue for today and this month
  getRevenue: function(link) {
    var req = new XMLHttpRequest();
    req.open("GET", link, true);
    req.onload = this.getRevenueHandler_.bind(this);
    req.send(null);
  },
  getRevenueHandler_: function(e) {

    var response = e.target.response;
    var responseHtml = new DOMParser().parseFromString(response, 'text/html');

    var xPathRes = responseHtml.evaluate(".//td[@class='mdCMN18Total']",
            responseHtml, null, XPathResult.ANY_TYPE, null);
    var totalTag = xPathRes.iterateNext();

    // today revenue
    var todayRevenue = 0;
    if (totalTag) {
      todayRevenue = parseInt(totalTag.innerHTML.split("&nbsp;")[1]);
    }

    // month revenue
    var monthRevenue = 0;
    while (totalTag) {
      var sumOfday = totalTag.innerHTML.split("&nbsp;")[1];
      monthRevenue += parseInt(sumOfday);
      totalTag = xPathRes.iterateNext();
    }

    console.log("today revenue = " + todayRevenue);
    console.log("this month revenue = " + monthRevenue);

    var currency = document.getElementById('cur-select').value;
    if (currency != "JPY") {
      document.getElementById("todayJPY")
        .innerHTML = numberWithCommas(todayRevenue);
      document.getElementById("monthJPY")
        .innerHTML = numberWithCommas(monthRevenue);
      currencyService.convertJPY(currency, todayRevenue, "today");
      currencyService.convertJPY(currency, monthRevenue, "month");
    } else {
      document.getElementById('loading').style.display = 'none';
      document.getElementById("todayCur")
        .innerHTML = numberWithCommas(todayRevenue);
      document.getElementById("monthCur")
        .innerHTML = numberWithCommas(monthRevenue);
    }
  }

}

// utils
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Saves options to chrome.storage
function save_options() {
  var currency = document.getElementById('cur-select').value;
  chrome.storage.sync.set({
    currency: currency
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options(callback) {
  // Use default value currency = 'JPY'
  chrome.storage.sync.get({
    currency: 'JPY'
  }, function(items) {
    document.getElementById('cur-select').value = items.currency;
    callback();
  });
}

// layout
function layoutUI() {
  // remove unused element if currency is JPY
  var currency = document.getElementById('cur-select').value;
  document.getElementById('todayCur-unit').innerHTML = currency;
  document.getElementById('monthCur-unit').innerHTML = currency;
  if (currency == "JPY") {
    document.body.parentNode.style.height = "300px";
    document.body.style.height = "300px";
    document.getElementById('today-sub').style.display = 'none';
    document.getElementById('month-sub').style.display = 'none';
  } else {
    document.getElementById('today-sub').style.display = 'block';
    document.getElementById('month-sub').style.display = 'block';
  }
}

// Run cript as soon as the document's DOM is ready.
document.addEventListener('DOMContentLoaded', function () {

  document.getElementById('ads').onclick = function() {
    chrome.tabs.create(
      {url: "https://store.line.me/stickershop/product/1001268/"}
    );
  }

  // register on currency change
  document.getElementById('cur-select').onchange = function() {
    document.getElementById("todayCur").innerHTML = "-";
    document.getElementById("monthCur").innerHTML = "-";

    save_options();
    layoutUI();
    lineService.checkLogin();
  }

  restore_options(function() {
    layoutUI();
    lineService.checkLogin();
  });
  
});

var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-44460572-2']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();