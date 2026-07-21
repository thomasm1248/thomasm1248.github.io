'use strict';
t.module(() => {
  const e = {};

  // Utility functions
  
  function parsePath(path) {
    return path.split('/');
  }

  // Public functions

  e.openRootAsync = async () =>
    // returns a folder handle chosen by the user
    await window.showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'desktop',
    });

  e.readFileAsync = async (folder, path) => {
    path = parsePath(path);
    let currentHandle = folder;
    for(let i = 0; i < path.length; i++) {
      const isFile = i === path.length - 1;
      currentHandle = isFile
        ? await currentHandle.getFileHandle(path[i])
        : await currentHandle.getDirectoryHandle(path[i]);
    }
    const file = await currentHandle.getFile();
    return await file.text();
  };

  e.writeFileAsync = async (folder, path, text) => {
    path = parsePath(path);
    let currentHandle = folder;
    for(let i = 0; i < path.length; i++) {
      const isFile = i === path.length - 1;
      currentHandle = isFile
        ? await currentHandle.getFileHandle(path[i], { create: true })
        : await currentHandle.getDirectoryHandle(path[i], { create: true });
    }
    const file = await currentHandle.createWritable();
    await file.write(text);
    await file.close();
  };

  e.deleteFileAsync = async (folder, path, text) => {
    path = parsePath(path);
    let currentHandle = folder;
    for(let i = 0; i < path.length; i++) {
      const isFile = i === path.length - 1;
      if(isFile) {
        await currentHandle.removeEntry(path[i]);
        return;
      }
      currentHandle = await currentHandle.getDirectoryHandle(path[i]);
    }
  };

  return e;
});
