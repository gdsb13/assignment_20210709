// init project
var express = require("express");
var db;
var app = express();
var bodyParser = require("body-parser");

// Using `public` for static files: http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

var usersMap = new Map();

// Sample users with schema - identity, role, balance metrics
// This can be added to mongoDB, but for assignment adding it to in memory structure
var adminUser = {
  appId: "admin",
  appKey: "123456",
  role: "administrator",
  balance: 0,
  balanceValidity: 0,
  balanceAdded: new Date(),
  balanceUpdatedAt: new Date(),
  passbook: []
};
var sampleUser = {
  appId: "user1",
  appKey: "123456",
  role: "user",
  balance: 0,
  balanceValidity: 30,
  balanceAdded: new Date(),
  balanceUpdatedAt: new Date(),
  passbook: []
};

var sampleUser2 = {
  appId: "user2",
  appKey: "123456",
  role: "user",
  balance: 0,
  balanceValidity: 30,
  balanceAdded: new Date(),
  balanceUpdatedAt: new Date(),
  passbook: []
};

// Use bodyParser to parse application/x-www-form-urlencoded form data
var urlencodedParser = bodyParser.urlencoded({ extended: false });

usersMap.set(adminUser.appId, adminUser);
usersMap.set(sampleUser.appId, sampleUser);
usersMap.set(sampleUser2.appId, sampleUser2);

// Send user data - used by client.js
app.get("/users", function (request, response) {
  if (true) {
    // add auth in request header (appId, app key)
    let users = [];
    let it = usersMap[Symbol.iterator]();

    for (let item of it) {
      users.push({
        name: item[0],
        balance: item[1].balance,
        passbook: item[1].passbook
      });
    }
    // finds all entries in the users collection
    response.send(users); // sends users back to the page
  } else {
    // Placeholder: send unauthorized 401
    response.send(401, "Unauthorized");
  }
});

// Create a new entry in the users collection
app.post("/update", urlencodedParser, function (request, response) {
  let user = request.body.user;
  let useBalance = Number(request.body.deductBalance);
  if (usersMap.has(user)) {
    let foundUser = usersMap.get(user);
    if (!Number.isNaN(useBalance)) {
      if (foundUser.balance > useBalance) {
        foundUser.balance -= useBalance;
        foundUser.passbook.push({
          deducted: useBalance,
          transactionDate: new Date()
        });
        usersMap.set(foundUser.appId, foundUser);
      } else {
        response.send(400, "Insufficient balance for user: " + user);
      }
    } else {
      response.send(400, "Invalid balance deduction request");
    }
  } else {
    response.send(404, "User not found");
  }
  console.log("Updated a user");
  response.redirect("/");
});

app.post("/topup", urlencodedParser, function (request, response) {
  let user = request.body.user;
  let addBalance = Number(request.body.addBalance);
  let promo = request.body.promo;
  if (usersMap.has(user)) {
    let foundUser = usersMap.get(user);
    if (!Number.isNaN(addBalance)) {
      if (addBalance > 0) {
        if (promo == "WELCOME") {
          if (foundUser.passbook.length == 0) {
            if (addBalance > 50) {
              foundUser.balance += addBalance + 20;
              foundUser.passbook.push({
                topup: addBalance + 20,
                transactionDate: new Date(),
                promo: promo
              });
            } else {
              response.send(
                400,
                "Invalid promo: added balance is less than $50. TopUp not successful"
              );
            }
          } else {
            // Not first recharge so invalid promo
            response.send(400, "Invalid promo: This is not the first recharge");
          }
        } else if (promo == "GAGAN") {
          // THIS CASE IS NOT CLEAR
          // 10% of recharge amount upto $50 means what?
          // Discount on topup? Or extra 10% on topup?
          // Going with extra 10% of topup upto 50
          if (addBalance > 0) {
            let topUpPromo = addBalance / 10 > 50 ? 50 : addBalance / 10;
            foundUser.balance += addBalance + topUpPromo;
            foundUser.passbook.push({
              topup: addBalance + topUpPromo,
              transactionDate: new Date(),
              promo: promo
            });
          } else {
            response.send(400, "Invalid topup value!");
          }
        } else {
          foundUser.balance += addBalance;
          foundUser.passbook.push({
            topup: addBalance,
            transactionDate: new Date(),
            promo: "none"
          });
        }

        usersMap.set(foundUser.appId, foundUser);
      } else {
        response.send(400, "Invalid topup amount for user: " + user);
      }
    } else {
      response.send(400, "Invalid topup value");
    }
  } else {
    response.send(404, "User not found");
  }
  console.log("Updated a user");
  response.redirect("/");
});

// Removes users from users collection and re-populates with the default users
app.get("/reset", function (request, response) {
  usersMap = new Map();
  usersMap.set(adminUser.appId, adminUser);
  usersMap.set(sampleUser.appId, sampleUser);
  response.redirect("/");
});

// Serve the root url: http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile("/sandbox/views/index.html");
});

// Listen on port 8080
var listener = app.listen(8080, function () {
  console.log("Listening on port " + listener.address().port);
});

// Periodic function to check expired balances
var checkBalanceExpiry = function () {
  let it = usersMap[Symbol.iterator]();
  let currentDate = new Date();
  for (let item of it) {
    if (
      currentDate - item[1].balanceUpdatedAt >
      item[1].balanceValidity * 24 * 60 * 60 * 1000
    ) {
      item[1].balance = 0;
    }
  }
};

setInterval(checkBalanceExpiry, 1000);
