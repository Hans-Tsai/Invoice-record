if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const express = require('express')
const app = express()
const port = process.env.PORT || 3000
const routes = require('./routes/api')

const mongoose = require('mongoose')
const Invoice = require('./models/invoiceModel')

const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')

const initializePassport = require('./passport-config')
initializePassport(
  passport,
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id)
)

// 連接到資料庫
mongoose.connect(process.env.DB, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log(`Database connected successfully`))
  .catch(err => console.log(err));

// 因為mongodb的Promise已經deprecated了，所以我們這邊會用Node的Promise來代替
mongoose.Promise = global.Promise;

const users = []

app.set('view-engine', 'ejs')
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

app.use(express.json())
app.use('/api', routes)

// 新增cors,以讓在development or testing階段時,不同domain也能存取這個server的API
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', checkAuthenticated, (req, res) => {
  res.render('index.ejs', { name: req.user.name })
})

app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login.ejs')
})

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}))

app.get('/invoice', (req, res, next) => {
  Invoice.find({}, 'invoice_type')
    .then(data => res.json(data))
    .catch(next)
})

app.post('/invoice', checkAuthenticated, (req, res, next) => {
  if(req.body.add_invoice) {
    Invoice.create({ 'invoice_type': req.body.add_invoice})
    .then(data => res.json(data))
    .catch(next)
  } else {
    res.json({
      error: "The input field should not be empty!"
    })
  }
})

// app.patch('/invoice/:id', (req, res, next) => {
//   Invoice.findByIdAndUpdate( { _id:req.params.update_invoice_id }, { $invoice_type: req.params.update_invoice }, { useFindAndModify: false })
//     .then(data => {
//       if(!data) {
//         res.status(404).send({
//           message: `Cannot update Invoice with id = ${id}. Maybe Invoice was not found!`})
//       } else {
//         res.send({ message: `Invoice which id = ${id} was updated successfully.`})
//       }
//     })
// })

app.delete('/invoice/:id', (req, res, next) => {
  Invoice.findOneAndDelete({ "_id": req.params.del_invoice })
    .then(data => res.json(data))
    .catch(next)
})

app.get('/register', checkNotAuthenticated, (req, res) => {
  res.render('register.ejs')
})

app.post('/register', checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    users.push({
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword
    })
    res.redirect('/login')
  } catch {
    res.redirect('/register')
  }
})

app.delete('/logout', (req, res) => {
  // req.logOut()是passport.js套件自帶的funtion，它會清除session，以讓使用者"登出"
  req.logOut()
  res.redirect('/login')
})


function checkAuthenticated(req, res, next) {
  // 使用passport套件所提供的req.isAuthenticated() function
  if (req.isAuthenticated()) {
    return next()
  }

  res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/')
  }
  next()
}

app.listen(port)