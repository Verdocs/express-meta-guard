import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import {BooksController} from './controllers';

const app = express();

app.use(cookieParser());
app.use(bodyParser.json({limit: '10mb'}) as express.RequestHandler);

app.use('/', [new BooksController().router]);

export {app};
