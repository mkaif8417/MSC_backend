// const mongoose = require('mongoose');

// const districtSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: [true, 'District name is required'],
//       trim: true
//     },
//     code: {
//       type: String,
//       required: [true, 'District code is required'],
//       uppercase: true,
//       trim: true
//     },
//     stateId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'State',
//       required: [true, 'State ID is required'],
//       index: true
//     },
//     isActive: {
//       type: Boolean,
//       default: true,
//       index: true
//     }
//   },
//   {
//     timestamps: true,
//     toJSON: {
//       transform(doc, ret) {
//         delete ret.__v;
//         return ret;
//       }
//     }
//   }
// );

// // Compound unique index ensuring district name uniqueness per State
// districtSchema.index({ stateId: 1, name: 1 }, { unique: true });

// const District = mongoose.model('District', districtSchema);

// module.exports = District;



// Your ACTUAL District.js, with divisionId added. Diff is just the
// divisionId block inserted between stateId and isActive — everything
// else is untouched, copy this whole thing over your current file.

const mongoose = require('mongoose');

const districtSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'District name is required'],
      trim: true
    },
    code: {
      type: String,
      required: [true, 'District code is required'],
      uppercase: true,
      trim: true
    },
    stateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'State',
      required: [true, 'State ID is required'],
      index: true
    },
    divisionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Division',
      default: null,
      index: true
      // Kept optional (no `required`) so your 31 existing District docs,
      // created before Division existed, don't fail validation. Once
      // seedKarnatakaDivisions.js has run and every district has a
      // divisionId, you can add required: [true, 'Division ID is required']
      // here if you want to enforce it going forward.
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Compound unique index ensuring district name uniqueness per State
districtSchema.index({ stateId: 1, name: 1 }, { unique: true });

const District = mongoose.model('District', districtSchema);

module.exports = District;
