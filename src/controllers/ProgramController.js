const ProgramDao = require("../daos/ProgramDao");

class ProgramController {
    async createProgram(req, res) {
        try {
            const {
                studyCenter,
                programName,
                topic,
                frequency,
                studentAttendance,
                committeeInvolvement,
                rewards,
            } = req.body;

            if (
                !studyCenter ||
                !programName ||
                !topic ||
                !frequency ||
                !studentAttendance ||
                !committeeInvolvement
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "studyCenter, programName, topic, frequency, studentAttendance and committeeInvolvement are required",
                });
            }

            const program = await ProgramDao.create({
                studyCenter,
                programName,
                topic,
                frequency,
                studentAttendance,
                committeeInvolvement,
                rewards,
            });

            return res.status(201).json({ success: true, data: program });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async getAllPrograms(req, res) {
        try {
            const { studyCenter, frequency } = req.query;

            const filter = {};
            if (studyCenter) filter.studyCenter = studyCenter;
            if (frequency) filter.frequency = frequency;

            const programs = await ProgramDao.findAll(filter);
            return res.status(200).json({ success: true, data: programs });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async getProgramById(req, res) {
        try {
            const program = await ProgramDao.findById(req.params.id);
            if (!program) {
                return res
                    .status(404)
                    .json({ success: false, message: "Program not found" });
            }
            return res.status(200).json({ success: true, data: program });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async updateProgram(req, res) {
        try {
            const program = await ProgramDao.updateById(req.params.id, req.body);
            if (!program) {
                return res
                    .status(404)
                    .json({ success: false, message: "Program not found" });
            }
            return res.status(200).json({ success: true, data: program });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async deleteProgram(req, res) {
        try {
            const program = await ProgramDao.deleteById(req.params.id);
            if (!program) {
                return res
                    .status(404)
                    .json({ success: false, message: "Program not found" });
            }
            return res
                .status(200)
                .json({ success: true, message: "Program deleted successfully" });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new ProgramController();