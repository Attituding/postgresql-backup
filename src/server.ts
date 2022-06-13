import 'dotenv/config';
import { backup } from './backup';
import {
    constants,
    env,
} from './constants';
import { driveExport } from './drive';
import express from 'express';
import fs from 'node:fs/promises';
import shell from 'shelljs';
import path from 'node:path';

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

app.all('/backup', async (req, res) => {
    await backup();

    res.sendStatus(200);
});

app.all('/restore/database', async (req, res) => {
    const query = req.query;

    const database = query.database;

    const fileID = query.fileID;

    if (constants.databases.includes(String(database)) === false) {
        res.status(400).send(`Invalid database: ${database} is not listed in ${constants.databases.join(', ')}`);
    }

    if (typeof fileID === 'undefined') {
        res.status(400).send(`No fileID provided`);
    }

    if (typeof fileID !== 'string') {
        res.status(400).send(`Invalid fileID provided: ${fileID} is not typeof string`);
    }

    const drive = await driveExport();

    const file = await drive.files.get({
        fileId: fileID as string,
        alt: 'media',
    });

    await fs.writeFile(
        path.join(__dirname, '..', 'temp.tar'),
        file.data as string,
        {
            encoding: 'binary',
        },
    );

    const output: string = shell.exec(
        `pg_restore --host=${
            env.host
        } --port=${
            env.port
        } --username=${
            env.user
        } --no-password --clean --format=t --dbname=${
            database
        } temp.tar`,
    );

    if (output.toLowerCase().includes('error')) {
        res.status(500).send(`An error occurred while trying to restore.\n\nError:\n${output}`);
        console.error(new Error(output));

        return;
    }

    console.log(`Restored ${database} with ${fileID}`);

    res.sendStatus(200);
});

app.all('/restore/global', async (req, res) => {
    const query = req.query;

    const fileID = query.fileID;

    if (typeof fileID === 'undefined') {
        res.status(400).send(`No fileID provided`);
    }

    if (typeof fileID !== 'string') {
        res.status(400).send(`Invalid fileID provided: ${fileID} is not typeof string`);
    }

    const drive = await driveExport();

    const file = await drive.files.get({
        fileId: fileID as string,
        alt: 'media',
    });

    await fs.writeFile(
        path.join(__dirname, '..', 'global.out'),
        file.data as string,
        {
            encoding: 'binary',
        },
    );

    const output: string = shell.exec(
        `psql --host=${
            env.host
        } --port=${
            env.port
        } --username=${
            env.user
        } --no-password --single-transaction < global.out`,
    );

    if (output.toLowerCase().includes('error')) {
        res.status(500).send(`An error occurred while trying to restore.\n\nError:\n${output}`);
        console.error(new Error(output));

        return;
    }

    console.log(`Restored global with ${fileID}`);

    res.sendStatus(200);
});

app.all('*', (_req, res) => {
    console.log(404);

    res.status(404).send(
        `/?auth=password<br>
        <br>
        /backup<br>
        /restore/database?auth=password&database=database&fileID=fileID<br>
        /restore/global?auth=password&fileID=fileID<br>`,
    );
});

app.listen(3000, '0.0.0.0');