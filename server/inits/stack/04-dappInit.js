import init from '../../modules/dapp/init';

export default async () => {
    process.stdout.write('BlockChainInit');
    const int = setInterval(() => {
        process.stdout.write('.');
    }, 200);
    await init();
    clearInterval(int);
    process.stdout.write('done');
    console.log('');
};
