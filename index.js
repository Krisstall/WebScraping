const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
const yargs = require("yargs");
const chalk = require("chalk");
const fs = require('fs');
const mongoose = require("mongoose");
const Listing = require("./model/listings");
const { keyword } = require("chalk");

async function sleep(Milliseconds) {
    return new Promise(resolve => setTimeout(resolve, Milliseconds));
}


async function connectToMongo(){
    await mongoose.connect(
        "mongodb+srv://sa:sa12345@cluster0.wxjy5.mongodb.net/myFirstDatabase?",
        { useNewUrlParser: true,
         useUnifiedTopology: true }
        );
    var data = fs.readFileSync('piecesDetails.txt')
    data = JSON.parse(data);
    for(var i = 0 ; i < data.length; i++ ){
        const listingModel = new Listing(data[i])
        await listingModel.save();
    }
    console.log(chalk.green.inverse("Saved"));
} 

async function scrapeInstruments(page){
    await page.goto("http://www.8notes.com");
    const html = await page.content();
    const $ = cheerio.load(html);
    const instruments = $("#a2 > div > a").map((index, element) => {
        if(index === 0 || index > 8)
            return null;
        const title = $(element).text();
        const url = "https://8notes.com"+$(element).attr("href")+"classical/sheet_music/";
        return {title, url};
    })
    .get();
    return instruments;
}

async function scrapeTypes(page) {
    await page.goto("http://www.8notes.com");
    const html = await page.content();
    const $ = cheerio.load(html);
    const types = $("#ulfornav > li:nth-child(2) > ul > li > a").map((index, element) => {
        if(index === 6)
            return null;
        const title = $(element).text();
        const url = "https://8notes.com"+$(element).attr("href");
        return {title, url};
    })
    .get();
    return types;
}

async function scrapeArtists(page) {
    await page.goto("http://www.8notes.com");
    const html = await page.content();
    const $ = cheerio.load(html);
    const types = $("#ulfornav > li:nth-child(3) > ul > li > a").map((index, element) => {
        if(index === 6)
            return null;
        const title = $(element).text();
        const url = "https://8notes.com"+$(element).attr("href");
        return {title, url};
    })
    .get();
    return types;
}
async function scrapeOne(link){
    var browser = await puppeteer.launch({headless: false});
    var page = await browser.newPage();
    page.setDefaultNavigationTimeout(0);
    var allPieces = [];
    await page.goto(link);
    var html = await page.content();
    var $ = cheerio.load(html);
    var pieces= [];
    var nextButton1 = $($("#centercontent > div.pagination > ul > li").last()).find("a");
    var nextButton2 = $($("#centercontent > div.table-responsive > div > ul > li").last()).find("a");
    var next = true
    do{
        html = await page.content();
        $ = cheerio.load(html);
        nextButton1 = $($("#centercontent > div.pagination > ul > li").last()).find("a");
        nextButton2 = $($("#centercontent > div.table-responsive > div > ul > li").last()).find("a");
        $("#centercontent > div.table-responsive > table > tbody > tr").each((index, Element) => {
            const artist = $($(Element).find("td")[1]).text();
            const name = $($(Element).find("td")[2]).text();
            var row = $(Element).find("td")[3]
            var img = $(row).find("img")
            const difficulty = $(img).attr("alt");
            var url = "https://www.8notes.com/"+$(Element).attr("onclick").substring(20).slice(0, -1);
            pieces.push({artist, name, difficulty, url});
        });
        sleep(1000);
        if($(nextButton1).attr("class") === "prevnext"){
            await page.goto("https://www.8notes.com/"+$(nextButton1).attr("href"));
        }
        else if($(nextButton2).attr("class") === "prevnext"){
            await page.goto("https://www.8notes.com/"+$(nextButton2).attr("href"));
        }
        else{
            next = false
        }
    }while(next)
    allPieces = allPieces.concat(pieces)
    browser.close();

    browser = await puppeteer.launch({headless: false});
    page = await browser.newPage();
    page.setDefaultNavigationTimeout(0);
    for (var i = 0; i < allPieces.length; i++) {
        console.log("adım : "+ (i+1) + " / " + allPieces.length);
        await page.goto(allPieces[i].url);
        var html = await page.content();
        var $ = cheerio.load(html);
        allPieces[i].img1 = $($("#score")).attr("src")
        allPieces[i].img2 = $($("#score2")).attr("src")
        allPieces[i].img3 = $($("#score3")).attr("src")
        allPieces[i].midi = $($("#midi_container > div > div > ul > li:nth-child(4) > a")).attr("href")
        allPieces[i].about = $("#compinfodetails").text()
        sleep(1000);
    }
    fs.writeFile("Guitar.txt", JSON.stringify(allPieces), 'utf8', function (err) {
        if (err) {
            return console.log(err);
        }
        console.log(chalk.green.inverse("Saved"));
    });
}


async function scrapePieces() {
    scrapedData = await main();
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    var allPieces = [];
    for (var i = 0; i < scrapedData.length; i++) {
        await page.goto(scrapedData[i].url);
        var html = await page.content();
        var $ = cheerio.load(html);
        var pieces= [];
        var nextButton1 = $($("#centercontent > div.pagination > ul > li").last()).find("a");
        var nextButton2 = $($("#centercontent > div.table-responsive > div > ul > li").last()).find("a");
        var next = true
        do{
            html = await page.content();
            $ = cheerio.load(html);
            nextButton1 = $($("#centercontent > div.pagination > ul > li").last()).find("a");
            nextButton2 = $($("#centercontent > div.table-responsive > div > ul > li").last()).find("a");
            $("#centercontent > div.table-responsive > table > tbody > tr").each((index, Element) => {
                const artist = $($(Element).find("td")[1]).text();
                const name = $($(Element).find("td")[2]).text();
                var row = $(Element).find("td")[3]
                var img = $(row).find("img")
                const difficulty = $(img).attr("alt");
                var url = "https://www.8notes.com/"+$(Element).attr("onclick").substring(20).slice(0, -1);
                pieces.push({artist, name, difficulty, url});
            });
            sleep(1000);
            if($(nextButton1).attr("class") === "prevnext"){
                await page.goto("https://www.8notes.com/"+$(nextButton1).attr("href"));
            }
            else if($(nextButton2).attr("class") === "prevnext"){
                await page.goto("https://www.8notes.com/"+$(nextButton2).attr("href"));
            }
            else{
                next = false
            }
        }while(next)
    allPieces = allPieces.concat(pieces)
    }
    fs.writeFile("pieces.txt", JSON.stringify(allPieces), 'utf8', function (err) {
        if (err) {
            return console.log(err);
        }
        console.log(chalk.green.inverse("Saved"));
    });
    browser.close()
}

async function scrapeDetails() {
    var piecesDetails = fs.readFileSync('pieces.txt')
    piecesDetails = JSON.parse(piecesDetails)
    console.log(piecesDetails.length);
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(0);
    for (var i = 0; i < piecesDetails.length; i++) {
        console.log("adım : "+ (i+1) + " / " + allPieces.length);
        await page.goto(piecesDetails[i].url);
        var html = await page.content();
        var $ = cheerio.load(html);
        piecesDetails[i].img1 = $($("#score")).attr("src")
        piecesDetails[i].img2 = $($("#score2")).attr("src")
        piecesDetails[i].img3 = $($("#score3")).attr("src")
        piecesDetails[i].midi = $($("#midi_container > div > div > ul > li:nth-child(4) > a")).attr("href")
        piecesDetails[i].about = $("#compinfodetails").text()
        sleep(1000);
    }
    fs.writeFile("piecesDetails.txt", JSON.stringify(piecesDetails), 'utf8', function (err) {
        if (err) {
            return console.log(chalk.red.inverse(err));
        }
        console.log(chalk.green.inverse("The file was saved!"));
    });
}


async function main() {
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
    const instruments = await scrapeInstruments(page);
    const types = await scrapeTypes(page);
    const artists = await scrapeArtists(page);
    const array = instruments.concat(types).concat(artists);
    browser.close();
    return array;    
}
var scrapedData = []


yargs.command({
    command: "search",
    describe: "searches for keyWord",
    builder: {
        keyWord:{
            describe: "word for search",
            demandOption: true,
            type:"string"
        }
    },
    handler: async function (argv) {
        scrapedData = await main();
        keyWord = argv.keyWord.charAt(0).toUpperCase() + argv.keyWord.slice(1)
        if(keyWord === "All"){
           await scrapeDetails();
        }
        else{
            var element = scrapedData.find(element => element.title === keyWord ); 
            if(element){
                console.log(chalk.green.inverse(element.url));
                await scrapeOne(element.url)
            }
            else {
                console.log(chalk.red.inverse("Not Found"));
            }
        }
    },
})
yargs.command({
    command: "save",
    describe: "Saves data to mongoDB",
    handler: async function (argv) {
        connectToMongo()
    },
})
yargs.parse();