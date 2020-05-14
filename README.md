# Dofus Giftcode Validator

This tool permits to apply a giftcode to as many account as you want

## Getting Started

This script allows you to apply a giftcode to as many accounts as you want.  
This allows you to benefit because of Ankama compensation they provide regularly because of maintenance or problems.  
This is especially interesting if you are using bots.  

### Prerequisites

You need **Nodejs** in order to use this program

[Node.js Install](https://nodejs.org/en/download/)  

At least you need one proxy to run it  
You will need [Anti-captcha](https://anti-captcha.com/mainpage) key too (because of cloudflare...)

### Installing

```
git clone https://github.com/gniax/dofus-giftcard-validator/
npm install
```

Then place your accounts (username:password) into accounts.txt and at least one proxy into proxy.txt

#### Do not forget to edit these lines in **index.js** !
```
const giftCode = 'THEGIFTCODEYOUWANT';
const antiCaptchaKey = 'ANTICAPTCHAKEY';
```

To run the program, simply use (when you are situated on the same folder as the file for sure)

```
node index.js
```

## Deployment

Tested and developped on Windows 10.
May works with Linux too.

## Contributing

This tool is open for any contributions, you are free to help to upgrade this program. 
You can add options to not use proxy for instance...

## Acknowledgments

* Inspiration from an old KingTouch Account Generator program not findable now
* To use this tool on dofus website, just replace dofus touch instead of dofus in every hyper link.
