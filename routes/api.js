"use strict";

var _ = require('underscore');
var express = require('express');
var restify = require('express-restify-mongoose');
var router = express.Router();
var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var db = mongoose.connect("mongodb://localhost:27017/lifereview");

//
var LifeEvent = new Schema({
    id: ObjectId,
    patient_id: ObjectId,
    content: String,
    startDate: Date,
    endDate: Date,
    tags: Array,
    comment: String
});

//
var Patient = new Schema({
    id: ObjectId,
    name: String,
    birthDate: Date,
    deathDate: Date
});

//
var User = new Schema({
    id: ObjectId,
    name: String
});

var PatientModel;
var LifeEventModel;
var UserModel;

PatientModel = mongoose.model("Patient", Patient);
LifeEventModel = mongoose.model("LifeEvent", LifeEvent);
UserModel = mongoose.model("User", User);

// seed
(function () {
    var patient = new PatientModel({
        "name": "八幡",
        "birthDate": new Date(1992, 9, 31),
        "deathDate": new Date(2080, 2, 21)
    });

    patient.save(function (err, doc) {
        var patientId = doc._id;

        console.log("patient_id: " + patientId);

        //for (var i = 0; i < 10; i++) {
        //    var startDate = new Date(
        //        ~~(Math.random() * 80) + 1992,
        //        ~~(Math.random() * 12),
        //        ~~(Math.random() * 28)
        //    );
        //    var lifeEvent = new LifeEventModel({
        //        patient_id: patientId,
        //        content: "相馬野馬追祭りに参加した。",
        //        startDate: startDate,
        //        endDate: startDate + 1000 * 60 * 60 * 24 * 30,
        //        tags: _.sample(["自分", "身近なひと", "仕事", "コミュニティ"], 1),
        //        comment: "comment!"
        //    });

        //    lifeEvent.save();
        //}
    });
})();

db.connection.once("connected", function () {
    console.log("connected");
});

restify.serve(router, PatientModel);
restify.serve(router, LifeEventModel);
restify.serve(router, UserModel);

module.exports = router;
