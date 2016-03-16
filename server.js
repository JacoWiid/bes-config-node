var express = require('express');
var multer = require('multer');
var fs = require('fs');
var sqlite3 = require('sqlite3').verbose();
var bodyParser = require('body-parser');
var diskspace = require('diskspace');

var app = express();
var htmlRoot = __dirname + '/public/'

var upload = multer({ dest: __dirname + '/uploads/' });
var file = "games.db";
var exists = fs.existsSync(file);
var db = new sqlite3.Database(file);

var baseROMPath = "./roms/";

app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json());

/* serves main page */
app.get("/", function(req, res) {
  res.sendFile(htmlRoot + 'index.html')
}); /* end index.html */

app.post("/gamepadSaveData", function(req, res) {
  var query = "";
  var response= "";
  console.log("/gamepadSaveData");
  query = "UPDATE Controls SET LButton=" + req.body.L;
  query += ", RButton=" + req.body.R + ", AButton=";
  query += req.body.A + ", BButton=" + req.body.B;
  query += ", XButton=" + req.body.X + ", YButton=";
  query += req.body.Y + ", StartButton=" + req.body.Start;
  query += ", SelectButton=" + req.body.Select;
  query += ", PauseButton=" + req.body.Pause;
  query += ", XAxis=" + req.body.XAxis + ", YAxis=";
  query += req.body.YAxis + ", InvertX=" + req.body.InvertX;
  query += ", InvertY=" + req.body.InvertY;
  query += ", AnalogCutoff=" + req.body.AnalogCutoff;
  query += ", PauseCombo=\"" + req.body.PauseCombo; 
  query += "\" WHERE Gamepad=" + req.body.Gamepad; 

  console.log(query);

  db.all(query, function(err, rows) {
    if (err) throw err;

    res.setHeader('Content-Type', 'application/json');
    res.send("{ \"Update\":\"true\" }");
  }); /* end db.all() */

}); /* end gamepadSaveData */

app.post("/gamepadLoadData", function(req, res) {
  var query = "";
  var response= "";
  console.log("/gamepadLoadData");
  query = "SELECT * FROM Controls WHERE Gamepad=" + req.body.Gamepad;

  res.setHeader('Content-Type', 'application/json');

  db.all(query, function(err, rows) {
    if (err) throw err;
    rows.forEach(function (row) {
      response = "{\"L\":\"" + row.LButton + "\", \"R\":\"";
      response += row.RButton + "\", \"A\":\"" + row.AButton;
      response += "\", \"B\":\"" + row.BButton + "\", \"X\":\"";
      response += row.XButton + "\", \"Y\":\"" + row.YButton;
      response += "\", \"Start\":\"" + row.StartButton;
      response += "\", \"Select\":\"" + row.SelectButton;
      response += "\", \"Pause\":\"" + row.PauseButton;
      response += "\", \"XAxis\":\"" + row.XAxis + "\", \"YAxis\":\"";
      response += row.YAxis + "\", \"InvertX\":\"" + row.InvertX;
      response += "\", \"InvertY\":\"" + row.InvertY;
      response += "\", \"PauseCombo\":\"" + row.PauseCombo;
      response += "\", \"AnalogCutoff\":\"" + row.AnalogCutoff + "\" }";
    }); /* end rows.forEach() */
    console.log(response);
    res.send(response);
  }); /* end db.all() */

}); /* end gamepadLoadData */

app.post("/arRequestUsage", function(req, res) {
  diskspace.check('/dev/sda1', function(err, total, free, status) {
    var parsed;
    var response = "{ \"TotalSize\":\"" + total + "\", \"FreeSize\":\"";
    response += free + "\" }";

    console.log(response);
    res.setHeader('Content-Type', 'application/json');
    parsed = JSON.parse(response);
    res.send(JSON.stringify(parsed));
  }); /* end diskspace.check() */  
});

app.post("/arAddROM", upload.single('romFile'), function(req, res) { 
  var newPath = baseROMPath;
  var retVal;
  var query = "";

  res.setHeader('Content-Type', 'application/json');

  if (req.body.Platform == 1)
    newPath += "snes/";
  else if (req.body.Platform == 3)
    newPath += "nes/";
  else
    newPath += "gb/";
  newPath += req.file.originalname;

  fs.renameSync(req.file.path, newPath);
  retVal = fs.statSync(newPath);
  if (!retVal.isFile()) {
    console.log("FAILURE on file copy");
    fs.unlinkSync(req.file.path);
    res.send("{\"Status\":\"fail\"}");
  } else {
    console.log("SUCCESS on file copy");
    query = "INSERT INTO Games VALUES (\"" + req.file.originalname + "\", \"";
    query += req.file.originalname + "\", \"\", \"\", \"\", \"\", \"\", ";
    query += "\"19XX\", \"\", \"\", " + req.body.Platform + ")";
    console.log(query);

    db.all(query, function(err, rows) {
      /*if (err) throw err;*/
      res.send("{\"Status\":\"success\"}");
    }); /* end db.all() */
  } /* end if */

}); /* end uploadROM */

app.post("/arRefreshList", function(req, res) {
  var parsed;
  var response = "{ ";
  var count = 0;

  console.log("Received request for /arRefreshList: " + req.body.platform);

  query = "SELECT RomFile FROM Games WHERE Platform=" + req.body.platform;
  console.log(query);
  db.all(query, function(err, rows) {
    if (err) throw err;
    rows.forEach(function (row) {
      response += "\"RomFile" + count + "\":\"" + row.RomFile + "\",";
      count++;      
    }); /* end rows.forEach() */
    response += "\"\":\"\" }";
    console.log(response);
    res.setHeader('Content-Type', 'application/json');
    parsed = JSON.parse(response);
    res.send(JSON.stringify(parsed));
  }); /* end db.all() */

}); /* end arRefreshList */

app.post("/arRemoveROM", function(req, res) {
  var path = baseROMPath;
  var parsed;
  var retVal;

  console.log("Received request for /removeROM: type: " + req.body.platform);

  query = "DELETE FROM Games WHERE (RomFile='" + req.body.RomFile;
  query += "' AND Platform=" + req.body.Platform + ")";
  console.log(query);
  
  db.all(query, function(err, rows) {
    //if (err) throw err;
    if (req.body.Platform == 1)
      path += "snes/";
    else if (req.body.Platform == 3)
      path += "nes/";
    else
      path += "gb/";
    path += req.body.RomFile;
    fs.unlinkSync(path);
 
    res.setHeader('Content-Type', 'application/json');
    res.send("{\"removed\":\"true\"}");
  }); /* end db.all() */
}); /* end removeROM */

app.post("/editSubmitData", function(req, res) {
  var query = "";
  var parsed;

  query = "UPDATE Games SET GameTitle=\"" + req.body.GameTitle + "\", ";
  query += "InfoText0=\"" + req.body.InfoText0 + "\", ";
  query += "InfoText1=\"" + req.body.InfoText1 + "\", ";
  query += "InfoText2=\"" + req.body.InfoText2 + "\", ";
  query += "InfoText3=\"" + req.body.InfoText3 + "\", ";
  query += "InfoText4=\"" + req.body.InfoText4 + "\", ";
  query += "DateText=\"" + req.body.DateText + "\", ";
  query += "Genre0=\"" + req.body.Genre0 + "\", ";
  query += "Genre1=\"" + req.body.Genre1 + "\" WHERE ";
  query += "(Platform=" + req.body.Platform + " AND ";
  query += "RomFile=\"" + req.body.RomFile + "\")";

  console.log(query); 

  db.all(query, function(err, rows) {
    if (err) throw err;
    res.setHeader('Content-Type', 'application/json');
    res.send("{\"updated\":\"true\"}");
  }); /* end db.all() */

}); /* end editSubmitData */

app.post("/editGetData", function(req, res) {
  var query = "";
  var response = "";
  var parsed;

  console.log("Received request for /editGetData: type: " + req.body.platform);

  query = "SELECT * FROM Games WHERE (RomFile='" + req.body.filename
  query += "' AND Platform=" + req.body.platform + ")";
  console.log(query);
  db.all(query, function(err, rows) {
    if (err) throw err;

    rows.forEach(function (row) {
      response = "{\"GameTitle\":\"" + row.GameTitle + "\",";
      response += "\"InfoText0\":\"" + row.InfoText0 + "\",";
      response += "\"InfoText1\":\"" + row.InfoText1 + "\",";
      response += "\"InfoText2\":\"" + row.InfoText2 + "\",";
      response += "\"InfoText3\":\"" + row.InfoText3 + "\",";
      response += "\"InfoText4\":\"" + row.InfoText4 + "\",";
      response += "\"InfoText5\":\"" + row.InfoText5 + "\",";
      response += "\"DateText\":\"" + row.DateText + "\",";
      response += "\"Genre0\":\"" + row.Genre0 + "\",";
      response += "\"Genre1\":\"" + row.Genre1 + "\"}";
    }); /* rows.forEach() */
    
    res.setHeader('Content-Type', 'application/json');
    parsed = JSON.parse(response);
    console.log(JSON.stringify(parsed));
    res.send(JSON.stringify(parsed));
  }); /* db.all() */
}); /* end editGetData */

app.get("/add_remove.html", function(req, res) {
  var buffer = "";

  buffer = fs.readFileSync('static/arHeader.txt', "utf8");
  buffer += fs.readFileSync('static/arTabs.txt', "utf8");
  buffer += fs.readFileSync('static/arBody.txt', "utf8");
  buffer += fs.readFileSync('static/footer.txt', "utf8");
  res.send(buffer);
  console.log('sending add_remove.html');
}); /* end add_remove.html */

app.get("/edit.html", function(req, res) {
  var buffer = fs.readFileSync('static/editHeader.txt', "utf8");

  var romSNES = "";
  var romGBA = "";
  var romNES = "";
  var romGBC = "";

  db.all("SELECT * FROM Games", function(err, rows) {
    if (err) throw err;

    rows.forEach(function (row) {
      if (row.Platform == 1)
        romSNES += "<option value=\"" + row.RomFile + "\">" + row.RomFile + "</option>";
      else if (row.Platform == 2)
        romGBA += "<option value=\"" + row.RomFile + "\">" + row.RomFile + "</option>";
      else if (row.Platform == 3)
        romNES += "<option value=\"" + row.RomFile + "\">" + row.RomFile + "</option>";
      else if (row.Platform == 4)
        romGBC += "<option value=\"" + row.RomFile + "\">" + row.RomFile + "</option>";
        
    }); /* rows.forEach() */
      
    buffer += fs.readFileSync('static/editTabs.txt', "utf8");
    buffer += fs.readFileSync('static/editBodyTop.txt', "utf8");

    buffer += "<div id=\"divFilenameSNES\" style=\"display: none;\"><select id=\"filenameSNES\" width=\"200\" style=\"width: 200px\" size=\"5\" onchange=\"onChangeRomFilename()\">";
    buffer += romSNES;
    buffer += "</select></div>";
    buffer += "<div id=\"divFilenameGBA\" style=\"display: none;\"><select id=\"filenameGBA\" width=\"200\" style=\"width: 200px\" size=\"5\" onchange=\"onChangeRomFilename()\">";
    buffer += romGBA;
    buffer += "</select></div>";
    buffer += "<div id=\"divFilenameNES\" style=\"display: none;\"><select id=\"filenameNES\" width=\"200\" style=\"width: 200px\" size=\"5\" onchange=\"onChangeRomFilename()\">";
    buffer += romNES;
    buffer += "</select></div>";
    buffer += "<div id=\"divFilenameGBC\" style=\"display: none;\"><select id=\"filenameGBC\" width=\"200\" style=\"width: 200px\" size=\"5\" onchange=\"onChangeRomFilename()\">";
    buffer += romGBC;
    buffer += "</select></div>";

    buffer += fs.readFileSync('static/editBody.txt', "utf8");
    buffer += fs.readFileSync('static/footer.txt', "utf8");
    res.send(buffer);
    console.log('sending edit.html');
  }); /* db.all() */
}); /* end edit.html */

app.get("/gamepad.html", function(req, res) {
  var buffer = "";

  buffer = fs.readFileSync('static/gamepadHeader.txt', "utf8");
  buffer += fs.readFileSync('static/gamepadTabs.txt', "utf8");
  buffer += fs.readFileSync('static/gamepadBody.txt', "utf8");
  buffer += fs.readFileSync('static/footer.txt', "utf8");
  res.send(buffer);
  console.log('sending gamepad.html');
}); /* end gamepad.html */

/* serves all the static files */
app.get(/^(.+)$/, function(req, res){ 
  console.log('static file request : ' + req.params[0]);
  res.sendFile( htmlRoot + req.params[0]); 
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});

