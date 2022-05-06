export const constants = {
    backupPath: `${__dirname}/../backup.tar`,
    fileName: 'backup',
    parentFolder: '16BYoO8NHyhF1nr9M4imAMPt1CGBHnzf9',
    scopes: ['https://www.googleapis.com/auth/drive'],
    tempPath: `${__dirname}/../temp.tar`,
};

export const env = {
    database: process.env.PGDATABASE!,
    host: process.env.PGHOST!,
    password: process.env.PGPASSWORD!,
    port: process.env.PGPORT!,
    user: process.env.PGUSER!,
};