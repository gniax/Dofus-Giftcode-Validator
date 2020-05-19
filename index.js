//#region Global Variables
const readln = process.stdout;
const { promisify } = require('util');
const fs = require('fs');
const readFile = promisify(fs.readFile);
const open = promisify(fs.open);
const path = require('path');
const { XMLHttpRequest } = require('xmlhttprequest');
const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
const isPkg = typeof process.pkg !== 'undefined';

let chromiumPath = (isPkg ? 
  puppeteer.executablePath().replace(
    process.platform!='win32' ? /^.*?\/node_modules\/puppeteer\/\.local-chromium/ : /^.*?\\node_modules\\puppeteer\\\.local-chromium/,
    path.join(path.dirname(process.execPath), 'chromium')
  ) :
  puppeteer.executablePath()
);

const giftCode = 'TOUCHAVRIL2020'; // Here set the giftcode you want to use on every accounts
const antiCaptchaKey = ''; //Anti-captcha key
const ankamaValidityUrl = 'https://proxyconnection.touch.dofus.com/haapi/getForumPostsList?lang=fr&topicId=24993';
const ipValidityUrl = 'https://hidemyna.me/api/geoip.php?out=js&htmlentities';
const createTaskUrl = 'https://api.anti-captcha.com/createTask';
const getTaskResultUrl = 'https://api.anti-captcha.com/getTaskResult';

const siteData = {
  appName: 'dofus',
  app: 'https://www.dofus-touch.com/fr/mmorpg/communaute/codes',
  appHome: 'https://www.dofus-touch.com/fr/mmorpg/communaute/codes',
  appLogout: 'https://account.ankama.com/sso?action=logout&from=https%3A%2F%2Fwww.dofus-touch.com%2Ffr%2Fmmorpg%2Fcommunaute%2Fcodes',
  username: '#userlogin',
  password: '#userpass',
  code: '#code',
  login_submit: '#login_sub',
  siteKey: '6LfbFRsUAAAAACrqF5w4oOiGVxOsjSUjIHHvglJx',
  submit: '#submit_field',
  gift_submit: '#gift_submit_field'
};

const defaultData = {
  inputFileName: 'proxy.txt',
  accountsFileName: 'accounts.txt',
  proxyAllowedCountries: [
    'BD','BE','BJ','MM','BO','CM','CA','CY','FR','GB','IQ','JP','PG','PY','PR','PE','SV','SD','PS','LK'
  ]
};

const stdClrs = {
  Reset: "\x1b[0m",
  Bright: "\x1b[1m",
  Dim: "\x1b[2m",
  Underscore: "\x1b[4m",
  Blink: "\x1b[5m",
  Reverse: "\x1b[7m",
  Hidden: "\x1b[8m",
  FgBlack: "\x1b[30m",
  FgRed: "\x1b[31m",
  FgGreen: "\x1b[32m",
  FgYellow: "\x1b[33m",
  FgBlue: "\x1b[34m",
  FgMagenta: "\x1b[35m",
  FgCyan: "\x1b[36m",
  FgWhite: "\x1b[37m",
  BgBlack: "\x1b[40m",
  BgRed: "\x1b[41m",
  BgGreen: "\x1b[42m",
  BgYellow: "\x1b[43m",
  BgBlue: "\x1b[44m",
  BgMagenta: "\x1b[45m",
  BgCyan: "\x1b[46m",
  BgWhite: "\x1b[47m"
};

var _loadTick = 0;
var _msg = "";

const waiting = (msg, t) => {
  _msg = msg;
  return setInterval(() => {
    readln.clearLine();
    readln.cursorTo(0);
    _loadTick = (_loadTick + 1) % 4;
    
    var dots = new Array(_loadTick + 1).join(".");
    readln.write(msg + dots);
  }, t);
}

const stopWaiting = (timer, status) => {
  clearInterval(timer);
  loadTick = 0;
  readln.clearLine();
  readln.cursorTo(0);
  readln.write(_msg + "... "+ status + stdClrs.Reset+ "\n");
}

//#endregion

//#region Utility Functions
//#region   File Control Functions

const readInputFile = (fileName) => new Promise(async (resolve, reject) => {
  
  try {
    readFile(fileName, 'utf-8', (err, content) => {
      if(err) {
        return reject(err);
      }

      var proxyList = [];
      content.split('\n').forEach((line, key) => {
        let proxy = line.trim().split(':');

        if(proxy == '' || proxy[0].split('.').length < 4) {
          // console.error('Invalid type of IP address Detected: ', proxy);
          return;
        }

        let tempObj = {};
        tempObj["_id"] = key;
        tempObj["ip"] = proxy[0];
        tempObj["port"] = proxy[1];

        if (proxy[2] != null && proxy[2] != "" && proxy[3] != null && proxy[3] != "")
        {
          tempObj["username"] = proxy[2];
          tempObj["password"] = proxy[3];
        }

        proxyList.push(tempObj);
      });

      if(proxyList.length == 0) {
        console.log('No Proxy IPs found in the given file.\nTerminating application...');
        return reject({ errorId: 1, msg: 'No IP found' });
      }

      console.log(`${proxyList.length} proxy IPs found`);
      return resolve(proxyList);
    });
  } catch (err) {
    console.log(`Error occured when reading \'${fileName}\'': `, err);
    return reject({ errorId: -1, error: err });
  }
});

const readAccountsFile = (fileName) => new Promise(async (resolve, reject) => {
  
  try {
    readFile(fileName, 'utf-8', (err, content) => {
      if(err) {
        return reject(err);
      }

      var accountsList = [];
      content.split('\n').forEach((line, key) => {
        let account = line.trim().split(':');


        let tempObj = {};
        tempObj["_id"] = key;
        tempObj["username"] = account[0];
        tempObj["password"] = account[1];

        accountsList.push(tempObj);
      });

      if(accountsList.length == 0) {
        console.log('Aucun compte trouvé.\nFermeture de l\'application...');
        return reject({ errorId: 1, msg: 'No Account Found' });
      }

      console.log(`${accountsList.length} comptes trouvés`);
      return resolve(accountsList);
    });
  } catch (err) {
    console.log(`Error occured when reading \'${fileName}\'': `, err);
    return reject({ errorId: -1, error: err });
  }
});

const writeOutputFile = (fileName, data) => new Promise(async (resolve, reject) => {
  open(fileName, 'a', (err, fd) => {
    if (err) throw err;
    fs.appendFile(fd, data, 'utf8', (err) => {
      fs.close(fd, (err) => {
        if (err) throw err;
      });
      if (err) throw err;
      resolve({ status: 'success' });
    });
  });
});


const LOG = async (log) => {
  await writeOutputFile('logs/LOG.txt', `${getDateTime()} ${log}\n`);
}
//#endregion

const getTwoDigitString = (no) => ("0" + no.toString()).slice(-2);

var getDateTime = () => {
  let date = new Date();
  return "["+getTwoDigitString(date.getDate())+"-"+getTwoDigitString(date.getMonth())+"-"+getTwoDigitString(date.getFullYear())+" "+getTwoDigitString(date.getHours())+":"+getTwoDigitString(date.getMinutes())+":"+getTwoDigitString(date.getSeconds())+"]";
}

//#region Captcha

const creatAntiCaptchaTask = () => new Promise(async (resolve, reject) => {
  let http = new XMLHttpRequest();

  http.onload = function(e) {
    if(http.readyState === 4) {
      let taskData = JSON.parse(http.responseText);
      if(taskData.errorId !== 0)
            reject(taskData);
        resolve(taskData);
    } else console.log('Error in response Data \'anti-captcha task creation\'');
  }

  try {
    http.open("POST", createTaskUrl, true);
    http.responseType = "json";
    http.send(JSON.stringify({
      "clientKey": `${antiCaptchaKey}`,
      "task":
        {
          "type":"NoCaptchaTaskProxyless",
          "websiteURL":"https:\/\/www.dofus-touch.com\/fr\/mmorpg\/communaute\/codes",
          "websiteKey": `${siteData.siteKey}`
        },
      "softId":0,
      "languagePool":"en"
    }));
  } catch(err) {
    console.log('Error in anti-captcha request', err);
    reject(err);
  }
});

const getAntiCaptchaResponseKey = (taskId) => new Promise(async (resolve, reject) => {
  let http = new XMLHttpRequest();

  http.onload = async function(e) {
    let response = JSON.parse(http.responseText);
    
    if(response.status === "processing") {
      setTimeout(() => {
        return resolve(getAntiCaptchaResponseKey(taskId));
      }, 2000);
    } else {
      if(response.errorId !== 0) return reject(response);
      return resolve(response);
    }
  }

  try {
    http.open("POST", getTaskResultUrl, true);
    http.responseType = "json";
    http.send(JSON.stringify({
      clientKey: `${antiCaptchaKey}`, 
      taskId: `${taskId}`
    }));
  } catch (error) {
    console.log('Error in anti-captcha responseKey request', error);
    return reject(error);
  }
});

const handleAntiCaptcha = async () => {
  await LOG('Creating Anti-Captcha Task');
  let task;
  try {
    task = await creatAntiCaptchaTask();
    await LOG(`Anti-Captcha Task created: ${JSON.stringify(task)}`);
  } catch (error) {
    await LOG(`An error occured: ${error}`);
    return false;
  }
  
  await LOG('Requesting Anti-Captcha response key')
  let response = null;
  try {
    response = await getAntiCaptchaResponseKey(task.taskId);
    await LOG(`Anti-Captcha response key recieved: ${JSON.stringify(response)}`);
    
    response = response.solution.gRecaptchaResponse;
  } catch (error) {
    await LOG(`An error occured: ${error}`);
    return false;
  }
  return response;
}

//#region   Browser Control functions

// Initialize browser window for proxy details
const initBrowser = (proxy) => new Promise(async (resolve, reject) => {
  try {
    const args = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-infobars',
      '--window-position=0,0',
      '--ignore-certifcate-errors',
      '--ignore-certifcate-errors-spki-list',
      `--proxy-server=${proxy.ip}:${proxy.port}`
  ];

  
  const options = {
      args,
      executablePath: chromiumPath,
      headless: true,
      ignoreHTTPSErrors: true,
      userDataDir: './tmp'
  };

    let browser = await puppeteer.launch(options);

    resolve(browser);
  } catch (error) {
    console.log('Error in initBrowser: ', error);
    // reject(error);
  }
});

// Close pre-opened browser window
const closeBrowser = (browser) => new Promise(async (resolve, reject) => {
  try {
    await browser.close();
    return resolve({ status: 'success' });
  } catch (error) {
    console.log('Error in closeBrowser: ', error);
    reject(error);
  }
});

//#endregion
//#region   Network Requests

const handleFormSubmission = async (dataIn) => {
  let browser, status;
  await LOG('Using Proxy for browser');
  console.log(`Using proxy ${dataIn.proxy.ip}:${dataIn.proxy.port}`);

  browser = await initBrowser(dataIn.proxy);
  await LOG('Initializing Browser');
  
  let page = await browser.newPage();
  
  if (dataIn.proxy.username != null && dataIn.proxy.password != null)
  {
    let username = dataIn.proxy.username;
    let password = dataIn.proxy.password;

    await page.authenticate({ username, password });
  }
  
  //#region Proxy Validity Check

  let proxyValidity = waiting("Checking proxy Validity", 800);
  try {
    await LOG('Trying to validate IP using an API');
    await page.goto(ipValidityUrl, { waitUntil: "load", timeout: 30000  });
  } catch (err) {
    await LOG('Error occured during loading IP validation API');
    await page.close();
    await closeBrowser(browser);
    stopWaiting(proxyValidity, (stdClrs.FgRed + "ERROR"));

    return {
      errorId: 3,
      msg: 'Unknown Proxy Error',
      error: err
    };
  }
  await LOG('IP validation URL loaded');
  
  let debug = false;
  let proxyInfo = await page.evaluate(() => {
    let div = document.querySelector('body > pre');
    if(div)
    {
    jsonObject = JSON.parse(div.innerText);
    key = Object.keys(jsonObject);
    return jsonObject[key];     
    }
    debug = true
  })

  if(debug == true)
  {
      await page.close();
      await closeBrowser(browser);
      stopWaiting(proxyValidity, (stdClrs.FgRed + "ERROR"));
      return {
        errorId: 3,
        msg: 'Proxy Info Error'
      };
  }
  if(typeof proxyInfo === 'undefined' || proxyInfo === null) {
    await page.close();
      await closeBrowser(browser);
      stopWaiting(proxyValidity, (stdClrs.FgRed + "ERROR"));
      return {
        errorId: 3,
        msg: 'Proxy Info Error'
      };
  }

  await LOG(`Proxy information recorded: ${proxyInfo}`);
  
  await LOG('Checking for validity of IP');
  let isValid = defaultData.proxyAllowedCountries.find((element) => { 
    return (proxyInfo[0] == element) 
  }) == proxyInfo[0];
  
  if(!isValid) {
    await LOG('IP is not from a valid country');
    await page.close();
    await closeBrowser(browser);
    stopWaiting(proxyValidity, (proxyInfo[0]+stdClrs.FgMagenta + " INVALID"));

    return {
      errorId: 2,
      msg: 'Proxy IP location is not valid'
    }
  }
  stopWaiting(proxyValidity, (stdClrs.FgGreen + " VALID"));
  await LOG('IP is from a valid country');
  await LOG('Trying to validate proxy by navigating to ankama website');

  let proxyError = false;
  try {

    await page.goto(ankamaValidityUrl, { waitUntil: "load", timeout: 30000 });
    jsonContent = await page.evaluate(() =>  {
      return JSON.parse(document.querySelector("body").innerText); 
    }); 
    
    //await page.screenshot({ path: `./capture/${Date.now()}_beforeSubmission.png`, fullPage: true });
    let content = JSON.stringify(jsonContent);
    if (content == '[]')
    {
      stopWaiting(proxyValidity, (stdClrs.FgGreen + " VALID"));
    }
    else
    {
      proxyError = true;
    }
  } catch (err) {
    proxyError = true;
  }

  if (proxyError)
  {
    await LOG('Error occured during loading IP validation API');
    await page.close();
    await closeBrowser(browser);
    stopWaiting(proxyValidity, (stdClrs.FgRed + "ERROR"));

    return {
      errorId: 3,
      msg: 'Unknown Proxy Error'
    };
  }
  //#endregion
  
  await page.close();


  await LOG('Account Code Validation Started');
  
  let noOfPages = dataIn.cycles;
  for (let page = 0; page < noOfPages; page++) {
    await LOG(`Starting ${page+1} of ${dataIn.cycles} form submission`);
    let webPage = await browser.newPage();

    let msgStart = stdClrs.FgYellow + `[${page+1}] ` + stdClrs.Reset;

    //#region Loading Signup Page

    let pageLoading = waiting(msgStart + "Page Loading", 800);
    try {
      await webPage.goto(siteData.app, { waitUntil: "load", timeout: 90000 });
    } catch (err) {
      if(noOfPages < 5) noOfPages++;
      stopWaiting(pageLoading, (stdClrs.FgRed + "ERROR"));
      await LOG(`Error occured while loading: ${siteData.app} ${err}`);
      await webPage.close();

      continue;
    }
    await LOG(`${siteData.app} URL loaded`);
    stopWaiting(pageLoading, (stdClrs.FgGreen + "DONE"));

    //#endregion

    await LOG('Handling Anti-captcha');
    let responseKeyHandle = waiting(msgStart + "Handling Anti-captcha", 1000);
    
    let antiCaptchaKey = await handleAntiCaptcha();
    if(antiCaptchaKey == false) {
      stopWaiting(responseKeyHandle, (stdClrs.FgRed + "ERROR"));
      status = {
        errorId: 4,
        msg: 'Error in Anticaptcha Key'
      }
      break;
    }

    await LOG('Anti-captcha response key recieved successfully');
    stopWaiting(responseKeyHandle, (stdClrs.FgGreen + "DONE"))

    //await webPage.screenshot({ path: `./capture/${Date.now()}_captcha.png`, fullPage: true });

    //#region Page Processing
    // process html and inject response key
    let injectLoading = waiting(msgStart + "Page Injection", 3000);
    await LOG('Page Alteration Started');
    //await webPage.screenshot({ path: `./capture/${Date.now()}_beforeSubmission.png`, fullPage: true });
    let alteration = await webPage.evaluate((key) => {
      let divs = document.querySelectorAll("body > div"),
          iframe = document.querySelector('body > iframe'),
          keyArea = document.querySelector('#g-recaptcha-response'),
          form = document.querySelector("#ui-id-4 > div > div > div > div > div > div > div > div > div > div > div > div > div.ak-account-connect > div.ak-form > form");
          btn = document.createElement('input');
      if(divs == null) return {
        errorId: 6,
        error: 'Div not found',
        content: div
      };

      try {
        keyArea.style.display = "block";
        keyArea.innerHTML = key;
        
        btn.setAttribute('id', 'submit_field');
        btn.setAttribute('type', 'submit');

        form.append(btn);

      } catch (error) {
          return {
            errorId: 7,
            msg: 'Error on alteration',
            error: error 
         };
      }

      return {
        errorId: 0
      };
    }, antiCaptchaKey );

    if(alteration.errorId != 0) {
      await LOG(`Error in page injection: ${JSON.stringify(alteration)}`)
      stopWaiting(injectLoading, (stdClrs.FgRed + "ERROR"));
      await webPage.close();

      continue;
    }

    await LOG('Page Alteration Done');
    stopWaiting(injectLoading, (stdClrs.FgGreen + "DONE"));

    // #endregion

    //#region Form Submission
    await webPage.waitFor(2*2000);
    setTimeout(function(){
    }, 2000); 

    //await webPage.screenshot({ path: `./capture/${Date.now()}_beforeFormFilling.png`, fullPage: true });
    let formFilling = waiting(msgStart + "Form Filling", 3000);
    await LOG('Starting Form auto filling');
    let username = dataIn.account.username;
    let password = dataIn.account.password;

    //await webPage.screenshot({ path: `./capture/${Date.now()}_lol.png`, fullPage: true });

    //await LOG(`Form filling started using random data ${JSON.stringify(formData)}`);
    
    try {
      await Promise.all([
        await webPage.focus(siteData.username),
        await webPage.keyboard.type(username),
        await webPage.keyboard.press('Tab'),
        
        await webPage.focus(siteData.password),
        await webPage.keyboard.type(password),
        await webPage.keyboard.press('Tab'),
      ]);
      await LOG('Form filling finished');
    } catch (error) {
      await webPage.close();
      await LOG(`Error on form fill: ${error}`);
      
      status = {
        errorId: 10,
        msg: 'Error on form filling',
        error: error
      }
      stopWaiting(formFilling, (stdClrs.FgRed + "ERROR"));
      break;

    }
    
    await LOG('Submitting filled signup form');
    await webPage.click(siteData.submit);
    await webPage.waitFor(2*1000);

    stopWaiting(formFilling, (stdClrs.FgGreen + "DONE"));

    //#endregion

    //#region Checking Submission State
    
    let checkingSubmission = waiting(msgStart + "Checking Submission State", 500);

    await LOG('Form submitted successfully');
    stopWaiting(checkingSubmission, (stdClrs.FgGreen + "DONE"));
    
    //await webPage.screenshot({ path: `./capture/${Date.now()}_beforeFormFilling.png`, fullPage: true });

    let codeFilling = waiting(msgStart + "Gift Code Filling", 3000);
    await LOG('Starting Gift Code filling');

    let gift = giftCode;
    try {
      await Promise.all([
        await webPage.focus(siteData.code),
        await webPage.keyboard.type(gift),
        await webPage.keyboard.press('Tab')
      ]);
      await LOG('Giftcode filling finished');
    } catch (error) {
      await webPage.close();
      await LOG(`Error on gift form fill: ${error}`);
      
      status = {
        errorId: 10,
        msg: 'Error on gift form filling',
        error: error
      }
      stopWaiting(codeFilling, (stdClrs.FgRed + "ERROR"));
      break;
    }

    let newAlteration = await webPage.evaluate(() => {
      gift_form = document.querySelector("body > div.ak-mobile-menu-scroller > div.container.ak-main-container > div > div > div > main > div.ak-container.ak-main-center > div.ak-container.ak-panel-stack.ak-glue > div.ak-container.ak-panel.ak-main-form-code > div > div > div > div > div > div > div.ak-column.ak-container.col-md-8 > div.ak-form > form");

      giftbtn = document.createElement('input');
      giftbtn.setAttribute('id', 'gift_submit_field');
      giftbtn.setAttribute('type', 'submit');

      gift_form.append(giftbtn);
    });

    await LOG('Submitting giftcode form');
    await webPage.click(siteData.gift_submit);
    await webPage.waitFor(2*1000);

    stopWaiting(codeFilling, (stdClrs.FgGreen + "DONE"));

    await webPage.screenshot({ path: `./capture/${username}_success.png`, fullPage: true });

    let loggingOut = waiting(msgStart + "Logging Out", 500);
    await LOG('Logging out of the account');
    try {
    await webPage.goto(siteData.appHome, { waitUntil: 'load', timeout: 30000  });
      if(webPage.url() != siteData.appHome) {
        // console.log('Cloudfare detected', webPage.url());
        await LOG('Logging out not succeeded');
        stopWaiting(loggingOut, (stdClrs.FgRed + "ERROR"));
      }
    await webPage.goto(siteData.appLogout, { waitUntil: 'load', timeout: 90000  });
    }
    catch(err)
    {
      await LOG('Logging out not succeeded');
      await webPage.close();
      stopWaiting(loggingOut, (stdClrs.FgRed + "ERROR"));
    }

    await LOG('Logged out successfully');
    stopWaiting(loggingOut, (stdClrs.FgGreen + "DONE"));
    //#endregion

    await LOG(`Account ${username} successfully activated code`);
    console.log(`Account ${username} successfully activated code`);
    try{
      await webPage.close();
    }
    catch(Exception)
    {
      webPage.close();
    }
  }
  await closeBrowser(browser);

  if(status){
    return status;
  }
  return { errorId: 0, msg: 'successfull' };
}

const handleTasks = async () => {
  console.clear();
  let proxyList = [];
  let accountsList = [];
  proxyList = await readInputFile(defaultData.inputFileName)
    .catch((err) => {
      console.log(err);
      process.exit(0); 
  });

  accountsList = await readAccountsFile(defaultData.accountsFileName)
    .catch((err) => {
      console.log(err);
      process.exit(0); 
  });
  

  let proxyLength = proxyList.length;
  let proxyCounter = 0;

  let length = accountsList.length;
  length = (length > 0)?length:1;

  for (let i = 0; i < length; i++) {
    if(proxyCounter >= proxyLength)
      proxyCounter = 0;

    let status = await handleFormSubmission({
      proxy: {
        ip: proxyList[proxyCounter].ip,
        port: proxyList[proxyCounter].port,
        username: proxyList[i].username,
        password: proxyList[i].password
      },
      account: {
        username: accountsList[i].username,
        password: accountsList[i].password
      },
      cycles: 1,
      entryNo: i
    }); 

  }
};

handleTasks();

//#endregion
  