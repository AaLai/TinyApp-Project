
// --- Requiring and setting apps
const express = require("express");
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const PORT = 8080;
const app = express();


app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(cookieSession({
  keys: ['key1', 'key2']
}));

// --- User Database

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "test"
  }
}

// --- Database for long and short URls

const urlDatabase = {
  "b2xVn2": {
    user_id: 'userRandomID',
    longurl: 'http://www.lighthouselabs.ca'
  },
  "9sm5xK": {
    user_id: 'userRandomID',
    longurl: 'http://www.google.com'
  },
  "testme": { user_id : 'user2RandomID',
    longurl: 'https://mangadex.org'
  }
}

// --- URLs for song management UI

app.get("/", (req, res) => {
  if (req.session.user_id && users[req.session.user_id]) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    user: users,
    login: req.session.user_id
  }
  if (req.session.user_id) {
    if (!users[req.session.user_id]) {
      res.send('403 Error');
    } else {
      res.render("urls_index", templateVars);
    }
  } else {
    res.send('403 Error, please log in.')
  }
});

app.get("/urls/new", (req, res) => {
  if (users[req.session.user_id]) {
    let templateVars = {
      user: users,
      login: req.session.user_id,
      urls: urlDatabase
    }
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/login');
  }
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    urls: urlDatabase,
    user: users,
    login: req.session.user_id
  }
  if (users[req.session.user_id] && req.session.user_id === urlDatabase[req.params.id].user_id) {
    res.render("urls_show", templateVars);
  } else if (users[req.session.user_id] && req.session.user_id !== urlDatabase[req.params.id].user_id) {
    res.send('403 Forbidden');
  } else if (!urlDatabase[req.params.id]) {
    res.send('404 Not Found');
  } else if (!users[req.session.user_id]) {
    res.send('403 Forbidden');
  }
});

// --- url to link short URLs to long

app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    res.send(`(╯°□°）╯︵ |${req.params.shortURL}| 404 error, this doesn't exist yet!`);
  } else {
    let longURL = urlDatabase[req.params.shortURL].longurl;
    res.redirect(longURL);
  }
});

// --- short URL creation and management

app.post("/urls", (req, res) => {
  if (users[req.session.user_id]) {
    var randString = generateRandomString();
    urlDatabase[randString] = { longurl : req.body.longURL };
    urlDatabase[randString].user_id = req.session.user_id ;
    res.redirect(`/urls/${randString}`);
  } else {
    res.send('403 Forbidden');
  }
});

app.post("/urls/:id", (req, res) => {
  if (users[req.session.user_id] && req.session.user_id === urlDatabase[req.params.id].user_id) {
    urlDatabase[req.params.id].longurl = req.body.longURLUpdate;
    res.redirect('/urls');
  } else if (users[req.session.user_id] && req.session.user_id !== urlDatabase[req.params.id].user_id) {
    res.send('403 Forbidden');
  } else if (!users[req.session.user_id]) {
    res.send('403 Forbidden');
  }
});

app.post("/urls/:id/delete", (req, res) => {
  if (users[req.session.user_id] && req.session.user_id === urlDatabase[req.params.id].user_id) {
    delete urlDatabase[req.params.id];
    res.redirect('/urls');
  } else if (users[req.session.user_id] && req.session.user_id !== urlDatabase[req.params.id].user_id) {
    res.send('403 Forbidden');
  } else if (!users[req.session.user_id]) {
    res.send('403 Forbidden');
  }
});

// --- User account management URLs

app.get("/login", (req, res) => {
  let templateVars = {
    user: users,
    urls: urlDatabase,
    login: req.session.user_id
  }
  if (users[req.session.user_id]) {
    res.redirect('/urls');
  } else {
    res.render("urls_login", templateVars);
  }
});

app.post("/login", (req, res) => {
  let userPassword = bcrypt.compareSync(req.body.password.toString(), filter(users, req.body.email, 'email', 'password').toString())
  if (!req.body.email || !req.body.password) {
    res.send(' (╯°□°）╯︵ 400 Error: are you sure everything is filled in?');
  } else if (!userPassword) {
    res.send(' (╯°□°）╯︵ 400 something didn\'t work out, try again!');
  } else if (!req.session.user_id) {
    req.session.user_id = filter(users, req.body.email, 'email', 'id');
    res.redirect('/urls');
  } else {
    res.redirect('/urls');
  }
});


app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/');
});

app.get("/register", (req, res) => {
  if (users[req.session.user_id]) {
    res.redirect('/urls')
  } else {
    let templateVars = {
      urls: urlDatabase,
      user: users,
      login: req.session.user_id
    }
    res.render("urls_reg", templateVars);
  }
});

app.post("/register", (req, res) => {
  let randomID = generateRandomString();
  if (!req.body.email || !req.body.password) {
    res.send("(╯°□°）╯︵ |400|  Bad Request: Make sure both fields are filled in!");
  } else if (inObjectChecker(users, req.body.email, 'email')) {
    res.send("(╯°□°）╯︵ |400| Bad Request");
  } else if (!users[randomID]) {
    users[randomID] = {
      id: randomID,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10)
    }
    req.session.user_id = randomID;
    res.redirect("/urls");
  } else {
    let randomID2 = generateRandomString();
    users[randomID2] = {
      id: randomID2,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10)
    }
    req.session.user_id = randomID2;
    res.redirect("/urls");
  }
});

// --- Debug console logger
// app.get("/debug", (req, res) => {
//   console.log(users);
//   console.log(urlDatabase);
//   res.redirect('/');
// });

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// --- Filters and random string generator

  function generateRandomString() {
    let r = Math.random().toString(36).substring(7);
      return r;
    }

  const inObjectChecker = (object, checkAgainst, input) => {
    let isItThere = false;
    for (let x in object) {
      if (object[x][input] === checkAgainst) {
        isItThere = true;
      }
    }
    return isItThere;
  }

  const filter = (object, checkAgainst, input, output) => {
    const checkAgainstStr = checkAgainst.toString();
    const outputStr = output.toString();
    let result = false;
    if (input === null) {
      for (let x in object) {
        const keys = Object.keys(object[x]);
        keys.forEach(function(key) {
          if (key === checkAgainstStr) {
            result = object[x][key];
          }
        });
      }
    } else {
      const inputStr = input.toString();
      for (let x in object) {
        if (object[x][inputStr] === checkAgainstStr) {
          result = object[x][outputStr];
        }
      }
    }
    return result;
  }