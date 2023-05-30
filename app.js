// packages
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const csp = require('express-csp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');

require('dotenv').config({ path: './config.env' });

// error handling
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

// routers
const userRouters = require('./routes/userRouters');
const certificateRouters = require('./routes/certificateRouters');
const certCategoryRouters = require('./routes/certCategoryRouters');

// memulai aplikasi express
const app = express();

// trusting proxy
app.enable('trust proxy');

// global middleware

// menyajikan view
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// menggunakan cors
app.use(cors());

app.options('*', cors());

// menyajikan static public
// backend
const dirname = path.resolve();
app.use('/v1/ser/uploads', express.static(path.join(dirname, 'uploads')));

// menggunakan helmet
app.use(helmet());

csp.extend(app, {
  policy: {
    directives: {
      'default-src': ['self'],
      'style-src': ['self', 'unsafe-inline', 'https:'],
      'font-src': ['self', 'https://fonts.gstatic.com'],
      'script-src': [
        'self',
        'unsafe-inline',
        'data',
        'blob',
        'https://*.cloudflare.com/',
        // 'https://bundle.js:8828',
        `https://localhost:${process.env.PORT}/`,
      ],
      'worker-src': [
        'self',
        'unsafe-inline',
        'data:',
        'blob:',
        'https://*.cloudflare.com/',
        // 'https://bundle.js:*',
        `https://localhost:${process.env.PORT}/`,
      ],
      'frame-src': [
        'self',
        'unsafe-inline',
        'data:',
        'blob:',
        'https://*.cloudflare.com/',
        // 'https://bundle.js:*',
        `https://localhost:${process.env.PORT}/`,
      ],
      'img-src': [
        'self',
        'unsafe-inline',
        'data:',
        'blob:',
        'https://*.cloudflare.com/',
        // 'https://bundle.js:*',
        `https://localhost:${process.env.PORT}/`,
      ],
      'connect-src': [
        'self',
        'unsafe-inline',
        'data:',
        'blob:',
        // 'wss://<HEROKU-SUBDOMAIN>.herokuapp.com:<PORT>/',
        'https://*.cloudflare.com/',
        // 'https://bundle.js:*',
        `https://localhost:${process.env.PORT}/`,
      ],
    },
  },
});

// logging dev
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// menggunakan api limiter (NANTI)
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message:
    'Terlalu banyak request dari IP ini, mohon dicoba lagi di dalam 1 jam',
});

app.use('/v1/ser', limiter);

// menggunakan express body parser
app.use(express.json({ limit: '10kb' }));

// untuk melakukan parse data yang akan datang dari sebuah URL encoded form
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// menggunakan cookie-parser
app.use(cookieParser());

// menggunakan data sanitization untuk melawan NoSQL setiap injection
app.use(mongoSanitize());

// menggunakan data sanitization melawan XSS
app.use(xss());

// mencegah parameter pollution app.use(hpp()); (NANTI)
app.use(hpp({ whitelist: [] }));

// menggunakan compression (NANTI)
app.use(compression());

// middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// api routes
app.use('/v1/ser/users', userRouters);
app.use('/v1/ser/certificates', certificateRouters);
app.use('/v1/ser/certCategory', certCategoryRouters);

// jika endpoint tidak ditemukan
app.all('*', (req, res, next) => {
  return next(
    new AppError(`Tidak bisa mencari ${req.originalUrl} di server ini!`, 404)
  );
});

// menggunakan error handling middleware
app.use(globalErrorHandler);

module.exports = app;
