import cron from 'node-cron';
import process from 'node:process';
import { backup } from './backup';
import { env } from './constants';

cron.schedule(env.cron, async (date) => {
    try {
        await backup(date);
    } catch (error) {
        console.error(error);
        process.exit(-1);
    }
}, {
    timezone: 'America/Vancouver',
});