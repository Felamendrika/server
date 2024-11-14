// tester la creation de schema
const mongoose = require("mongoose");

const User = require("./models/user.model");
const Group = require("./models/group.model");
const Message = require("./models/message.model");
const Event = require("./models/event.model");
const Conversation = require("./models/conversation.model");
const Membre = require("./models/membre.model");
const Role = require("./models/role.model");
const Participant = require("./models/participant.model");

// connexion a MONGODB
mongoose
  .connect("mongodb://localhost:27017/chat-app")
  .then(async () => {
    console.log("Connection a MONGODB reussie");

    //tester la creation d'utilisateur
    const user3 = new User({
      nom: "User3",
      prenom: "test3",
      pseudo: "test3",
      email: "L5jyP@example.com",
      mdp: "test5",
      avatar: "avatar20",
      date_inscription: Date.now(),
    });
    const user4 = new User({
      nom: "User4",
      prenom: "test4",
      pseudo: "test4",
      email: "R1jyP@example.com",
      mdp: "test^",
      avatar: "avatar109",
      date_inscription: Date.now(),
    });

    await user3.save();
    await user4.save();

    console.log("User creer avec succes:", user3, user4);

    // Creation de Groupe
    const group = new Group({
      nom: "Groupe Discussion",
      description: "Groupe de discuss",
      date_creation: Date.now(),
      createur_id: user4._id,
    });

    await group.save();
    console.log("Groupe creer :", group);

    // Creation de Role
    const role = new Role({
      type: "membre",
    });

    await role.save();
    console.log("Role creer :", role);

    //creation de Membre
    const membre = new Membre({
      date_join: Date.now(),
      user_id: user3._id,
      group_id: group._id,
      role_id: role._id,
    });

    await membre.save();
    console.log(`Membre creer ${membre} avec le role ${role}`);

    // Creation de COnversation et message
    const conversation = new Conversation({
      type: "private",
      receiver_id: user3._id,
      sender_id: user4._id,
    });

    await conversation.save();

    const message = new Message({
      content: "Bonjour amigos",
      status: "envoye",
      date_envoi: Date.now(),
      user_id: user4._id,
      conversation_id: conversation._id,
    });

    await message.save();
    console.log(
      `Message creer : ${message} , dans la conversation : ${conversation}`
    );

    // Creation d'event
    const event = new Event({
      titre: "DEv",
      description: "Development",
      date_debut: Date.now(),
      date_fin: Date.now(),
      createur_id: user4._id,
    });

    await event.save();
    console.log("Evenement creer :", event);

    // Creation Participant
    const participant = new Participant({
      user_id: user3._id,
      event_id: event._id,
    });

    await participant.save();
    console.log(`Participant creer : ${participant} pour l'event ${event}`);
  })
  .catch((error) => {
    console.log("Erreur: ", error);
  });
