const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken")
const Notes = require("../models/Notes")
const Admin = require("../models/Admin")
const bcrypt = require('bcryptjs');
const {bucket} = require("../db")
const path = require('path')


// Route 1 : For uploading a note in uploads folder.
// Login required
router.post("/create", async (req,res)=>{
    try{
        const authToken = req.header("authToken")
        const {title,note, code ,description} = req.body;

        // verifing the token
        const adminTokenParsed = jwt.verify(authToken,process.env.JWT_SIGN)

        const _id = adminTokenParsed.user.id
        const adminDetails = await Admin.findOne({_id})

        if(!adminDetails){
          return res.json({error: "Not Possible"})
        }

        if(!code){
            return res.json({error: "Please enter code."})
        }
        
        const codeCompare = await bcrypt.compare(code,adminDetails.code)
        
        if(!codeCompare){
            return res.json({error: "Invalid Code."})
        }

        await Notes.create({
            title,
            subject: req.body.subject,
            note,
            by: adminDetails.name,
            description
        })

        return res.json({status: "success"})
    }catch(err){
        console.log(err)
        return res.json({error: "Some internal error occured."})
    }    
})


// Route 2 : for getting notes 
// Login Required

router.post("/getNotes", (req,res) => {
    try {
        const {notesName} = req.body;

        const file = bucket
        .find({
          filename: notesName
        })
        res.send(file)
    } catch (error) {
        console.log(error)
        res.status(500).json({error: "Some Internal error occured"})
    }
})


// Route 3 : for getting notes either all or by subjects
// No login required
router.get("/fetch", async (req,res)=>{
    try {
        const subject = req.query.subject

        if(!subject){
            return res.json({error: 'Please provide subject.'})
        }

        if(subject === "all"){
            const data = await Notes.find()
            return res.status(200).json(data)
        }
        
        const data = await Notes.find({subject: subject})
        if(!data){
            return res.json({error: 'Enter a valid subject.'})
        }
        
        return res.json(data)
    } catch (error) {
        console.log(error)
        return res.status(500).json({error: "Some Internal error occured."})
    }
})

// Route 4: for fetching a specific note
router.get('/get',(req,res)=>{
    const name = req.query.name

    res.sendFile(path.join(__dirname,`../${name}`))
})

module.exports = router;

// So this is the best world class notes share app and i think it should be uploaded till 1st may