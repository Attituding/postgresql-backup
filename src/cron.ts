import cron from 'node-cron';
import process from 'node:process';
import { backup } from './backup';

cron.schedule('0 */24 * * *', async date => {
    try {
        await backup(date);
    } catch (error) {
        console.error(error);
        process.exit(-1);
    }
}, {
    timezone: 'America/Vancouver',
});