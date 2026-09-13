const Program = require("../models/Program");

class ProgramDao {
    async create(data) {
        return Program.create(data);
    }

    async findAll(filter = {}) {
        return Program.find(filter)
            .populate("studyCenter", "name")
            .sort({ createdAt: -1 });
    }

    async findById(id) {
        return Program.findById(id).populate("studyCenter", "name");
    }

    async findByStudyCenter(studyCenterId) {
        return Program.find({ studyCenter: studyCenterId }).populate(
            "studyCenter",
            "name"
        );
    }

    async updateById(id, data) {
        return Program.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true,
        });
    }

    async deleteById(id) {
        return Program.findByIdAndDelete(id);
    }
}

module.exports = new ProgramDao();