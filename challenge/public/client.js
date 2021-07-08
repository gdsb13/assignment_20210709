$(function () {
  $.get("/users", function (users) {
    users.forEach(function (user) {
      $("<li></li>")
        .text(
          user.name +
            " balance: " +
            user.balance +
            " passbook: " +
            JSON.stringify(user.passbook)
        )
        .appendTo("ul#users");
    });
  });
});
