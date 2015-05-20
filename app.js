var RSVP = require('rsvp');
var DeisAPI = require('deis-api');
var inquirer = require("inquirer");
var nconf = require('nconf');
// modify the configuration file config.json to set your deis-specific credentials
nconf.file({ file: './config.json' });
var client = new DeisAPI({
    controller : nconf.get('deis_host'),
    secure     : false,  // Optional
    username   : nconf.get('deis_user'),
    password   : nconf.get('deis_password')
});


client.apps.create = RSVP.denodeify(client.apps.create);
client.auth.login = RSVP.denodeify(client.auth.login);
client.builds.create = RSVP.denodeify(client.builds.create);
client.config.set = RSVP.denodeify(client.config.set);

inquirer.prompt([{
  type: 'input',
  name: 'appName',
  message: 'Please specify a name for the application instance to deploy'
},
{
  type: 'input',
  name: 'orgName',
  message: 'Please specify a name for the organization'
},
{
  type: 'input',
  name: 'bgColor',
  message: 'Please specify a background color'
},
{
  type: 'input',
  name: 'memory',
  message: 'Please specify the maximum memory allocated to the instance'
},
{
  type: 'input',
  name: 'cpu',
  message: 'Please specify the maximum cpu time allocated to the instance'
}], function(answers){
  console.log('creating app: ' + answers.appName);
  var appName = answers.appName;

  // authenticate
  client.auth.login()
  .then(function() {
    console.log('successfully logged into deis');
    return client.apps.create(appName);
  })
  // setup instance-specific environment variables
  // this could be things such as the organization's name
  .then(function(results) {
    console.dir(results);
    console.log('successfully created app: ' + answers.appName);
    console.log('setting deployment specific variables');
    return client.config.set(results.id, { 
        ORGANIZATION_NAME: answers.orgName, 
        BG_COLOR: answers.bgColor
      },
      {
        memory: { cmd: answers.memory },
        cpu: { cmd: parseInt(answers.cpu) }
      });
  })
  .then(function(){
    console.log('successfully set deployment-specific variables');
    return client.builds.create(answers.appName, nconf.get('docker_hub_username') + '/simple-node:latest');
  })
  .then(function(results) { 
    console.dir(results);
    return console.log('successfully deployed node.js application');
  })
  .catch(function(err) {
    console.dir(err);
  });
});
