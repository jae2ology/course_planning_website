import puppeteer from 'puppeteer';
import {pool} from './db.js';

async function scrapeGSU(semesterName, subjectName) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto('https://coursesearch.georgiasouthern.edu/');

    // find the specific forms

    let semester = '202608';
    if (semesterName === "Summer 2026" || semesterName === "summer 2026") {
        semester = '202605';
    }

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
    // TODO: add user input

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
            const res = await pool.query(
                'INSERT INTO Course VALUES(' +
                '$1, $2, $3, $4, $5, $6, $7)', course.crn, course.title, course.credits, course.instructor, course.days, course.time, course.campus);

            //TODO: update database

            console.log(res.rows[0]);

        } catch (error) {
            console.log(`Error saving course ${course}`, error.message);
        }
    }


    // console.log(courseData.slice(0, 3)); // show first 3

    await browser.close();
    return courseData;

}


