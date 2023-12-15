const 
  express = require('express'),
  app = express()

// // Allow MIME types
// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', '*')
//   res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
//   res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
//   next()
// })

// Middleware to automatically set right MIME
function MIMER(req, res, next) {
  if (req.path.endsWith('.js')) {
    res.type('application/javascript');
  } else if (req.path.endsWith('.css')) {
    res.type('text/css');
  } else if (req.path.endsWith('.html')) {
    res.type('text/html');
  }
  next();
}

app.use(MIMER)

app.use(express.static('public', {
  extensions: ['html', 'css', 'js']
}))

app.use(express.static('dist', {
  extensions: ['html', 'css', 'js']
}))

// Serve every file in public & dist
app.get('*', (req, res) => {
  res.sendFile(req.path, {
    root: __dirname
  })
})

app.listen(3000, () => {
  console.log('Server started on port 3000')
})