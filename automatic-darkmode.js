var darkmodePermanentlyOn = false;

(() => {
  const isNightTime = date =>
    // date => bool
    // Decides wether a given time counts as night
    // for the purposes of darkmode on this website
    date.getHours() < 6 || // < 6:00 am
    date.getHours() > 18;  // > 6:59 pm

  const setDarkMode = darkModeEnabled => {
    const body = document.getElementsByTagName('body')[0];
    if(darkModeEnabled)
      body.classList.add('night-time');
    else
      body.classList.remove('night-time');
  };

  const checkForDarkMode = () =>
    setDarkMode(
      darkmodePermanentlyOn ||
      isNightTime(
        new Date()));

  checkForDarkMode();

  setInterval(checkForDarkMode, 60000);

})();
