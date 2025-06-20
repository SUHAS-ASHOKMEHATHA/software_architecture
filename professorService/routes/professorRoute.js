const express = require("express");
const Professor = require("../models/professor");
const { verifyRole, restrictProfessorToOwnData } = require("./auth/util");
const { ROLES } = require("../../consts");
const router = express.Router();

// POST a new professor
// Protected: Only an ADMIN can create a new professor
router.post(
    "/",
    verifyRole([ROLES.ADMIN]),
    async (req, res) => {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
        return res.status(400).json({ message: "Please provide name, email, phone, and password." });
    }

    try {
        const existingProfessor = await Professor.findOne({ email });
        if (existingProfessor) {
            return res.status(400).json({ message: "Professor with this email already exists." });
        }
        const newProfessor = new Professor({ name, email, phone, password });
        const savedProfessor = await newProfessor.save();

        const professorResponse = savedProfessor.toObject();
        delete professorResponse.password;

        res.status(201).json(professorResponse);
    } catch (error) {
        console.error("Error creating professor:", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: "Server error while creating professor." });
    }
});

// GET all professors with password for auth purposes
// Protected: Only AUTH_SERVICE can access this.
router.get("/internal/all", verifyRole([ROLES.AUTH_SERVICE]), async (req, res) => {
    try {
        const professors = await Professor.find(); // Note: No .select('-password')
        res.status(200).json(professors);
    } catch (error) {
        console.error("Error fetching all professors for auth:", error);
        res.status(500).json({ message: "Server error while fetching professors for auth." });
    }
});

// GET all professors
// Protected: Only ADMINs can get all professors.
router.get(
    "/",
    verifyRole([ROLES.ADMIN, ROLES.PROFESSOR]),
    async (req, res) => {
    try {
        const professors = await Professor.find().select('-password');
        res.status(200).json(professors);
    } catch (error) {
        console.error("Error fetching all professors:", error);
        res.status(500).json({ message: "Server error while fetching professors." });
    }
});

// GET a single professor by ID
// Protected: ADMIN can get any professor, a PROFESSOR can only get their own data.
router.get(
    "/:id",
    verifyRole([ROLES.ADMIN, ROLES.PROFESSOR]),
    restrictProfessorToOwnData,
    async (req, res) => {
    try {
        const professor = await Professor.findById(req.params.id).select('-password');
        if (!professor) {
            return res.status(404).json({ message: "Professor not found." });
        }
        res.status(200).json(professor);
    } catch (error) {
        console.error(`Error fetching professor by ID ${req.params.id}:`, error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: "Invalid professor ID format." });
        }
        res.status(500).json({ message: "Server error while fetching professor." });
    }
});

// PUT update a professor by ID
// Protected: ADMIN can update any professor, a PROFESSOR can only update their own data.
router.put(
    "/:id",
    verifyRole([ROLES.ADMIN, ROLES.PROFESSOR]),
    restrictProfessorToOwnData,
    async (req, res) => {
        const { name, email, phone } = req.body;
        const updateData = {};

        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (phone) updateData.phone = phone;

        if (req.body.password) {
            return res.status(400).json({ message: "Password updates are not allowed through this route." });
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: "No valid update data provided." });
        }

        try {
            if (email) {
                const existingProfessorWithEmail = await Professor.findOne({ email: email, _id: { $ne: req.params.id } });
                if (existingProfessorWithEmail) {
                    return res.status(400).json({ message: "The provided email is already in use by another professor." });
                }
            }

            const updatedProfessor = await Professor.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true }).select('-password');
            if (!updatedProfessor) {
                return res.status(404).json({ message: "Professor not found for update." });
            }
            res.status(200).json(updatedProfessor);
        } catch (error) {
            console.error(`Error updating professor ${req.params.id}:`, error);
            if (error.kind === 'ObjectId') {
                return res.status(400).json({ message: "Invalid professor ID format." });
            }
            if (error.name === 'ValidationError') {
                return res.status(400).json({ message: error.message });
            }
            res.status(500).json({ message: "Server error while updating professor." });
        }
    }
);

// DELETE a professor by ID
// Protected: User must be an ADMIN or the PROFESSOR themselves.
router.delete(
    "/:id",
    verifyRole([ROLES.ADMIN, ROLES.PROFESSOR]),
    restrictProfessorToOwnData,
    async (req, res) => {
    try {
        const deletedProfessor = await Professor.findByIdAndDelete(req.params.id);

        if (!deletedProfessor) {
            return res.status(404).json({ message: "Professor not found for deletion." });
        }

        const professorResponse = deletedProfessor.toObject();
        delete professorResponse.password;

        res.status(200).json({ message: "Professor deleted successfully.", deletedProfessor: professorResponse });
    } catch (error) {
        console.error(`Error deleting professor ${req.params.id}:`, error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: "Invalid professor ID format." });
        }
        res.status(500).json({ message: "Server error while deleting professor." });
    }
});

module.exports = router;