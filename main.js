// What to do when the OS loads
async function initialize() {
  // Register buttons here
  const barButtonHandles = [
    await t.requireAsync('js/buttons/home'),
    await t.requireAsync('js/buttons/open'),
    await t.requireAsync('js/buttons/docs'),
    await t.requireAsync('js/buttons/pomodoro'),
  ];

  // Choose a page to start on
  const url = new URL(document.location);
  const pageSelection = url.searchParams.get('page');
  const storedPage = localStorage.getItem('lastOpenedAppName');
  if(pageSelection)
    await navigateAsync(pageSelection);
  else if(storedPage)
    await navigateAsync(storedPage);
  else
    await navigateAsync('home');

  // Populate button bar with buttons
  const bar = document.getElementById('os-bar');
  for(const handle of barButtonHandles) {
    const button = document.createElement('div');
    button.onclick = () => handle.onclick(navigateAsync);
    button.title = handle.title;
    const canvas = document.createElement('canvas');
    canvas.width = 20;
    canvas.height = 20;
    const ctx = canvas.getContext('2d');
    handle.draw(ctx);
    button.appendChild(canvas);
    bar.appendChild(button);
  }

  // Communication with page
  const messaging = await t.requireAsync('js/system/messaging');
  const pageWindow = document.getElementById('app-frame').contentWindow;
  messaging.register(
    'os/navigate',
    appName => navigateAsync(appName),
    pageWindow);
  messaging.register(
    'os/showBar',
    show => show
      ? document.getElementById('header').classList.remove('hide')
      : document.getElementById('header').classList.add('hide'),
    pageWindow);
  messaging.register(
    'os/updateTitle',
    text => document.title = text,
    pageWindow);
}

// How to navigate to a page within the OS
async function navigateAsync(pageName) {
  document.getElementById('app-frame').src = `pages/${pageName}.html`;
  document.title = `${pageName} . HTMLOS`;
  localStorage.setItem('lastOpenedAppName', pageName);
}
