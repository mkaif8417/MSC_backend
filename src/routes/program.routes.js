const express = require("express");
const router = express.Router();
const ProgramController = require("../controllers/ProgramController");
// const { authenticate } = require("../middlewares/auth"); // uncomment if your other routes use this

router.post("/", ProgramController.createProgram);
router.get("/", ProgramController.getAllPrograms);
router.get("/:id", ProgramController.getProgramById);
router.put("/:id", ProgramController.updateProgram);
router.delete("/:id", ProgramController.deleteProgram);

module.exports = router;