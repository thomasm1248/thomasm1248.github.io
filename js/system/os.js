'use strict';
t.module(async () => {
  const e = {};

  const messaging = await t.requireAsync('js/system/messaging');

  const sendNavigateMessage = messaging.register('os/navigate', null);
  const sendShowBarMessage = messaging.register('os/showBar', null);
  const sendUpdateTitleMessage = messaging.register('os/updateTitle', null);

  // Public functions

  e.navigate = appName =>
    sendNavigateMessage(appName);

  e.showBar = show =>
    // showBar(true) -> shows OS header
    // showBar(false -> hides OS header
    sendShowBarMessage(show);

  e.updateTitle = text =>
    // Renames the title displayed in the
    // page's tab (document.title).
    sendUpdateTitleMessage(text);

  return e;
});
