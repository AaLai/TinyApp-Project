const express = require("express");
const cookieParser = require('cookie-parser')
const app = express();
const bodyParser = require("body-parser");
const PORT = 8080; // default port 8080


app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(cookieParser());

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

const urlDatabase = { userRandomID: {
                            "b2xVn2": "http://www.lighthouselabs.ca",
                            "9sm5xK": "http://www.google.com"
                            },
                      user2RandomID: {
                            "testme": "https://mangadex.org"
                            }
                    };

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase,
                       user: users,
                       login: req.cookies['user_id']
                     };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  var randString = generateRandomString();
  // console.log(req.body);
  // console.log(req.body.longURL);
  urlDatabase[req.cookies['user_id']][randString] = req.body.longURL;
  // console.log(urlDatabase)   //debug statement!
  res.redirect(`/urls/${randString}`);
});

app.get("/urls/new", (req, res) => {
  if (!req.cookies['user_id']) {
    res.redirect('/login');
  } else {
  let templateVars = { user: users ,
                       login: req.cookies['user_id'],
                       urls: urlDatabase };
  res.render("urls_new", templateVars);
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id,
                       urls: urlDatabase,
                       user: users,
                       login: req.cookies['user_id']
                     };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id/update", (req, res) => {
  // console.log(req.body.longURLUpdate);
  urlDatabase[req.cookies['user_id']][req.params.id] = req.body.longURLUpdate;
  res.redirect('/urls');
})

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
  // console.log(urlDatabase);
});



app.get("/u/:shortURL", (req, res) => {
  if (filter(urlDatabase, req.params.shortURL, null, req.params.shortURL) === false) {
    res.send(`404 error, this doesn't exist yet! I do like what you did with ${req.params.shortURL} though!`);
  } else {
    let longURL = filter(urlDatabase, req.params.shortURL, null, req.params.shortURL);
  // console.log(longURL);  // debug statement!
    res.redirect(longURL);
  }
});


app.get("/login", (req, res) => {
  let templateVars = { user: users,
                       urls: urlDatabase,
                       login: req.cookies['user_id']
  }
  if (!req.cookies['user_id']) {
    res.render("urls_login", templateVars);
  } else if (req.cookies['user_id'] === users[req.cookies['user_id']].id ) {
    res.redirect('/urls');
  } else {
    res.render("urls_login", templateVars)
  }
})

app.post("/login", (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.send('400 Error: already you sure everything is filled in?');
  }else if (!specificFilter(users, req.body.email, req.body.password, 'email', 'password')) {
    res.send('400 something didn\'t work out, try again!')
  } else if (!req.cookies['user_id']) {
    res.cookie('user_id', filter(users, req.body.email, 'email', 'id'));
    res.redirect('/urls');
  } else {
    res.redirect('/urls');
  }
})


app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
})


app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});


app.get("/register", (req, res) => {
  let templateVars = { urls: urlDatabase,
                       user: users,
                       login: req.cookies['user_id']
                     };
  res.render("urls_reg", templateVars);
});

app.post("/register", (req, res) => {
  let randomID = generateRandomString();
  if (!req.body.email || !req.body.password) {
    res.send("400 Bad Request: Make sure both fields are filled in!");
  } else if (inObjectChecker(users, req.body.email, 'email')) {
    res.send("400 Bad Request: email already taken");
  } else if (!users[randomID]) {
      users[randomID] = { id: randomID,
                          email: req.body.email,
                          password: req.body.password
                        };
      urlDatabase[randomID] = {};
                        // console.log(users)
    res.cookie('user_id', randomID);
    res.redirect("/urls");
  } else {
    let randomID2 = generateRandomString();
      users[randomID2] = { id: randomID2,
                           email: req.body.email,
                           password: req.body.password
                         };
      urlDatabase[randomID2] = {};
                         // console.log(users)
    res.cookie('user_id', randomID2);
    res.redirect("/urls");

  }
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


  function generateRandomString() {
    let r = Math.random().toString(36).substring(7);
      return r;
    }

  const existanceChecker = (database, input, input2, input3) => {
    if (input3 !== undefined) {
      return database[input][input2][input3];
    } else if (input2 !== undefined) {
      return database[input][input2];
    } else {
      return database[input];
    }
  }

  const inObjectChecker = (object, checkAgainst, input) => {
    let isItThere = false;
    for (let x in object) {
      if (object[x][input] == checkAgainst) {
        isItThere = true;
      }
    }
    return isItThere;
  }

  const filter = (object, checkAgainst, input, output) => {
    const checkAgainstStr = checkAgainst.toString();
    const outputStr = output.toString();
    let thing = false;
    if (input === null) {
      for (let x in object) {
        const keys = Object.keys(object[x]);
        keys.forEach(function(key) {
          if (key === checkAgainstStr) {
            thing = object[x][key];
          }
        });
      }
    } else {
      const inputStr = input.toString();
      for (let x in object) {
        if (object[x][inputStr] === checkAgainstStr) {
          thing = object[x][outputStr];
        }
      }
    }
    return thing;
  }

  const specificFilter = (object, checkAgainst1, checkAgainst2, input1, input2) => {
    let filter = false;
    for (let x in object) {
      if (object[x][input1] == checkAgainst1 && object[x][input2] == checkAgainst2) {
        filter = true;
      }
    }
    return filter;
  }