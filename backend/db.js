import pg from "pg";
const { Pool } = pg;

export const pool = new Pool({
    host: 'localhost',
    user: 'postgres',
    password: '9513124Jae$$',
    database: 'course_planning_website'
});