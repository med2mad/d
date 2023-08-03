require('dotenv').config();
const port = process.env.mysqlPORT;
// Import required packages
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const multer = require('multer');
let randomImgName;
const strg = multer.diskStorage({ destination: function(req,file,callback){fs.mkdirSync('./uploads', {recursive:true}); callback(null,'./uploads');}, 
                                  filename: function(req,file,callback){randomImgName =file.originalname+Date.now()+file.originalname; callback(null,randomImgName);}
                                });
const uploads = multer({storage:strg, fileFilter:function(req, file, cb){fileCheck(file, cb)}});
function fileCheck(file, cb) {
  if(file.mimetype.split("/")[0]!=="image")
    {cb("Error: Only Images!");}
  else {return cb(null, true);}
}

// Create an Express application
const app = express();
app.use(cors());
app.use(express.json()); //req.body gets data from ajax requests payload
app.use(express.urlencoded({extended:true})); //req.body gets <form> values

// Connect to Mysql2
const mysql = require('mysql2');
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "sqlDB"
});
con.connect((err) => {
  if (err){console.log("'Mysyql' initial connection error");}
  else{app.listen(port, ()=>{console.log("'Mysyql' Port: " + port);});}
});

//API Routes (API endpoints)
//Get All
app.get('/', (req, res) => {
  let q ="SELECT * FROM users WHERE name LIKE '%"+ req.query._name +"%'";
  if (req.query._age) {q += " AND age = '"+ req.query._age +"'";}
  q += " ORDER BY id DESC LIMIT "+ req.query._limit;
  con.query(q, (err, rows)=>{
    res.json(rows)
  })
});
//Insert
app.post('/', (req, res) => {
  con.query("INSERT INTO users (name, age, photo) VALUES ('"+ req.body.name +"', '"+ req.body.age +"', '"+ randomImgName +"')", (err, data)=>{
    randomImgName='';
    res.json(data)
  })
});
app.post('/upload', uploads.single("photo"), (req, res) => {
  res.json({newPhotoName:randomImgName})//optional (just to receive the new file name)
});
//Update
app.put('/:id', (req, res) => {
    con.query("UPDATE users SET name = '"+ req.body.name +"', age = '"+ req.body.age +"' WHERE id='"+ req.params.id +"'", (err, data)=>{
      res.json(data)
  })
});
//Delete
app.delete('/:id', (req, res) => {
    con.query("DELETE FROM users WHERE id='"+ req.params.id +"'", (err, data)=>{
      res.json(data);
  });
});
//404
app.use((req, res) => {
  res.status(404).json("404 , no routes !")
});
