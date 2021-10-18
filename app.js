const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server, 
    {
        cors: {
            origin: process.env.FRONT_URL,
            methods: ["GET", "POST"]
        }
    }
);

const alunos = [];
const questoes = [];

function questoesIguais(questaoA, questaoB) {
    return (questaoA.capitulo === questaoB.capitulo &&
            questaoA.numero === questaoB.numero &&
            questaoA.tipo === questaoB.tipo);
}

io.on('connection', (socket) => {
    socket.emit('listar-alunos', { alunos });
    socket.emit('listar-questoes', { questoes });

    socket.on('sair-duvida', data => {
        const questaoExiste = questoes.filter(questao => questao.alunos.includes(data.nomeAluno))[0];
        const indexQuestaoExiste = questoes.indexOf(questaoExiste);

        if(questaoExiste) {
            const indexAluno = questaoExiste.alunos.indexOf(data.nomeAluno); 
            questaoExiste.alunos.splice(indexAluno, 1);

            if(questaoExiste.alunos.length) {
                questoes[indexQuestaoExiste] = questaoExiste;
            } else {
                questoes.splice(indexQuestaoExiste, 1);
            }

            io.emit('listar-questoes', { questoes });
        }
    });

    socket.on('new-doubt', data => {
        const novaQuestao = {
            tipo: data.tipo,
            capitulo: data.capitulo,
            numero: data.numero,
            alunos: []
        };

        const questaoExiste = questoes.filter(questao => questoesIguais(questao, novaQuestao));
        
        if(questaoExiste.length) {
            questoes.forEach(questao => {
                if(questoesIguais(questao, novaQuestao)) {
                    if(!questao.alunos.includes(data.nome)) {
                        questao.alunos.push(data.nome);
                    }
                }
            });
        } else {
            novaQuestao.alunos.push(data.nome);
            questoes.push(novaQuestao);
        }

        alunos.forEach(aluno => {
            if(aluno.id === data.id) {
                aluno.questoes.push(novaQuestao);
            }
        });

        io.emit('listar-questoes', { questoes });
    });

    socket.on('new-user', data => {
        const newAluno = {
            id: socket.id,
            nome: data.nome,
            questoes: []
        };
        
        const alunoExiste = alunos.filter(aluno => aluno.nome == newAluno.nome);
        if(!alunoExiste.length) alunos.push(newAluno);

        io.emit('listar-alunos', { alunos });
        socket.emit('listar-questoes', { questoes });
    });

    socket.on('delete', data => {
        alunos.splice(data.index, 1);
        io.emit('listar-alunos', { alunos });
    });
});

server.listen(process.env.PORT);
