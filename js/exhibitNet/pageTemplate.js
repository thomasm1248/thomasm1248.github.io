t.module(`
<!DOCTYPE html>
<html>
<head>
  <title>TITLE</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>

body {
  max-width: 35rem;
  margin: 3rem auto 0;
  padding: 1rem;
}
.main-image {
  margin: 1em auto;
  display: block;
  max-width: 35rem;
  max-height: 27rem;
}
body > p {
  border: 1px solid black;
  padding: .5rem;
  border-radius: .3rem;
}
#action-list {
  max-width: 25rem;
  margin: 0 auto;
}
#action-list button:active {
  background-color: gray;
}

#action-list button:hover {
  background-color: lightgray;
}
#action-list button {
  display: block;
  border: 1px solid black;
  margin: 1rem;
  padding: 0.5rem;
  background-color: white;
}
footer {
  border-top: 1px solid black;
}

  </style>
</head>
<body>

  <h1>TITLE</h1>
  <img src="IMGURL" class='main-image'/>
  <p>DESC</p>
  <div id='action-list'>
    <!-- <button>'s go here -->
  </div>
  <footer>
    <p>Maintained by <a href='mailto:EMAIL'>EMAIL</a></p>
  </footer>

  <script>

// Connect to page elements
const actionList = document.getElementById('action-list');

// DATASTART
const data = $DATA$;
// DATAEND

// Format data to make it more useful
data.actions.forEach(action => {
  action.trueFacts = asFactDict(action.trueFacts ?? []);
  action.falseFacts = asFactDict(action.falseFacts ?? []);
  action.addFacts = asFactDict(action.addFacts ?? []);
  action.removeFacts = asFactDict(action.removeFacts ?? []);
});

// Read facts from URL:
//   https://...#sourceURL&fact1&fact2&fact3...
//   -> [ sourceURL, fact1, fact2, fact3, ... ]
const inputArgs = window.location.hash.substring(1).split('&');
let currentFacts = inputArgs.slice(1);
const previousLocation = inputArgs[0] ?? '';
currentFacts = asFactDict(currentFacts);
console.log(previousLocation, currentFacts);

// Core logic
function reloadActions() {
  clearActions();
  while(true) {
    const availableActions = getAvailableActions(data.actions, currentFacts);
    const automaticAction = availableActions.find(action => action.auto);
    if(!automaticAction) {
      displayActions(availableActions, action => {
        applyAction(action);
        reloadActions();
      });
      break;
    }
    applyAction(automaticAction);
  }
}
reloadActions();
function applyAction(action) {
  removeFactsFromDict(action.removeFacts, currentFacts);
  addFactsToDict(action.addFacts, currentFacts);
  if(action.jumpTo) jumpTo(action.jumpTo);
}
function jumpTo(destinationUrl) {
  const currentLocation = window.location.origin + window.location.pathname;
  const args = [ currentLocation, ...asFactList(currentFacts) ];
  followLink(destinationUrl + '#' + args.join('&'));
}
// TODO use mailto link to report the following things:
// - source links that aren't acknowledged
// - facts that aren't awknowledged
// - a situation where there are no available actions

// More logic (pure functions)
function getAvailableActions(actionList, currentFacts) {
  return actionList
    .filter(action => {
      for(const fact in { ...action.trueFacts, ...action.falseFacts }) {
        const required = action.trueFacts[fact] ?? 0;
        const banned = action.falseFacts[fact] ?? 0;
        const current = currentFacts[fact] ?? 0;
        if(current < required) return false;
        if(current - required > 0 && banned > 0) return false;
      }
      return true;
    });
}
function asFactDict(factList) {
  const dict = {};
  for(const fact of factList) {
    if(!dict[fact])
      dict[fact] = 0;
    dict[fact] = dict[fact] + 1;
  }
  return dict;
}
function asFactList(factDict) {
  const list = [];
  for(const key in factDict) {
    for(let i = 0; i < factDict[key]; i++)
      list.push(key);
  }
  return list;
}
function addFactsToDict(newFacts, factDict) {
  for(const fact in newFacts) {
    if(!factDict[fact])
      factDict[fact] = 0;
    factDict[fact] = factDict[fact] + newFacts[fact];
  }
}
function removeFactsFromDict(oldFacts, factDict) {
  for(const fact in oldFacts) {
    if(!factDict[fact]) continue;
    factDict[fact] = factDict[fact] - oldFacts[fact];
    if(factDict[fact] <= 0) delete factDict[fact];
  }
}

// Document control
function clearActions() {
  actionList.innerHTML = '';
}
function displayActions(actions, callback) {
  actions.forEach(action => {
    const button = document.createElement('button');
    button.innerText = action.label;
    button.onclick = () => callback(action);
    actionList.appendChild(button);
  });
}
function followLink(url) {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.click();
}

  </script>
</body>
</html>
`);
