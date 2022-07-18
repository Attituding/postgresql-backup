import express from 'express';
import fs from 'node:fs/promises';
import shell from 'shelljs';
import path from 'node:path';
import { driveExport } from './drive';
import {
    constants,
    env,
} from './constants';
import { backup } from './backup';

const app = express();

app.use((req, _res, next) => {
    console.log(req.path, req.query);

    next();
});

app.use((req, res, next) => {
    const { auth } = req.query;

    if (auth !== env.postgresPassword) {
        console.warn(401);
        res.sendStatus(401);

        return;
    }

    next();
});

app.all('/backup', async (req, res) => {
    await backup();

    res.sendStatus(200);
});

app.all('/raw', (req, res) => {
    const { query } = req.query;

    if (typeof query === 'undefined') {
        res.status(400).send('No query provided');

        return;
    }

    const queryLength = Object.values(req.query).length;

    if (queryLength !== 2) {
        res.status(400).send(`Invalid amount of queries: ${queryLength} is not the expected amount of queries.`);

        return;
    }

    if (typeof query !== 'string') {
        res.status(400).send(`Invalid query provided: ${query} is not typeof string`);

        return;
    }

    const output: string = shell.exec(query as string);

    if (output.toLowerCase().includes('error')) {
        res.status(500).send(`An error occurred while trying to restore.\n\nError:\n${output}`);
        console.error(new Error(output));

        return;
    }

    console.log(`Executed query ${query}`);

    res.status(200).send(output);
});

app.all('/restore/database', async (req, res) => {
    const { database, fileID } = req.query;

    if (constants.databases.includes(String(database)) === false) {
        res.status(400).send(`Invalid database: ${database} is not listed in ${constants.databases.join(', ')}`);

        return;
    }

    if (typeof fileID === 'undefined') {
        res.status(400).send('No fileID provided');

        return;
    }

    const queryLength = Object.values(req.query).length;

    if (queryLength !== 3) {
        res.status(400).send(`Invalid amount of queries: ${queryLength} is not the expected amount of queries. Did you mean to use /restore/global?`);

        return;
    }

    if (typeof fileID !== 'string') {
        res.status(400).send(`Invalid fileID provided: ${fileID} is not typeof string`);

        return;
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
            env.postgresHost
        } --port=${
            env.postgresPort
        } --username=${
            env.postgresUser
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
    const { query } = req;

    const { fileID } = query;

    if (typeof fileID === 'undefined') {
        res.status(400).send('No fileID provided');

        return;
    }

    const queryLength = Object.values(query).length;

    if (Number(queryLength) !== 2) {
        res.status(400).send(`Invalid amount of queries: ${queryLength} is not the expected amount of queries. Did you mean to use /restore/database?`);

        return;
    }

    if (typeof fileID !== 'string') {
        res.status(400).send(`Invalid fileID provided: ${fileID} is not typeof string`);

        return;
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
            env.postgresHost
        } --port=${
            env.postgresPort
        } --username=${
            env.postgresUser
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
        /backup?auth=password<br>
        /raw?auth=password&query=query<br>
        /restore/database?auth=password&database=database&fileID=fileID<br>
        /restore/global?auth=password&fileID=fileID<br>`,
    );
});

app.listen(3000);