# bes-config-node
Beagle Entertainment System Node.js-based configuration interface

Requires nodejs v0.12.x, which you can get via:

$ curl -sL https://deb.nodesource.com/setup_0.12 | sudo bash -
$ sudo apt-get install -y nodejs
$ sudo ln -s /usr/bin/nodejs /usr/bin/node


Requires the following Node modules to be installed:

1. body-parser
2. diskspace
3. express
4. fs
5. multer
6. sqlite3

For your convenience, there is a script called "install_modules.sh" that
will perform the necessary npm commands to install these modules locally
into this project's "node_modules" directory. Just run it from inside of
the project and it will create the "node_modules" directory and do the
installation.

Once the modules have all been installed, just run the "run.sh" script to
start the configuration interface. Use a web browser to view the interface
locally at port 5000 (http://127.0.0.1:5000).

The directory structure for deployment is as follows:

1. games.db  <-- Database of games and controller settings, or link to it
2. node_modules/*  <-- Locally installed Node modules (created by install script)
3. public/*  <-- Images and other content requested by the web pages
4. roms/*  <-- Directories of ROMs (gb, nes, snes), or link to it
5. server.js  <-- The web server and database access logic
6. static/*  <-- Static pieces of the web pages of the interface
7. uploads/  <-- Temporary directory used during ROM uploads

Included is a dummy games.db to let you try out the interface. The database
tables schemas are created with the following sqlite shell commands:

sqlite3 games.db 'CREATE TABLE Games ( GameTitle varchar NOT NULL, RomFile varchar NOT NULL, InfoText0 varchar NOT NULL, InfoText1 varchar NOT NULL, InfoText2 varchar NOT NULL, InfoText3 varchar NOT NULL, InfoText4 varchar NOT NULL, DateText varchar NOT NULL, Genre0 varchar NOT NULL, Genre1 varchar NOT NULL, Platform tinyint NOT NULL, PRIMARY KEY (RomFile, Platform) )'

sqlite3 games.db 'CREATE TABLE Controls ( LButton tinyint NOT NULL, RButton tinyint NOT NULL, AButton tinyint NOT NULL, BButton tinyint NOT NULL, XButton tinyint NOT NULL, YButton tinyint NOT NULL, StartButton tinyint NOT NULL, SelectButton tinyint NOT NULL, PauseButton tinyint NOT NULL, XAxis tinyint NOT NULL, YAxis tinyint NOT NULL, InvertX tinyint NOT NULL, InvertY tinyint NOT NULL, AnalogCutoff tinyint NOT NULL, PauseCombo varchar NOT NULL, Gamepad tinyiny NOT NULL, PRIMARY KEY (Gamepad) )'

