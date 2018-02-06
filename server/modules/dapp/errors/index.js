import AppError from 'AppErrors';

export default () => async (ctx, next) => {
  try {
    await next(ctx);
  } catch (e) {
    if (e.message.indexOf('Provided address')==0 && e.message.indexOf('is invalid, the capitalization checksum test failed, or its an indrect IBAN address which')!=-1) {
      throw new AppError(404, 800);
    } else {
      throw e;
    }
  }
};
