import express from 'express';
import puppeteer from 'puppeteer';
import cors from 'cors';
import {pool} from "./db.js";
const app = express();

app.use(cors());
app.get('/api/courses', async (req, res) => {
    try {
        console.log(pool.options.database)
        const {subjectName, semesterName, universityName} = req.query;

        // search from database
        const existingCourses = await pool.query(
            'SELECT sec.*, c.title, c.credits, c.subject FROM section sec JOIN course c ON sec.course_id = c.course_id JOIN semester sem ON c.sem_id = sem.sem_id WHERE c.subject ILIKE $1 AND sem.sem_id = $2',
            [`${subjectName}%`, semesterName] // ANYTHING starting with the subject
        );

        // if it exists, (length > 0) then send to frontend
        if (existingCourses.rows.length > 0) {
            // if it exists
            console.log("Fetching from Database");
            return res.json(existingCourses.rows);
        }

        // else, call post query to post the data to the database

        console.log("Database empty for this search");
        return res.json([]);
    }
    catch (error) {
        console.log(error);
    }
});

app.post('/api/courses', async (req, res) => {
    try {
        console.log(pool.options.database)
        const {subjectName, semesterName, universityName} = req.query;

        const univResult = await pool.query(
                `INSERT INTO university (name) 
                 VALUES ($1) 
                 ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name 
                 RETURNING univ_id`,
                [universityName]
            );
        const universityId = univResult.rows[0].univ_id;

        const semResult = await pool.query(
                `INSERT INTO semester (sem_id, univ_id) 
                 VALUES ($1, $2) 
                 ON CONFLICT (sem_id) DO UPDATE SET univ_id = EXCLUDED.univ_id 
                 RETURNING sem_id`,
                [semesterName, universityId]
            );

        const semesterId = semResult.rows[0].sem_id;

        console.log(`Proceeding with University: ${universityId}, Semester: ${semesterId}`);

        // call puppeteer
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();
        await page.goto('https://coursesearch.georgiasouthern.edu/');

        // find the specific forms

        let semester = semesterName;

        await page.waitForSelector('#form-search-semester');
        await page.select('#form-search-semester', semester);

        // select subject

        let subject = 'CSCI';

        if (subjectName.length > 4 || subjectName !== 'CSCI') {
            subject = subjectName.substring(0, 4).toUpperCase();
        }

        await page.waitForSelector('#form-search-subject');
        await page.select('#form-search-subject', subject);

        // select campuses
        await page.click('label[for=form-search-campus-10]'); // Statesboro
        await page.click('label[for=form-search-campus-20]'); // Armstrong
        await page.click('label[for=form-search-campus-40]'); // Online

        await page.click('#form-search-btn-submit');

        // wait for table, select length to all
        await page.waitForSelector('select[name="results-table_length"]');
        await page.select('select[name="results-table_length"]', '-1'); // select -1 to show all courses on one page

        // WAIT to reload
        await page.waitForFunction(() => {
            const rows = document.querySelectorAll('#results-table tbody tr');
            return rows.length > 1 && !rows[0].innerText.includes('Loading');
        }, { timeout: 10000 });

        const courseData = await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('#results-table tbody tr'));

            return rows.map(row => {
                const cells = row.querySelectorAll('td');

                const splitDayTime = (text) => {
                    if (!text) {
                        return '';
                    }
                    const lines = text.split('\n');

                    // filter out UMTWRFS
                    const data = lines.filter(line => {
                        const trimmedLine = line.trim();
                        return trimmedLine.length > 0 && !trimmedLine.includes('\t') && !trimmedLine.startsWith('U');
                    })

                    return data.join(' | ');
                }

                const hiddenCells = Array.from(row.querySelectorAll('td[hidden]'));
                const campusCell = hiddenCells.find(c => c.innerText.includes('Course'));

                return {
                    crn: cells[0]?.innerText.trim(),
                    subject: cells[1]?.innerText.trim(),
                    title: cells[2]?.innerText.trim(),
                    credits: cells[3]?.innerText.trim(),
                    instructor: cells[4]?.innerText.trim(),
                    days: splitDayTime(cells[8]?.innerText),
                    time: splitDayTime(cells[9]?.innerText),

                    campus: campusCell ? campusCell.innerText.trim() : 'Statesboro Course'
                };
            }).filter(course =>
                course !== null &&
                course.crn &&
                course.crn.length === 5 &&
                !isNaN(course.crn)
            ); // remove empty rows (but there may not be any)
        });

        console.log(`Scraped ${courseData.length} courses!`);
        console.log(`Syncing Database for ${courseData.length} courses`);

        for (const course of courseData) {
            try {
                // insert course intro databse
                console.log("Inserting course into database");
                const courseResult = await pool.query(
                    `INSERT INTO course (sem_id, title, credits, school_id, subject) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (sem_id, course_id) DO UPDATE SET title=EXCLUDED.title RETURNING course_id`,
                    [semesterId, course.title, course.credits, universityId, course.subject]
                );

                const courseId = courseResult.rows[0].course_id;

                // insert section using courseID
                console.log("Inserting section into database");
                await pool.query(
                    'INSERT INTO section (crn, instructor, time, day, campus, course_id ) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (crn) DO NOTHING',
                    [course.crn, course.instructor, course.time, course.days, course.campus, courseId]
                )


            } catch (error) {
                console.log(`Error saving course ${course}`, error.message);
            }
        }

        await browser.close();
        return res.json(courseData);

    } catch (err) {
        res.status(500).send("Scraping error");
        console.log(err.message);
    }

})

app.post('/api/schedule', async (req, res) => {
    const crn = parseInt(req.query.crn);
    const semesterName = req.query.semesterName;
    let scheduleNumber = 0;

    try {
        if (semesterName === "202601"){
            scheduleNumber = 1;
        }

        if (semesterName === "202605"){
            scheduleNumber = 2;
        }

        if (semesterName === "202608"){
            scheduleNumber = 3;
        }

        const result = await pool.query(
            'INSERT INTO schedule (schedule_id, crn) VALUES ($1, $2)', [scheduleNumber, crn]
        )

        res.status(201).json(result.rows[0]);

    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: `This course is already on your schedule` });
        }

        res.status(500).json({ error: "Database failure: " + error.message });
    }
})

app.get('/api/schedule', async (req, res) => {
    try {
        const semesterName = req.query.semesterName;

        let scheduleNumber = 0;

        // select the correct schedule based on the semester chosen
        if (semesterName === "202601"){
            scheduleNumber = 1;
        }

        if (semesterName === "202605"){
            scheduleNumber = 2;
        }

        if (semesterName === "202608"){
            scheduleNumber = 3;
        }

        // select the crn from the schedule, day and time from the section, and title and subject from the course
        const savedSchedule = await pool.query(
            'SELECT s.crn, sec.day, sec.time, c.title, c.subject FROM schedule s JOIN section sec ON sec.crn = s.crn JOIN course c ON c.course_id = sec.course_id WHERE s.schedule_id = $1', [scheduleNumber]
        );
        res.json(savedSchedule.rows);

    } catch (error){
        res.status(500).send("Error fetching schedule");
        console.log(error.message);
    }
})

app.get('/api/schedule/credits/:scheduleNumber', async (req, res) => {
    try {
        const {scheduleNumber} = req.params;

        const findCredits = await pool.query(
            'SELECT SUM(c.credits) AS total_credits FROM schedule s JOIN section sec ON s.crn = sec.crn JOIN course c ON c.course_id = sec.course_id WHERE s.schedule_id = $1',
            [parseInt(scheduleNumber)]
        )

        const result = findCredits.rows[0] || {total_credits : 0}; // first row only, show 0 if nothing was found (aka no courses on schedule)

        res.json(result);

    } catch (error){
        res.status(500).send("Error fetching total credits");
        console.log(error.message);
    }
})


app.delete('/api/schedule/:crn', async (req, res) => {
    const {crn} = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM schedule WHERE crn = $1', [parseInt(crn)]
        );

        if (result.rowCount === 0){
            return res.status(404).send("Course not found in schedule");
        }

        res.json({message: "Course removed successfully!"});

    } catch (e){
        console.error(e.message);
        res.status(500).send("Database error");
    }
})

app.listen(3001, () => console.log('Backend running on port 3001'));