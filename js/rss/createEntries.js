'use strict';
t.module(async () => {
  const {
    files,
    format,
    catagoryList,
  } = await t.requireModulesAsync({
    files: 'js/system/fileAccess',
    format: 'js/rss/format',
    catagoryList: 'js/rss/catagories',
  });
  
  function createForm() {
    const {
      root,
      refs,
    } = t.createComponent(`
      <div class='rss-entry-form'>
        <input data-ref='title' placeholder='Title'/><br>
        <textarea data-ref='desc' cols='40' rows='20'></textarea><br>
        <input data-ref='link' placeholder='URL'/><br>
        <input data-ref='date' type='datetime-local' /><br>
        <select data-ref='catagory'></select><br>
        <button data-ref='preview' type='button'>Preview</button><br>
        <textarea data-ref='output' rows='50'></textarea><br>
        <button data-ref='apply' type='button'>Apply</button>
      </div>
    `);

    // Populate catagory options
    catagoryList.forEach(cat => {
      const { root: option } = t.createComponent(`
        <option value='${cat}'>${cat}</option>
      `);
      refs.catagory.appendChild(option);
    });

    // Set current date-time
    const pad = n => String(n).padStart(2, '0');
    const now = new Date();
    refs.date.value = [
      now.getFullYear(),
      pad(now.getMonth() + 1),
      pad(now.getDate())
    ].join('-') + 'T' + [
      pad(now.getHours()),
      pad(now.getMinutes())
    ].join(':');

    // Cache reference to root folder of system
    let folder = null;

    // Route output to callback
    refs.preview.onclick = async e => {
      debugger;
      const title = refs.title.value;
      const desc = refs.desc.value;
      const url = refs.link.value;
      const date = new Date(refs.date.value);
      const catagory = refs.catagory.value;

      // Read file
      if(!folder)
        folder = await files.openRootAsync();
      const currentText = await files.readFileAsync(folder, 'rss.xml');

      // Create new RSS entry
      const newEntry =
`  INSERT AFTER HERE -->

  <item>
    <title>${title}</title>
    <description>${desc}</description>
    <link>${url}</link>
    <pubDate>${format.formatDate(date)}</pubDate>
    <category>${catagory}</category>
  </item>`;

      // Insert entry into existing RSS
      const newText = currentText.replace('  INSERT AFTER HERE -->', newEntry);

      // Test output
      refs.output.value = newText;
    };

    refs.apply.onclick = async e => {
      // Get previewed text
      const newText = refs.output.value;

      // Write new text to the RSS file
      const currentText = await files.writeFileAsync(folder, 'rss.xml', newText);
    };

    return root;
  }

  return {
    createForm,
  };
});
