import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { addQuestion, getQuestions, voteQuestion } from '../src/questions';

describe('src/questions.ts', () => {
    it('isola dúvidas por sala entre aula-01 e aula-02', () => {
        // Arrange
        const room1 = 'aula-01';
        const room2 = 'aula-02';

        // Act
        addQuestion(room1, 'user-1', 'Ana', 'Dúvida da aula 01');
        addQuestion(room2, 'user-2', 'Bruno', 'Dúvida da aula 02');

        const questionsRoom1 = getQuestions(room1);
        const questionsRoom2 = getQuestions(room2);

        // Assert
        assert.equal(questionsRoom1.length, 1);
        assert.equal(questionsRoom1[0].text, 'Dúvida da aula 01');
        assert.equal(questionsRoom1[0].room, room1);

        assert.equal(questionsRoom2.length, 1);
        assert.equal(questionsRoom2[0].text, 'Dúvida da aula 02');
        assert.equal(questionsRoom2[0].room, room2);
    });

    it('impede que o mesmo userId vote duas vezes na mesma dúvida', () => {
        // Arrange
        const room = 'aula-voto-unico';
        addQuestion(room, 'user-1', 'Ana', 'Posso votar duas vezes?');
        const [question] = getQuestions(room);

        // Act
        voteQuestion(question.id, 'user-1'); // autor tentando votar novamente
        voteQuestion(question.id, 'user-2');
        voteQuestion(question.id, 'user-2'); // mesmo usuário votando duas vezes

        const [updated] = getQuestions(room);

        // Assert
        assert.equal(updated.voters.length, 2);
        assert.deepEqual(updated.voters, ['user-1', 'user-2']);
    });

    it('ordena dúvidas da mais votada para a menos votada', () => {
        // Arrange
        const room = 'aula-ordenacao';
        addQuestion(room, 'u1', 'Ana', 'Dúvida A');
        addQuestion(room, 'u2', 'Bruno', 'Dúvida B');
        addQuestion(room, 'u3', 'Carla', 'Dúvida C');

        const initial = getQuestions(room);
        const questionA = initial.find((q) => q.text === 'Dúvida A')!;
        const questionC = initial.find((q) => q.text === 'Dúvida C')!;

        // Act
        // Dúvida C -> 3 votos, Dúvida A -> 2 votos, Dúvida B -> 1 voto
        voteQuestion(questionC.id, 'u4');
        voteQuestion(questionC.id, 'u5');
        voteQuestion(questionA.id, 'u4');

        const ordered = getQuestions(room);

        // Assert
        assert.deepEqual(
            ordered.map((q) => ({ text: q.text, votes: q.voters.length })),
            [
                { text: 'Dúvida C', votes: 3 },
                { text: 'Dúvida A', votes: 2 },
                { text: 'Dúvida B', votes: 1 },
            ]
        );
    });
});
