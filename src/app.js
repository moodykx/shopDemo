import express        from 'express';
import path           from 'path';
import bodyParser     from 'body-parser';
import methodOverride from 'method-override';
import http           from 'http';
const app = express();
export default app;

app.set('port', process.env.PORT || 3000);
app.set('host', process.env.HOST || '127.0.0.1');
app.use(bodyParser.urlencoded({
  extended: false,
  limit: '512kb'
}));
app.use(bodyParser.json());
app.use(methodOverride());

app.set('views', path.join(path.dirname(__dirname), 'views'));
app.set('view engine', 'pug');

app.use(express.static(path.join(path.dirname(__dirname), 'public')));

app.get('/', (req, res) => {
  res.render('index', { title: 'Hey', message: 'Hello there!' });
});

http.createServer(app).listen(app.get('port'), app.get('host'), () => {
  console.log("Express server listening on port " + (app.get('port')));
});
