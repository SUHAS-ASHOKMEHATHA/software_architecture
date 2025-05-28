const express = require("express");
const Professor = require("../models/professor"); 
const router = express.Router();

// POST a new professor
router.post("/", async (req, res) => {
    const { name, email, phone, password } = req.body;

    // Basic validation
    if (!name || !email || !phone || !password) {
        return res.status(400).json({ message: "Please provide name, email, phone, and password" });
    }

    try {
        // Check if professor already exists
        const existingProfessor = await Professor.findOne({ email });
        if (existingProfessor) {
            return res.status(400).json({ message: "Professor with this email already exists" });
        }

        // Create a new professor
        const newProfessor = new Professor({
            name,
            email,
            phone,
            password,
        });

      
        const savedProfessor = await newProfessor.save();

        
        const professorResponse = savedProfessor.toObject();
        delete professorResponse.password; 
        
        res.status(201).json(professorResponse);

    } catch (error) {
        console.error("Error creating professor:", error);
        res.status(500).json({ message: "Server error while creating professor" });
    }
});

// GET all professors
router.get("/", async (req, res) => {
    try {
      
        const professors = await Professor.find(); 
        res.status(200).json(professors);
    } catch (error) {
        console.error("Error fetching professors:", error);
        res.status(500).json({ message: "Server error while fetching professors" });
    }
});


router.get("/:id", async (req, res) => {
    try {
        
        const professor = await Professor.findById(req.params.id).select('-password'); 
        if (!professor) {
            return res.status(404).json({ message: "Professor not found" });
        }
        res.status(200).json(professor);
    } catch (error) {
        console.error("Error fetching professor by ID:", error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: "Invalid professor ID format" });
        }
        res.status(500).json({ message: "Server error while fetching professor" });
    }
});



module.exports = router;
