const express = require('express');

const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const userRouter = express.Router();

userRouter.post('/signup', authController.signup);
userRouter.post('/login', authController.login);
userRouter.get('/logout', authController.logout);

userRouter.post('/forgetPassword', authController.forgetPassword);
userRouter.patch('/resetPassword/:token', authController.resetPassword);

userRouter.use(authController.protect);

userRouter.patch('/updatePassword', authController.updatePassword);
// update user data like name, email

// update me
userRouter.patch(
  '/updateUser',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  authController.updateUser,
);
// delete me
userRouter.post('/deleteUser', authController.deleteUser);
// get me
userRouter.get('/me', userController.getMe, userController.getUser);
userRouter.get('/my-tours', userController.getMe, userController.getUser);

userRouter.use(authController.restrictTo('admin'));

userRouter
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

userRouter
  .route('/:id')
  .get(userController.getUser)
  // Do NOT update passwords with this! no safe moddleware is running here
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = userRouter;
