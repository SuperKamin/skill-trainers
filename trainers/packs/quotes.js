// Quotes for the Typing "quote" test, per language. Only public-domain text: old books, poems and
// speeches, and proverbs. (Monkeytype's lists are mostly modern books and films, so not copied.)
// Dashes and curly quotes are written as plain , and ' so every character is on a normal keyboard.
// Length groups like Monkeytype: short ≤ 100 characters, medium ≤ 300, long ≤ 600, thicc above.

export const QUOTE_GROUPS = ['short', 'medium', 'long', 'thicc'];
export const groupOf = t => (t.length <= 100 ? 'short' : t.length <= 300 ? 'medium' : t.length <= 600 ? 'long' : 'thicc');

export const QUOTES = {
  en: [
    { t: 'Brevity is the soul of wit.', by: 'William Shakespeare, Hamlet' },
    { t: 'All that glisters is not gold.', by: 'William Shakespeare, The Merchant of Venice' },
    { t: 'Well done is better than well said.', by: 'Benjamin Franklin' },
    { t: 'Early to bed and early to rise, makes a man healthy, wealthy, and wise.', by: 'Benjamin Franklin' },
    { t: 'Knowledge is power.', by: 'Francis Bacon' },
    { t: 'A journey of a thousand miles begins with a single step.', by: 'Laozi' },
    { t: 'The only thing we have to fear is fear itself.', by: 'Franklin D. Roosevelt' },
    { t: 'Happy families are all alike; every unhappy family is unhappy in its own way.', by: 'Leo Tolstoy, Anna Karenina' },
    { t: 'Hope is the thing with feathers that perches in the soul.', by: 'Emily Dickinson' },
    { t: 'Fortune favors the bold.', by: 'Latin proverb' },
    { t: 'Practice makes perfect.', by: 'Proverb' },
    { t: 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.', by: 'Jane Austen, Pride and Prejudice' },
    { t: 'Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal.', by: 'Abraham Lincoln, Gettysburg Address' },
    { t: 'We hold these truths to be self-evident, that all men are created equal, that they are endowed by their Creator with certain unalienable Rights, that among these are Life, Liberty and the pursuit of Happiness.', by: 'Declaration of Independence' },
    { t: 'It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of Light, it was the season of Darkness, it was the spring of hope, it was the winter of despair.', by: 'Charles Dickens, A Tale of Two Cities' },
    { t: 'Call me Ishmael. Some years ago, never mind how long precisely, having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world.', by: 'Herman Melville, Moby-Dick' },
    { t: 'The woods are lovely, dark and deep, But I have promises to keep, And miles to go before I sleep, And miles to go before I sleep.', by: 'Robert Frost' },
    { t: "All the world's a stage, And all the men and women merely players; They have their exits and their entrances, And one man in his time plays many parts, His acts being seven ages.", by: 'William Shakespeare, As You Like It' },
    { t: 'I went to the woods because I wished to live deliberately, to front only the essential facts of life, and see if I could not learn what it had to teach, and not, when I came to die, discover that I had not lived.', by: 'Henry David Thoreau, Walden' },
    { t: "You don't know about me without you have read a book by the name of The Adventures of Tom Sawyer; but that ain't no matter. That book was made by Mr. Mark Twain, and he told the truth, mainly. There was things which he stretched, but mainly he told the truth.", by: 'Mark Twain, Adventures of Huckleberry Finn' },
    { t: "Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, 'and what is the use of a book,' thought Alice 'without pictures or conversations?'", by: "Lewis Carroll, Alice's Adventures in Wonderland" },
    { t: 'But, in a larger sense, we can not dedicate, we can not consecrate, we can not hallow this ground. The brave men, living and dead, who struggled here, have consecrated it, far above our poor power to add or detract. The world will little note, nor long remember what we say here, but it can never forget what they did here.', by: 'Abraham Lincoln, Gettysburg Address' },
    { t: "To be, or not to be, that is the question: Whether 'tis nobler in the mind to suffer The slings and arrows of outrageous fortune, Or to take arms against a sea of troubles And by opposing end them. To die, to sleep, No more; and by a sleep to say we end The heart-ache and the thousand natural shocks That flesh is heir to: 'tis a consummation Devoutly to be wish'd.", by: 'William Shakespeare, Hamlet' },
    { t: 'It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of Light, it was the season of Darkness, it was the spring of hope, it was the winter of despair, we had everything before us, we had nothing before us, we were all going direct to Heaven, we were all going direct the other way, in short, the period was so far like the present period, that some of its noisiest authorities insisted on its being received, for good or for evil, in the superlative degree of comparison only.', by: 'Charles Dickens, A Tale of Two Cities' },
    { t: 'Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal. Now we are engaged in a great civil war, testing whether that nation, or any nation so conceived and so dedicated, can long endure. We are met on a great battle-field of that war. We have come to dedicate a portion of that field, as a final resting place for those who here gave their lives that that nation might live. It is altogether fitting and proper that we should do this. But, in a larger sense, we can not dedicate, we can not consecrate, we can not hallow this ground. The brave men, living and dead, who struggled here, have consecrated it, far above our poor power to add or detract. The world will little note, nor long remember what we say here, but it can never forget what they did here. It is for us the living, rather, to be dedicated here to the unfinished work which they who fought here have thus far so nobly advanced. It is rather for us to be here dedicated to the great task remaining before us, that from these honored dead we take increased devotion to that cause for which they gave the last full measure of devotion, that we here highly resolve that these dead shall not have died in vain, that this nation, under God, shall have a new birth of freedom, and that government of the people, by the people, for the people, shall not perish from the earth.', by: 'Abraham Lincoln, Gettysburg Address' },
  ],
  pt: [
    { t: 'Tudo vale a pena se a alma não é pequena.', by: 'Fernando Pessoa, Mensagem' },
    { t: 'Navegar é preciso; viver não é preciso.', by: 'Fernando Pessoa' },
    { t: 'Quem espera sempre alcança.', by: 'Provérbio' },
    { t: 'Água mole em pedra dura, tanto bate até que fura.', by: 'Provérbio' },
    { t: 'De grão em grão, a galinha enche o papo.', by: 'Provérbio' },
    { t: 'Devagar se vai ao longe.', by: 'Provérbio' },
    { t: 'A pressa é inimiga da perfeição.', by: 'Provérbio' },
    { t: 'Minha terra tem palmeiras, onde canta o sabiá.', by: 'Gonçalves Dias, Canção do Exílio' },
    { t: 'O poeta é um fingidor. Finge tão completamente que chega a fingir que é dor a dor que deveras sente.', by: 'Fernando Pessoa, Autopsicografia' },
    { t: 'Ao verme que primeiro roeu as frias carnes do meu cadáver dedico como saudosa lembrança estas memórias póstumas.', by: 'Machado de Assis, Memórias Póstumas de Brás Cubas' },
    { t: 'Minha terra tem palmeiras, onde canta o sabiá; as aves, que aqui gorjeiam, não gorjeiam como lá. Nosso céu tem mais estrelas, nossas várzeas têm mais flores, nossos bosques têm mais vida, nossa vida mais amores.', by: 'Gonçalves Dias, Canção do Exílio' },
    { t: 'Ó mar salgado, quanto do teu sal são lágrimas de Portugal! Por te cruzarmos, quantas mães choraram, quantos filhos em vão rezaram! Quantas noivas ficaram por casar para que fosses nosso, ó mar! Valeu a pena? Tudo vale a pena se a alma não é pequena. Quem quer passar além do Bojador tem que passar além da dor. Deus ao mar o perigo e o abismo deu, mas nele é que espelhou o céu.', by: 'Fernando Pessoa, Mar Português' },
    { t: 'Amor é fogo que arde sem se ver, é ferida que dói, e não se sente; é um contentamento descontente, é dor que desatina sem doer. É um não querer mais que bem querer; é um andar solitário entre a gente; é nunca contentar-se de contente; é um cuidar que ganha em se perder. É querer estar preso por vontade; é servir a quem vence, o vencedor; é ter com quem nos mata, lealdade. Mas como causar pode seu favor nos corações humanos amizade, se tão contrário a si é o mesmo Amor?', by: 'Luís de Camões' },
    { t: "Minha terra tem palmeiras, onde canta o sabiá; as aves, que aqui gorjeiam, não gorjeiam como lá. Nosso céu tem mais estrelas, nossas várzeas têm mais flores, nossos bosques têm mais vida, nossa vida mais amores. Em cismar, sozinho, à noite, mais prazer encontro eu lá; minha terra tem palmeiras, onde canta o sabiá. Minha terra tem primores, que tais não encontro eu cá; em cismar, sozinho, à noite, mais prazer encontro eu lá; minha terra tem palmeiras, onde canta o sabiá. Não permita Deus que eu morra, sem que eu volte para lá; sem que desfrute os primores que não encontro por cá; sem qu'inda aviste as palmeiras, onde canta o sabiá.", by: 'Gonçalves Dias, Canção do Exílio' },
  ],
};
