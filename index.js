const qrcode = require('qrcode-terminal');
const _ = require('lodash');

const types = ["עיר", "מדינה", "חי", "צומח", "דומם", "שם של בן", "שם של בת", "מקצוע", "משפחה"]
const ONE_HOUR_MILISECONDS = 1000 * 60 * 60;

const { Client } = require('whatsapp-web.js');
const client = new Client();

let online = [];

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('Client is ready!');
  // online.push("בדיקה בוט ארץ עיר");
  // countryCity("בדיקה בוט ארץ עיר");
});

client.on('message', message => {
  if (message.body === '!ping') {
    message.reply('pong');
  }
  else if (message.body.startsWith('!countryCity ')) {
    let groupName = message.body.slice(13);

    if (online.includes(groupName)) {
      message.reply(`סורי אחשלי אבל כבר יש משחק רץ בקבוצה הזאת...`);
    } else {
      online.push(groupName);
      message.reply(`מתחיל לשחק ארץ עיר בקבוצה: \n ${groupName}`);
      countryCity(groupName);
    }
  } else if (message.body.startsWith('!stopCountryCity ')) {
    let groupName = message.body.slice(17);
    message.reply(`עוצר משחק ארץ עיר בקבוצה: \n ${groupName}`);
    online = online.filter((onlineGroup) => onlineGroup != groupName)
  } else if (message.body === '!online') {
    const onlineList = JSON.stringify(online, null, 2)

    message.reply(`משחקים פעילים בבוט זה: \n ${onlineList.slice(3, onlineList.length - 1)}`);
  }

});

client.initialize();

const countryCity = async (groupName) => {
  const chats = await client.getChats()
  const choosenChat = chats
    .find((chat) => chat.name === groupName)

  let randomTime = randomTimeTommorow()

  console.log("started countryCity!");
  while (true) {
    console.log(`waiting for time : ${randomTime.toLocaleDateString()} ${randomTime.toLocaleTimeString()}`)
    if (await waitTillTime(randomTime, groupName)) {
      return;
    }

    const letter = unicodeToChar(`\\u0${(randomNumber(1488, 1514)).toString(16).toUpperCase()}`);

    const type = types[randomNumber(0, types.length)]

    const message = `${type} שמתחיל באות ${letter}`

    const sentMessage = await choosenChat.sendMessage(message);

    await choosenChat.setMessagesAdminsOnly(false);

    if (await waitTillTime(new Date(randomTime.getTime() + ONE_HOUR_MILISECONDS), groupName)) {
      return;
    };

    await choosenChat.setMessagesAdminsOnly(true);

    // check participants and remove failed
    const messages = await choosenChat.fetchMessages({ limit: 500 })

    const relevantMessages = messages.slice(messages.findIndex((searchedMessages => searchedMessages.id.id === sentMessage.id.id)) + 1)

    const uniqMessages = _.uniqBy(relevantMessages, "from");

    // IDK DO SOMETHING

    randomTime = randomTimeTommorow()
  }
}

const waitTillTime = async (time, groupName) => {
  const timeToWait = new Date(time).getTime() - new Date().getTime();

  const iteration = parseInt((timeToWait / (ONE_HOUR_MILISECONDS)) * 100) + 1;

  for (let i in [...Array(iteration).keys()]) {
    await delay(timeToWait / (iteration))

    if (!online.includes(groupName)) {
      return true;
    }
  }
}

function unicodeToChar(text) {
  return text.replace(/\\u[\dA-F]{4}/gi,
    function (match) {
      return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
    });
}

const delay = (time) => {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

const randomNumber = (start, end) => {
  return parseInt(start + Math.random() * (end - start));
}

const randomTimeTommorow = () => {
  const now = new Date();

  // TOMMOROW BETWEEN 7 TO 23->
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 7)
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23)

  // IN THE NEXT 10 SECONDS ->
  // const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds())
  // const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds() + 10)

  return randomDate(start, end);
}

