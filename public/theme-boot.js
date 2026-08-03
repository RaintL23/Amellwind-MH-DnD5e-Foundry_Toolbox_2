(function () {
  var key = "mh-toolbox-theme";
  var stored = localStorage.getItem(key);
  var theme =
    stored === "light" || stored === "dark" || stored === "mh"
      ? stored
      : "mh";
  document.documentElement.setAttribute("data-theme", theme);
  if (theme !== "light") document.documentElement.classList.add("dark");
})();
