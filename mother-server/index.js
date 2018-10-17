const express = require('express');
const app = express();
const fs = require('file-system');
const bodyParser = require('body-parser');
const { spawn, exec } = require('child_process');
const cors = require('cors');
const axios = require('axios');

//Middleware
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.text());
app.use(cors());

let PORT = process.env.PORT || 3069;

let awsImage = 'fa917a185517'
let localImage = '8343ca51e590'

const image = localImage;


app.post('/', (req, res) => {

  let portAss = Math.floor(Math.random() * 5000);
  let code = req.body;
  let dockerPort = 3000 + portAss;
  let containerName = 'container' + dockerPort.toString();
  
  console.log('docker port is ', dockerPort);
  
  const child =  spawn(`docker run --name ${containerName} -p ${dockerPort.toString()}:3000 ${image}`, {
    
    shell: true
  });
  child.stdout.once('data', (data) => {
    console.log('child stdout',data.toString());
    axios.post(`http://127.0.0.1:${dockerPort.toString()}`, code, {
      headers: {
        'Content-Type': 'text/plain'
      }
    }).then((response) => {

      
      res.send(JSON.stringify(response.data));
      exec(`docker stop ${containerName}`);
      setTimeout(()=>{
        exec(`docker rm ${containerName}`)
      }, 15000);
    }).catch((err) => {
      res.send(err)
      exec(`docker stop ${containerName}`);
      setTimeout(()=>{
        exec(`docker rm ${containerName}`)
      }, 15000);
    })
    
  })


});

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}!`);
});