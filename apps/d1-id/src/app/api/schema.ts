export const schema = [
	`CREATE TABLE IF NOT EXISTS users ( 
        user_id INTEGER PRIMARY KEY,
        username             VARCHAR(100) NOT NULL,
        created_on           INTEGER NOT NULL,
        CONSTRAINT unq_users_username UNIQUE ( username )
    );`,
	`CREATE TABLE IF NOT EXISTS namespaces ( 
        namespace_id INTEGER PRIMARY KEY,
        name                 VARCHAR(100) NOT NULL,
        created_on           INTEGER NOT NULL,
        user_id              INTEGER NOT NULL,
        CONSTRAINT unq_namespaces_name UNIQUE ( user_id,name ),
        FOREIGN KEY ( user_id ) REFERENCES users( user_id ) ON DELETE CASCADE ON UPDATE CASCADE
    );`,
	`CREATE TABLE IF NOT EXISTS ids ( 
        _id INTEGER PRIMARY KEY,
        name                  VARCHAR(100) NOT NULL,
        created_on            INTEGER NOT NULL,
        user_id               INTEGER NOT NULL,
        namespace_id          INTEGER NOT NULL,
        CONSTRAINT unq_ids_id UNIQUE ( namespace_id,name ),
        FOREIGN KEY ( user_id ) REFERENCES users( user_id ) ON DELETE CASCADE ON UPDATE CASCADE
        FOREIGN KEY ( namespace_id ) REFERENCES namespaces( namespace_id ) ON DELETE CASCADE ON UPDATE CASCADE
    );`,
]
