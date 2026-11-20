interface Question {
    id: string;
    room: string;
    username: string;
    text: string;
    voters: string[];
}

const questions: Question[] = [];

export function getQuestions(room: string) {
    return questions
        .filter((q) => q.room === room)
        .sort((a, b) => b.voters.length - a.voters.length);
}

export function addQuestion(room: string, userId: string, username: string, text: string) {
    questions.push({
        id: String(Date.now()),
        room,
        username,
        text,
        voters: [userId],
    });
}

export function voteQuestion(questionId: string, userId: string) {
    const q = questions.find((item) => item.id === questionId);
    if (q && !q.voters.includes(userId)) {
        q.voters.push(userId);
    }
}