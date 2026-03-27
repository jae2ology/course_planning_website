import express from 'express';
import puppeteer from 'puppeteer';
import cors from 'cors';
const app = express();

app.use(cors());
app.get('/api/courses', async (req, res) => {
    try {
        const {subjectName, semesterName} = req.query;

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
                console.log('update database');
                // TODO: UPDATE DATABASE WITH SCRAPER

            } catch (error) {
                console.log(`Error saving course ${course}`, error.message);
            }
        }

        // console.log(courseData.slice(0, 3)); // show first 3

        await browser.close();
        return res.json(courseData); // send data back to frontend

    } catch (err) {
        res.status(500).send("Scraping error");
        console.log(err.message);
    }
});

app.listen(3001, () => console.log('Backend running on port 3001'));