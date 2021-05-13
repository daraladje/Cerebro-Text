CREATE TABLE users(
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(255),
    knowledge text[],
    looking_for text[],
    current boolean,
    answering VARCHAR(255),
    askerTopic VARCHAR(1000),
    matches: int[]
);

