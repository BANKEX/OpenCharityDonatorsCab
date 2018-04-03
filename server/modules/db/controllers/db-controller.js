import { Organization } from '../../dapp';
import { User } from '../../user';
import DappService from '../../../services/dapp-service';
import AppError from '../../../utils/AppErrors.js';
 
export default {

  async users(ctx) {
    ctx.body = await User.find();
  },

  async orgs(ctx) {
    ctx.body = await Organization.find();
  },
  
  async dropUsers(ctx) {
    if (ctx.request.header['content-type']!='application/json' &&
      ctx.request.header['content-type']!='application/x-www-form-urlencoded') throw new AppError(400, 10);
    if (ctx.request.body.password!='users') throw new AppError(401, 100);
    ctx.body = await User.remove();
  },
  
  async dropOrgs(ctx) {
    if (ctx.request.header['content-type']!='application/json' &&
      ctx.request.header['content-type']!='application/x-www-form-urlencoded') throw new AppError(400, 10);
    if (ctx.request.body.password!='organ') throw new AppError(401, 100);
    ctx.body = await DappService.init();
  },
  
};
