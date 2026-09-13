const mongoose = require("mongoose");
const { Schema } = mongoose;

const programSchema = new Schema(
    {
        studyCenter: {
            type: Schema.Types.ObjectId,
            ref: "StudyCenter",
            required: [true, "Study center is required"],
        },
        programName: {
            type: String,
            required: [true, "Program name is required"],
            trim: true,
        },
        topic: {
            type: String,
            required: [true, "Topic is required"],
            trim: true,
        },
        frequency: {
            type: String,
            enum: ["Monthly", "Weekly", "Quarterly"],
            required: [true, "Frequency is required"],
        },
        studentAttendance: {
            type: String,
            enum: {
                values: ["A", "B", "C"],
                message: "Student attendance grade must be A, B, or C",
            },
            required: [true, "Student attendance grade is required"],
        },
        committeeInvolvement: {
            type: String,
            enum: {
                values: ["A", "B", "C"],
                message: "Committee involvement grade must be A, B, or C",
            },
            required: [true, "Committee involvement grade is required"],
        },
        rewards: {
            type: String,
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Program", programSchema);