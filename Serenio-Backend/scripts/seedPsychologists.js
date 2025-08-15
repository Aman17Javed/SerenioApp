// scripts/seedPsychologists.js
const mongoose = require("mongoose");
const Psychologist = require("../models/psychologist");

mongoose.connect("mongodb://localhost:27017/yourdbname", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const psychologists = [
  {
    userId: "psyc1", // Replace with actual User _id
    name: "Dr. Istaqlal Haider",
    specialization: "Cognitive Behavioral Therapy",
    rating: 4.5,
    reviews: 10,
    experience: "8 years",
    availability: "Mon-Fri 9:00-17:00",
  },
  {
    userId: "psyc2", // Replace with actual User _id
    name: "Dr. Asadullah Jajjah",
    specialization: "Anxiety Disorders",
    rating: 4.0,
    reviews: 5,
    experience: "5 years",
    availability: "Tue-Thu 10:00-18:00",
  },
];

async function seed() {
  await Psychologist.insertMany(psychologists);
  console.log("Psychologists seeded");
  mongoose.connection.close();
}

seed().catch(console.error);