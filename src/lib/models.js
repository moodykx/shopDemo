import mongoose, { Schema } from 'mongoose';
import { mongod } from '../../config';
import { initialize, plugin as autoIncrPlugin } from 'mongoose-auto-increment';

mongoose.connect(mongod);
initialize(mongoose.connection);

const { Mixed } = Schema.Types;
//用户表
var User = new Schema({
  username:      { type: String, index: { unique: true } },
  avatar:        Mixed,
  roles:         [String],
  extra:         Mixed,
  created_at:    { type: Date, "default": Date.now }
});
//密码表
var Passwd = new Schema({
  user_id: { type: Number, index: { unique: true } },
  phone:   { type: String, index: { unique: true } },
  passwd:  String
});

var OauthToken = new Schema({
  user_id:       Number,
  access_token:  { type: String, index: { unique: true } },
  refresh_token: { type: String, index: { unique: true } },
  created_at:    { type: Date, "default": Date.now },
  expires_in:    { type: Number, "default": 3600 * 24 * 7 }
});
//用户信息表
var Binding = new Schema({
  user_id:    { type: String, index: true },
  type:       { type: String, index: true },
  token:      { type: String, index: { unique: true } },
  token_raw:  String,
  expire_at:  Date,
  uid:        { type: String, index: true },
  domain:     String,
  username:   String,
  nickname:   String,
  urlname:    String,
  sex:        String,
  raw:        String,
  created_at: { type: Date, "default": Date.now }
});
//商品分类表
var Channel = new Schema({
  urlname:    { type: String, index: { unique: true } },
  title:      { type: String, index: { unique: true } },
  created_at: { type: Date, "default": Date.now }
});

Channel.plugin(autoIncrement.plugin, { model: 'Channel', field: 'channel_id', startAt: 1 });
//图片表
const FileSchema = new Schema({
  file_key:    { type: String, index: { unique: true } },
  file_bucket: { type: String, index: true},
  extra:       Mixed,
  created_at:  { type: Date, default: Date.now }
});

FileSchema.plugin(autoIncrPlugin, { model: 'File', field: 'file_id', startAt: 1 });

export const File = mongoose.model('File', FileSchema);
//商品表
const ItemSchema = new Schema({
  name:        String,
  summary:     String,
  extra:       Mixed,
  created_at:  { type: Date, default: Date.now }
})

ItemSchema.plugin(autoIncrPlugin, { model: 'Item', field: 'item_id', startAt: 1 });

export const Item = mongoose.model('Item', ItemSchema);
























export const Sequence = mongoose.model('Sequence', new Schema({
  name: { type: String, index: { unique: true } },
  id:   { type: Number, default: 1 }
}));

Sequence.next = async function(name, step = 1, def = 1) {
  let seq;
  seq = await Sequence.findOneAndUpdate({name}, {$inc: {id: step}}, {new: true});
  if (seq) {
    return seq.id;
  }
  seq = await (new Sequence({name, id: def})).save();
  return seq.id;
};

Sequence.get = async function(name, def = 1) {
  let seq;
  seq = await Sequence.findOne({name});
  if (seq) {
    return seq.id;
  }
  seq = await (new Sequence({name, id: def}));
  return seq.id;
}

Sequence.set = async function(name, id) {
  const seq = await (new Sequence({name, id: def})).save();
  return seq.id;
}
