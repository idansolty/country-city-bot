const qrcode = require('qrcode-terminal');
const _ = require('lodash');

const types = ["עיר", "מדינה", "חי", "צומח", "דומם", "שם של בן", "שם של בת", "מקצוע"]
const ONE_HOUR_MILISECONDS = 1000 * 60 * 60;
let shush = [];
let blacklist = ["972542357088-1584821912@g.us", "120363044786658069@g.us"];
let shouldRemove = [];
let groupsToRemoveFrom = ["120363025989806200@g.us", "120363043871636545@g.us"];

let groupesToAddTo = ["120363044427567257@g.us", "120363044786658069@g.us"]

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

client.on('message_create', async message => {
  if (message.body === '!ping') {
    if (message.author) {
      if (blacklist.includes(message.from)) {
        message.reply(' pong יא זבל מנסה להפיל אותי אה? יא שמוק', message.author);
      } else {
        message.reply('pong', message.author);
      }
    } else if (message.fromMe) {
      message.reply('pong', message.from);
    } else {
      message.reply('pong');
    }
  } else if (message.body.startsWith('!countryCity ')) {
    let groupName = message.body.slice(13);

    if (online.includes(groupName)) {
      message.reply(`סורי אחשלי אבל כבר יש משחק רץ בקבוצה הזאת...`);
    } else {
      online.push({ id: groupName });

      try {
        const chats = await new Promise((resolve, reject) => {
          setTimeout(reject, 30 * 1000)
          client.getChats().then(resolve);
        })

        message.reply(`מתחיל לשחק ארץ עיר בקבוצה: \n ${groupName}`);
        countryCity(groupName, chats.find((chat) => chat.name === groupName));
      } catch (e) {
        message.reply(`לא הצליח לשלוף צאטים :() \n ${JSON.stringify(e)}`);
        return;
      }
    }
  } else if (message.body.startsWith('!stopCountryCity ')) {
    let groupName = message.body.slice(17);
    message.reply(`עוצר משחק ארץ עיר בקבוצה: \n ${groupName}`);
    online = online.filter((onlineGroup) => onlineGroup.id != groupName)
  } else if (message.body === '!online') {
    const onlineList = JSON.stringify(online, null, 2)

    message.reply(`משחקים פעילים בבוט זה: \n ${onlineList.slice(3, onlineList.length - 1)}`);
  } else if (message.body === '!remove') {
    const messageToSend = JSON.stringify(shouldRemove, null, 2)

    message.reply(messageToSend);
  } else if (message.body.startsWith('!setNextTime ')) {
    const params = message.body.slice(13).split("\n");

    const [groupname, time] = params;

    setNextTimeInfo(groupname, new Date(time))
  } else if (message.body.startsWith('!setNextQuestion ')) {
    const params = message.body.slice(17).split("\n");

    const [groupname, question] = params;

    setNextMessageInfo(groupname, question)
  } else if (message.body === "!info") {
    message.reply(`פונקציות אפשריות - 
    !countryCity {שם קבוצה}
    !stopCountryCity {שם קבוצה}
    !setNextTime {שם קבוצה} (\\n)
          {time}
    !setNextQuestion {שם קבוצה} (\\n)
          {question}
    !online`)
  } else if (message.body === "!debug") {
    const chats = await new Promise((resolve, reject) => {
      setTimeout(reject, 30 * 1000)
      client.getChats().then(resolve);
    })

    const chat = chats.find((chat) => chat.name === "ארץ עיר האחרון שורד - 2🧠❓");

    const dead_chat = chats.find((chat) => chat.name === "ארץ עיר - אי המודחים");

    // const messages = await chat.fetchMessages({ limit: 500 });

    // const msgs = messages.slice(messages.findIndex((searchedMessages => searchedMessages.id.id === messages[305].id.id)) + 1)

    // const uniqMessages = msgs.filter((m) => m.type !== "revoked");

    // const allUsersInGroup = chat.participants.filter((user) => !user.isAdmin);

    // const usersThatDidNotAnswer = allUsersInGroup.filter((id) => !uniqMessages.find(m => (m.author || m.from) === id.id._serialized))

    const mappedIds = chat.groupMetadata.pastParticipants.map(user => user.id._serialized);

    console.log(mappedIds);
  } else if (message.body.startsWith('!shush ')) {
    const groupname = message.body.slice(7);

    shush.includes(groupname) ? "" : shush.push(groupname)
  } else if (message.body.startsWith('!unshush ')) {
    const groupname = message.body.slice(9);

    shush = shush.filter((shushed => shushed !== groupname))
  } else if (message.body === "!chatParticipants") {
    const chat = await new Promise((resolve, reject) => {
      setTimeout(reject, 30 * 1000)
      client.getChatById("120363025989806200@g.us").then(resolve);
    })

    message.reply(JSON.stringify(chat.participants.map(user => user.id._serialized)));
  }
});

client.on('message_reaction', async reaction => {
  const placeInWhitelist = groupsToRemoveFrom.findIndex((value) => value === reaction.msgId.remote);

  if (placeInWhitelist !== -1 && parseInt(reaction.reaction) === 6) {
    const chat = await new Promise((resolve, reject) => {
      setTimeout(reject, 30 * 1000)
      client.getChatById(reaction.msgId.remote).then(resolve);
    })

    const reactingParticipant = chat.participants.find(user => user.id._serialized === reaction.id.participant)
    const reactedParticipant = chat.participants.find(user => user.id._serialized === reaction.msgId.participant)

    if (reactedParticipant && reactingParticipant && reactingParticipant.isAdmin && !reactedParticipant.isAdmin && parseInt(reaction.reaction) === 6) {
      console.log(`removing ${reactedParticipant.id._serialized}`)
      await chat.removeParticipants([reactedParticipant.id._serialized])

      if (groupesToAddTo[placeInWhitelist]) {
        const other_chat = await new Promise((resolve, reject) => {
          setTimeout(reject, 30 * 1000)
          client.getChatById(groupesToAddTo[placeInWhitelist]).then(resolve);
        })

        await other_chat.addParticipants([reactedParticipant.id._serialized])
      }
      // reaction.reply('pong', reactingParticipant.id._serialized);
    }
  } else if (placeInWhitelist !== -1 && reaction.reaction === '😮') {
    const chat = await new Promise((resolve, reject) => {
      setTimeout(reject, 30 * 1000)
      client.getChatById(reaction.msgId.remote).then(resolve);
    })

    const reactingParticipant = chat.participants.find(user => user.id._serialized === reaction.id.participant)
    const reactedParticipant = chat.groupMetadata.pastParticipants.find(user => user.id._serialized === reaction.msgId.participant)

    if (reactedParticipant && reactingParticipant && reactingParticipant.isAdmin && reaction.reaction === '😮') {
      console.log(`adding ${reactedParticipant.id._serialized}`)
      await chat.addParticipants([reactedParticipant.id._serialized])

      if (groupesToAddTo[placeInWhitelist]) {
        const other_chat = await new Promise((resolve, reject) => {
          setTimeout(reject, 30 * 1000)
          client.getChatById(groupesToAddTo[placeInWhitelist]).then(resolve);
        })

        await other_chat.removeParticipants([reactedParticipant.id._serialized])
      }
      // reaction.reply('pong', message.author);
    }
  }
})

client.initialize();

const countryCity = async (groupName, chat) => {
  const choosenChat = chat;

  let randomTime = randomTimeTommorow()

  console.log("started countryCity!");
  while (true) {
    const letter = randomHebrewLetter();

    const type = types[randomNumber(0, types.length)]

    const message = `${type} שמתחיל באות ${letter}`

    setNextTimeInfo(groupName, randomTime);
    setNextMessageInfo(groupName, message);

    console.log(`waiting for time : ${randomTime.toLocaleDateString()} ${randomTime.toLocaleTimeString()}`)
    if (await waitTillStart(randomTime, groupName)) {
      return;
    }

    const object = online.find(group => group.id === groupName);

    const sentMessage = await choosenChat.sendMessage(object.nextMessage);

    await choosenChat.setMessagesAdminsOnly(false);

    pushHistoryInfo(groupName, object.nextMessage);

    if (await waitTillEnd(new Date(new Date().getTime() + ONE_HOUR_MILISECONDS), groupName)) {
      return;
    };

    await choosenChat.setMessagesAdminsOnly(true);

    // check participants and remove failed
    const messages = await choosenChat.fetchMessages({ limit: 500 })

    const relevantMessages = messages.slice(messages.findIndex((searchedMessages => searchedMessages.id.id === sentMessage.id.id)) + 1)

    const uniqMessages = relevantMessages.filter((m) => m.type !== "revoked");

    const allUsersInGroup = choosenChat.participants.filter((user) => !user.isAdmin);

    const usersThatDidNotAnswer = allUsersInGroup.filter((id) => !uniqMessages.find(m => (m.author || m.from) === id.id._serialized))

    const mappedIds = usersThatDidNotAnswer.map(user => user.id._serialized);

    shouldRemove.push(mappedIds);

    console.log(mappedIds);

    // choosenChat.removeParticipants(mappedIds)

    randomTime = randomTimeTommorow()
  }
}

const pushHistoryInfo = (groupName, action) => {
  const parsedObject = {
    time: `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
    message: action
  };

  const index = online.findIndex(group => group.id === groupName);
  online[index].history ?
    online[index].history.push(parsedObject) :
    online[index].history = [parsedObject]
}

const pushDeletedInfo = (groupName, action) => {
  const parsedObject = {
    time: `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
    message: action
  };

  const index = online.findIndex(group => group.id === groupName);
  online[index].history ?
    online[index].history.push(parsedObject) :
    online[index].history = [parsedObject]
}

const setNextTimeInfo = (groupName, action) => {
  const index = online.findIndex(group => group.id === groupName);
  online[index].nextTime = action;
}

const setNextMessageInfo = (groupName, message) => {
  const index = online.findIndex(group => group.id === groupName);
  online[index].nextMessage = message;
}

const waitTillStart = async (time, groupName) => {
  const timeToWait = Math.max(1, new Date(time).getTime() - new Date().getTime());

  const iteration = parseInt((timeToWait / (ONE_HOUR_MILISECONDS)) * 100) + 1;

  const object = online.find(group => group.id === groupName);

  for (let i in [...Array(iteration).keys()]) {
    await delay(timeToWait / (iteration))

    if (!object) {
      return true;
    }

    if (object.nextTime < new Date()) {
      return;
    }
  }

  if (object.nextTime > new Date()) {
    return waitTillStart(time, groupName);
  }
}

const waitTillEnd = async (time, groupName) => {
  const timeToWait = Math.max(1, new Date(time).getTime() - new Date().getTime());

  const iteration = parseInt((timeToWait / (ONE_HOUR_MILISECONDS)) * 100) + 1;

  const object = online.find(group => group.id === groupName);

  for (let i in [...Array(iteration).keys()]) {
    await delay(timeToWait / (iteration))

    if (!object) {
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

const randomHebrewLetter = () => {
  let number = randomNumber(1488, 1514);

  if ([1509, 1507, 1503, 1501, 1498].includes(number)) {
    number += 1;
  }

  return unicodeToChar(`\\u0${(number).toString(16).toUpperCase()}`);;
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
  // const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds() + 10)
  // const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds() + 20)

  return randomDate(start, end);
}

const randomTimeToday = () => {
  const now = new Date();

  // TOMMOROW BETWEEN 7 TO 23->
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18)
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23)

  // IN THE NEXT 10 SECONDS ->
  // const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds() + 10)
  // const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds() + 20)

  return randomDate(start, end);
}