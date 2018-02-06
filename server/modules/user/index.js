import Router from 'koa-router';
import authController from './controllers/auth-controller.js';
import userController from './controllers/user-controller.js';
import getUser from '../../utils/getUser.js';
import { User } from './models';

const router = new Router({ prefix: '/user' });

router
  .post('/signup', getUser(), authController.signup)
  .post('/login', getUser(), authController.login)
  .get('/logout', getUser(), authController.logout)
  .post('/forgot', getUser(), authController.forgotPassword)
  .get('/setNewPassword', getUser(), authController.setNewPasswordData)
  .post('/setNewPassword', getUser(), authController.setNewPassword)
  .get('/', getUser(), userController.currentUser)
  .post('/change', getUser(), userController.changeUser)
  .post('/delete', getUser(), userController.deleteUser)
  ;

export default router.routes();

export {
  User,
};
