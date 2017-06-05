import { alidayu as config, dev } from '../../../config';
import { TopClient } from './topClient';

const client = new TopClient(config);

export function sendSMSCode(phoneNumber, code) {
  if (dev) {
    console.log(phoneNumber, code);
    return Promise.resolve(0) ;
  }
  return new Promise((resolve, reject) => {
    client.execute( 'alibaba.aliqin.fc.sms.num.send', {
      'extend' : '',
      'sms_type' : 'normal',
      'sms_free_sign_name' : '身份验证',
      'sms_param' : JSON.stringify({ code: code, product: 'CodeCard' }),
      'rec_num' : phoneNumber,
      'sms_template_code' : "SMS_60160572"
    }, (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}
