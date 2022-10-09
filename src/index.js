const express = require('express');
require('dotenv').config();
require('./db/mongoose');
const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');
const { errorHandler } = require('./middleware/errorMiddleware');

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(userRouter);
app.use(taskRouter);

app.use(errorHandler);

app.listen(port, () => console.log(`Server is running on port ${port}`));

// Prisma
// GraphQL
// React Native
// TypeScript
// material ui

// what to rewatch : postman setup video, deployment video.
