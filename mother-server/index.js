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


let containers = {};
let occupiedCount = 0;
let containerTotal = 0;


const makeSingleContainer = (i) => {
  const start = spawn(`docker run --name silo${i} -p ${3000 + i}:3000 ${image}`, {shell: true});
    start.stdout.once('data', (data) => {
      
      const newContainer = {
        name: `silo${i}`,
        port: (3000 + i),
        available: true
      };
      containers[newContainer.name] = newContainer;
      containerTotal += 1;
      console.log(`silo${i} is online`);

    });
};

app.get('/makecontainers', (req, res) => {
  res.send('containers made');

  for (let i = 1; i <= 10; i++) {
    makeSingleContainer(i);
  }

});

app.get('/killcontainers', (req, res) => {
  res.send('containers killed');
  // const killList = Object.keys(containers).join(' ');
  
  // console.log('killList:', killList);
  const groupKill = spawn(`docker stop $(docker ps -a -q)`, {shell: true});
  groupKill.stdout.once('data', (data) => {
    const groupRemove = spawn(`docker rm $(docker ps -a -q)`, {shell: true});
    groupRemove.stdout.once('data', (rmData) => {
      containerTotal = 0;
      containers = {};
      console.log('containers: ', Object.values(containers).map((obj) => {
        return obj.name;
      }));

    })
  })
  
});

const pickContainer = () => {
  for (let container in containers) {
    if (containers[container].available) {
      return containers[container];
    }
  }
}

const increaseSwarmSize = () => {
  const currentSize = containerTotal;
  const newSize = currentSize * 2;
  for (let i = currentSize + 1; i <= newSize; i++) {
    makeSingleContainer(i);
  }
};

const decreaseSwarmSize = () => {
  const killArr = [];
  for (let i = 11; i <= containerTotal; i++) {
    killArr.push(`silo${i}`);
    delete containers[`silo${i}`];
  }
  const killList = killArr.join(' ');
  console.log('killlist', killList);
  const groupKill = spawn(`docker stop ${killList}`, {shell: true});
  groupKill.stdout.once('data', (data) => {
    const groupRemove = spawn(`docker rm ${killList}`, {shell: true});
    groupRemove.stdout.once('data', (rmData) => {
      console.log('containers: ', Object.values(containers).map((obj) => {
        return obj.name;
      }));
      containerTotal -= killArr.length;
    })
  })

}


const resize = () => {
  
  const inUse = occupiedCount / containerTotal * 100;
  console.log(`${~~inUse}% used`);
  if (inUse > 50) {
    increaseSwarmSize();
    console.log('busy, increased size');
  }
  if (inUse === 0 && containerTotal > 10) {
    decreaseSwarmSize();
    console.log('not busy, shrank size');
  }
};

app.post('/', (req, res) => {
  const code = req.body;
  const container = pickContainer();
  container.available = false;
  occupiedCount += 1;
  resize();
  console.log('container picked: ', container.name);
  axios.post(`http://127.0.0.1:${container.port}`, code, {
    headers: {
      'Content-Type': 'text/plain'
    }
  }).then((resFromContainer) => {
    res.send(JSON.stringify(resFromContainer.data));
    const killContainer = spawn(`docker stop ${container.name}`, {shell: true});
    killContainer.stdout.once('data', (data) => {
      const destroy = spawn(`docker rm ${container.name}`, {shell: true});
      destroy.stdout.once('data', (dataFromRecreate) => {
        const reborn = spawn(`docker run --name ${container.name} -p ${container.port}:3000 ${image}`, {shell: true});
        reborn.stdout.once('data', (rebornData) => {
          console.log(`${container.name} back online`);
          container.available = true;
          occupiedCount -= 1;
          resize();
        });
      });
    });

  })
});

// app.post('/', (req, res) => {

//   let portAss = Math.floor(Math.random() * 5000);
//   let code = req.body;
//   let dockerPort = 3000 + portAss;
//   let containerName = 'container' + dockerPort.toString();

//   console.log('docker port is ', dockerPort);

//   const child = spawn(`docker run --name ${containerName} -p ${dockerPort.toString()}:3000 ${image}`, {

//     shell: true
//   });
//   child.stdout.once('data', (data) => {
//     console.log('child stdout', data.toString());
//     axios.post(`http://127.0.0.1:${dockerPort.toString()}`, code, {
//       headers: {
//         'Content-Type': 'text/plain'
//       }
//     }).then((response) => {


//       res.send(JSON.stringify(response.data));
//       exec(`docker stop ${containerName}`);
//       setTimeout(() => {
//         exec(`docker rm ${containerName}`)
//       }, 15000);
//     }).catch((err) => {
//       res.send(err)
//       exec(`docker stop ${containerName}`);
//       setTimeout(() => {
//         exec(`docker rm ${containerName}`)
//       }, 15000);
//     })

//   })


// });



app.listen(PORT, () => {
  console.log(`listening on port ${PORT}!`);
});