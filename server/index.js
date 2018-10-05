const express = require('express');
const app = express();
const fs = require('file-system');
const bodyParser = require('body-parser');
const {spawn, exec} = require('child_process');
const cors = require('cors');
const axios = require('axios');

//Middleware
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.text());
app.use(cors());

let PORT = process.env.PORT || 3069; 



app.post('/', (req, res)=>{
    let portAss = Math.floor(Math.random()*5000);
    let code = req.body;
    let dockerPort = 3000+portAss;
    console.log('docker port is ', dockerPort);
    exec(`docker run -p ${dockerPort.toString()}:3000 a45f97e1ad6c`, (err, stdout)=>{
        console.log('cb invoked');
        if(err) {
          console.log('error is', err);
        } else {
          console.log('standard output is...', stdout);
        }

    let codedOutput = ""
      });
      setTimeout(()=>{
        console.log('sending request');
        axios.post(`http://127.0.0.1:3000`, `console.log('howdy from Mother')`, {headers: {
            'Content-Type': 'text/plain'
        }}).then((response)=>{
             console.log(response);
            res.send(response.data);
        }).catch((err)=>{res.send(err)})}, 1000);
    
      ;
})

app.listen(PORT, () => {
    console.log(`listening on port ${PORT}!`);
  });