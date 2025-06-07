const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.port || 3000;



let players = new Set();

//#region  PLAYER
class Player {
    constructor(id, position, rotation ,socket) 
    {
        this.id = id;
        this.position = position;
        this.rotation = rotation;
        this.socket = socket;
        this.shop = null
    }

    updatePosition(newPosition) { this.position = newPosition;}

    updateRotation(newRotation) {this.rotation = newRotation;}

    getSocket(){ return this.socket}

    getID() {return this.id}

    toJSON() 
    {
        return {
            id: this.id,
            position: this.position,
            rotation: this.rotation,
            shop : this.shop
        };
    }
}

//#endregion

//#region  Shop
class Shop
{
    constructor(id,position)
    {
        this.id = id;
        this.position = position
    }

     toJSON() 
    {
        return {
            id: this.id,
            position: this.position
        };
    }
}
//#endregion

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // New player joins
    socket.on("newPlayer", (id,position,rotation) => 
    {
          const newPlayer = new Player(id,position,rotation,socket)
          players.add(newPlayer)

          const playerJson = newPlayer.toJSON();
          console.log(`Player Json ${playerJson}`);

            players.forEach(player => 
            {
                if(player.getID() != id)
                player.getSocket().emit("AddPlayer",playerJson)                 
            })
    });

    // Player movement
    socket.on("move",( id,position,rotation) => 
    {
            players.forEach(player => 
            {
                if(player.getID()== id)
                {
                   player.updatePosition(position)
                   player.updateRotation(rotation)

                   const playerJson = player.toJSON();
                   console.log(`Player Json ${playerJson}`);

                    if(player.getID() != id)
                      player.getSocket().emit("UpdateMove",playerJson)                 
                   
                }
            })
    });

    // Disconnect
    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);

         let deletePlayer = null
        
         players.forEach(player => 
         {
             if(player.getSocket()== socket)
             {
                deletePlayer = player
                players.delete(player)
             }
         })

         console.log(`Player deleted ${deletePlayer.getID()}`);

         players.forEach(player => 
         {
             player.getSocket().emit("playerExit",deletePlayer.getID())
         })
    });
});

app.get("/", (req, res) => {
  res.send("Socket.IO server is running 🚀");
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
