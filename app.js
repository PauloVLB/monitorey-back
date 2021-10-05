const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server, 
    {
        cors: {
            origin: "https://localhost:3000",
            methods: ["GET", "POST"]
        }
    }
);

const alunos = [];

io.on('connection', (socket) => {
    socket.emit('listar', { alunos });

    socket.on('new-user', data => {
        const newAluno = {
            id: socket.id,
            nome: data.nome,
            questoes: []
        };

        alunos.push(newAluno);

        io.emit('listar', { alunos });
    });

    socket.on('delete', data => {
        alunos.splice(data.index, 1);
        io.emit('listar', { alunos });
    });
});

server.listen(8000);
