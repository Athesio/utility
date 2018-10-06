const express = require('express');
const app = express();
const fs = require('file-system');
const path = require('path'); 
const npm = require('npm');
const bodyParser = require('body-parser');
const {spawn, exec} = require('child_process');



app.use(bodyParser.urlencoded({ extended: false }))
 
app.use(bodyParser.text());



let PORT = process.env.PORT || 3000;


app.post('/', (req, res)=>{
  console.log(req.body);
  
  fs.writeFile('testFile.js', req.body, (err, data)=>{
    exec('node testFile.js', (err, stdout, stderr)=>{
      if(err) {
        res.send(stderr);
      } else {
        console.log('output is', stdout);
        res.send(stdout);
      }
    });
  })
})

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}!`);
});

