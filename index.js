const express = require('express');
const superagent = require('superagent');
const nodemailer  = require('nodemailer');
const schedule = require('node-schedule');

const app = express();
const port = process.env.PORT || 3000;

let rule = new schedule.RecurrenceRule();
rule.dayOfWeek = [0, new schedule.Range(1, 5)];
rule.hour = 23;
rule.minute = 55;

let j = schedule.scheduleJob(rule, function(){
  getTrafficInfo();
});

console.log('server started!');

function getTrafficInfo() {
  let parameters = {
    key: '460f9292715264f42795f53076e213de',
    origin: '120.323841,30.143915',
    destination: '120.247893,30.204629',
    // originid: 'B023B17VYM',
    // destinationid: 'B0FFGAT2TB',
    waypoints: '120.309097,30.175533;120.277725,30.183495;120.278831,30.195894',
  }
  superagent
    .get('http://restapi.amap.com/v3/direction/driving')
    .query(parameters)
    .accept('json')
    .end((err, sres) => {
      if(err) {
        return next(err);
      }
      let result = [];
      let steps = JSON.parse(sres.text).route.paths[0].steps;
      for(let i=0, slen=steps.length; i<slen; i++) {
        let tmcs = steps[i].tmcs;
        for(let j=0, tlen=tmcs.length; j<tlen; j++) {
          if(tmcs[j].status == '拥堵') {
            result.push(steps[i].road + tmcs[j].status);
          }
        }
      }
      if(result.length != 0) {
        sendMail(JSON.stringify(result));
      }
    });
}

function sendMail(text) {
  let mailTransport = nodemailer.createTransport({
    host: 'smtp.qq.com',
    secureConnection: true,
    auth: {
      user: '992380160@qq.com',
      pass: 'baqhbfmrcedabahj'
    },
  });

  let message = {
    from: '今日路况<992380160@qq.com>',
    to: '<wangjiechang@duc.cn>',
    subject: '此路不通，请绕道！',
    text: text,
  };

  mailTransport.sendMail(message, (error, info) => {
    if (error) {
      console.log('Error occurred');
      console.log(error.message);
      return process.exit(1);
    }
    console.log('Message sent successfully!');
    mailTransport.close();
  });
}

app.listen(port, () => {
  console.log(`app is listening at port ${port}`);
});