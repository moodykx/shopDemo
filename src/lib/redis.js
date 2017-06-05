import { redis as config } from '../../config';
import redisLib from 'redis';
import ShortUUID from 'shortuuid';
import { v4 as UUID } from 'uuid';

export const numberGenerator = new ShortUUID('0123456789')
export const redis = redisLib.createClient(config);

export function generateSMSCode(phone) {
  const key = `sms:${phone}`;
  const code = numberGenerator.random(6);
  return new Promise((resolve, reject) => {
    redis.setex([key, 300, code], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(code);
      }
    });
  });
}

export function verifySMSCode(phone, code) {
  const key = `sms:${phone}`;
  return new Promise((resolve, reject) => {
    redis.get(key, (err, rely) => {
      if (err) {
        return reject(err);
      }
      if (Number(code) !== Number(rely)) {
        return reject('验证码错误');
      }
      resolve();
    });
  });
}

export function generateToken(name) {
  const token = UUID();
  const key = `token:${token}`;
  return new Promise((resolve, reject) => {
    redis.setex([key, 604800, name], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(token);
      }
    });
  });
}

export function getTokenValue(token) {
  const key = `token:${token}`;
  return new Promise((resolve, reject) => {
    redis.get(key, (err, rely) => {
      if (err) {
        return reject(err);
      }
      resolve(rely);
    });
  });
}

export function removeToken(token) {
  const key = `token:${token}`;
  return new Promise((resolve, reject) => {
    redis.del(key, (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  })
}
