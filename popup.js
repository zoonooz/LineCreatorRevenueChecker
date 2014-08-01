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
    var response = e.target.response;
    var responseJson = JSON.parse(response);

    console.log(e.target.period + " revenue in thai = " 
      + responseJson.v.toFixed(2));
  }

}

var lineService = {

  // function for check login
  checkLogin: function() {
    var req = new XMLHttpRequest();
    req.open("GET", checkLoginUrl, true);
    req.onload = this.checkLoginHandler_.bind(this);
    req.send(null);
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

    } else {
      // show login form
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

    // convert currency
    currencyService.convertJPY("THB", todayRevenue, "today");
    currencyService.convertJPY("THB", monthRevenue, "month");
  }

}

// Run cript as soon as the document's DOM is ready.
document.addEventListener('DOMContentLoaded', function () {
  lineService.checkLogin();
});