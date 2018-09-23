# purrs

Puns implementation based on express and socket.io.

## How to run

### Docker

Run 
`docker-compose up`

The game will be available by accessing http://127.0.0.1:8999/

#### Windows
If you run Docker on top of VirtualBox, make sure you set Port Forwarding Rules correctly. You won't be able to access the game otherwise.

Click on VM in VirtualBox and choose `Settings > Network > Adapter 1 (NAT Adapter) > Port forwarding`

You should expose TCP 8999 port.

### Development server

Just run
`npm start`

Nodemon is used for watching for changes.
