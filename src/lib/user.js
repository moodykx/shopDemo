import { UserService } from './service';
import { user as config } from '../../config';

import { verifySMSCode, getTokenValue, generateToken, generateSMSCode, removeToken } from './redis';
import { sendSMSCode } from './alidayu';

export const srv = new UserService(config);

function generateServiceName({service, name}) {
  return `${service}-${name}`;
}

async function checkUnBind({ service, name }) {
  let binded;
  try {
    binded = await srv.getBind(generateServiceName({ service, name }));
  } catch (e) {}
  if (binded) {
    throw `${service} ${name} is already used`
  }
}

async function doBind({ service, name, username }) {
  await srv.createBind(username, {service, name: generateServiceName({service, name})});
}

async function checkUnExistUser(username) {
  let user;
  try {
    user = await srv.get(username);
  } catch (e) { }
  if (user) {
    throw `user ${username} is already exists`;
  }
}

async function doSignin(username) {
  const token = await generateToken(username);
  return token;
}

async function createUserHandler_({ username, phone, code, passwd }) {
  await checkUnBind({service: 'phone', name: phone});
  await verifySMSCode(phone, code);
  await checkUnExistUser(username);
  await srv.create({username, passwd});
  await doBind({ service: 'phone', name: phone, username });
  const token = await doSignin(username);
  return token;
}

async function signinHandler_({ username, passwd }) {
  let user
  try {
    user = await srv.get(username);
  } catch (e) {
    bind = await srv.getBind(generateServiceName({ service: 'phone', phone: username }));
    user = await srv.get(bind.user_id);
  }
  await srv.verifyPassword(user.name, passwd);
  const token = await doSignin(user.name)
  return token;
}

function createUserHandler(req, res) {
  createUserHandler_(req.body)
    .then((token) => res.json({ token }))
    .catch((e) => {
      console.error('createUserHandler failed ', e)
      res.status(400).json({err: e})
    });
}

function signinHandler(req, res) {
  signinHandler_(req.body)
    .then((token) => res.json({ token }))
    .catch((e) => {
      console.error('signinHandler failed ', e)
      res.status(400).json({err: e})
    });
}

async function sendSMSCodeHandler_(phone) {
  const code = await generateSMSCode(phone);
  await sendSMSCode(phone, code);
}

function sendSMSCodeHandler(req, res) {
  sendSMSCodeHandler_(req.body.phone)
    .then(() => res.json({ result: 'OK' }))
    .catch((e) => {
      console.error('sendSMSCodeHandler failed ', e)
      res.status(400).json({err: "send sms code failed"})
    });
}


function updatePasswdHandler(req, res) {
  const { passwd, new_passwd } = req.body;
  async function update() {
    await srv.verifyPassword(req.currentUser.name, passwd);
    const ret = await srv.updatePassword(req.currentUser.name, new_passwd)
    await removeToken(req.token);
    return ret
  }
  update()
    .then((ret) => res.json({ result: 'OK' }))
    .catch((e) => {
      console.error('updatePasswdHandler falied', e);
      res.status(400).json({ err: e });
    });
}

function resetPasswdHandler(req, res) {
  const {phone, code, passwd} = req.body;
  async function reset() {
    await verifySMSCode(phone, code);
    const ret = await srv.updatePassword(req.currentUser.name, passwd)
    await removeToken(req.token);
    return ret
  }
  reset()
    .then((ret) => res.json({ result: 'OK' }))
    .catch((e) => {
      console.error('resetPasswdHandler falied', e);
      res.status(400).json({ err: e });
    });
}

function updateExtraHandler(req, res) {
  async function update() {
    const ret = await srv.updateExtra(req.currentUser.name, req.body);
    return ret
  }
  update()
    .then((ret) => res.json(ret))
    .catch((e) => {
      console.error('updateExtraHandler falied', e);
      res.status(400).json({ err: e });
    });
}

export function currentUser() {
  async function getRequestUser(token) {
    const username = await getTokenValue(token);
    const user = await srv.get(username);
    return user;
  }
  return (req, res, next) => {
    let token = req.get('x-request-token');
    if (!token) {
      token = req.params.token || req.body.token || req.query.token;
    }

    if (!token) {
      return next();
    }
    req.token = token;
    getRequestUser(token)
      .then((user) => {
        req.currentUser = user;
        next();
      })
      .catch(() => {
        next();
      });
  }
}

export function requireLogin() {
  return function (req, res, next) {
    if (req.currentUser) {
      return next();
    }
    res.status(403).json({ err: 'Unauthorized' });
  };
}

export function route(app) {
  app.post('/api/signin', signinHandler);
  app.post('/api/signup', createUserHandler);
  app.post('/api/send_sms_code', sendSMSCodeHandler);
  app.get('/api/users/me', requireLogin(), (req, res) => {
    res.json(req.currentUser);
  });
  app.post('/api/update_passwd', updatePasswdHandler);
  app.post('/api/reset_passwd', resetPasswdHandler);
  app.post('/api/update_profile', updateExtraHandler);
}
