# PostgreSQL Backup

PostgreSQL Backup is a utility for backing up small-ish PostgreSQL servers to a Google Drive account.

By default, backups occur every twenty-four hours at midnight.

Through the following endpoints, you can manually back up and restore your backups.

Putting the password in the query is probably not a terrific idea, but does allow for easy usage in browsers.

## /?auth=password
Shows this information

## /backup?auth=password
Allows you to manually back up the database

## /raw?auth=password&query=query
Allows you to execute scripts on the host system (probably a bad idea, please advise)

## /restore/database?auth=password&database=database&fileID=fileID
Allows you to restore a specific database with a specific tar file on Google Drive

## /restore/global?auth=password&fileID=fileID
Allows you to restore global PostgreSQL configs (roles and tablespaces)