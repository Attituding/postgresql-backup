import 'dotenv/config';
import {
    constants,
    env,
} from './constants';
import { driveExport } from './drive';
import express from 'express';
import fs from 'node:fs/promises';
import shell from 'shelljs';
import { backup } from './backup';

const app = express();

app.use((req, _res, next) => {
    console.log(req.path, req.query);

    next();
});

app.use((req, res, next) => {
    const query = req.query;

    if (query.auth === env.password) {
        // eslint-disable-next-line callback-return
        next();
    } else {
        console.warn(401);
        res.sendStatus(401);
    }
});

app.all('/backup', async (_req, res) => {
    await backup();

    res.sendStatus(200);
});

app.all('/restore', async (req, res) => {
    const query = req.query;

    const drive = await driveExport();

    const fileID = (query.fileID as string | undefined) ?? (
        await drive.files.list({
            includeItemsFromAllDrives: true,
            pageSize: 1,
            // eslint-disable-next-line id-length
            q: `'${constants.parentFolder}' in parents and trashed = false`,
            supportsAllDrives: true,
        })
    ).data.files?.[0]?.id;

    if (fileID) {
        const file = await drive.files.get({
            fileId: fileID,
            alt: 'media',
        });

        await fs.writeFile(
            constants.tempPath,
            file.data as string,
            {
                encoding: 'binary',
            },
        );

        shell.exec(`pg_restore -U ${env.user} -h ${env.host} -p ${env.port} -w -c -F t -d ${env.database} temp.tar`);

        res.status(200).send(`Restored from ${fileID}`);
    } else {
        res.status(500).send('No backups available.');
    }
});

app.listen(3000, '0.0.0.0');