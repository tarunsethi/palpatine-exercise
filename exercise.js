const axios = require('axios')
const readline = require('readline')
const fs = require('fs')

//Map to store unique citizen names with their homeworldUrls as value
var namesAndWorld = new Map();
//Array of citizen names mapped to their homeworld 
var homeworldAndCitizens = new Map();

//holds all the lines from the secret file
var lines = [];

function readLines(allLinesReadCallback) {

    const filePath = 'super-secret-data.txt';

    const rl = readline.createInterface({
        input: fs.createReadStream(filePath),
        crlfDelay: Infinity
    });
    
    rl.on('line', async (line) => {
        lines.push(line);
    });

    // Event listener for the end of the file
    rl.on('close', async () => {        
        allLinesReadCallback();
    });

}

async function processAllLines() {
    let i = 0
    while(i < lines.length) {
        try {
            const response = await callDecryptionAPI(lines.slice(i, i + 1000))
            processAPIResponse(response)
        } catch (error) {
            console.error('Error while invoking decrypting API:', error.message);
        }
        i = i + 1000       
    }
    getHomeWorldNames();
}

// Adds citizen named, name to array of citizens mapped/grouped to the homeworld 
function addCitizenToHomeworld(name, homeworld) {

    let hm = homeworldAndCitizens.get(homeworld)
    if (hm !== undefined) {
        //homeworld already exists, just add citizen
        hm.push(name)
    } else {
        //Create a new homeworld entry and add citizen to it
        homeworldAndCitizens.set(homeworld, [name])
    }

}

//Iterates over the map of unique citizens to pull their homeworld names using the homeworld URL
async function getHomeWorldNames() {
    console.log('Number of unique citizens: ' + namesAndWorld.size);
    //Map of homeworld URLs and homeworld - Acts as a cache for already pulled homeworlds
    let homeworldCache = new Map();
    for (let [name, hwUrl] of namesAndWorld) {
        let hm = homeworldCache.get(hwUrl);
        if (hm !== undefined) {
            addCitizenToHomeworld(name, hm)
        } else {
            try {
                let response = await axios.get(hwUrl)
                let hm = ''
                if (response.status === 200 && typeof response.data === 'string' && response.data.length <= 40) {                    
                    homeworldCache.set(hwUrl, response.data)
                    hm = response.data
                } else {
                    // Use homeworldUrl as homeworld in case of unexpected response from API
                    homeworldCache.set(hwUrl, hwUrl)
                    gm = hwUrl
                }
                addCitizenToHomeworld(name, hm)
            } catch (error) {
                console.error('Error while making call to swapi API: ', error.message);
            }

        }
    }
    // Log citizens grouped by their homeworlds
    console.log(homeworldAndCitizens)

}

//Process decrypt API response
function processAPIResponse(response) {
    if (response.status == 200) {
        if (Array.isArray(response.data)) {
            for (let i = 0; i < response.data.length; i++) {
                let citizenInfo = JSON.parse(response.data[i])
                namesAndWorld.set(citizenInfo.name, citizenInfo.homeworld);
            }
        }
    } else {
        console.log('Unexpected status code from decrypting API: ' + response.status);
    }
}


function callDecryptionAPI(lines) {
    return axios({
        method: 'post',
        url: 'https://txje3ik1cb.execute-api.us-east-1.amazonaws.com/prod/decrypt',
        headers: { 'x-api-key': 'Q76n6BBoa46yWuxYL7By02KcKfOQz0kd9lVflIXZ' },
        data: lines
    })
}


readLines(processAllLines);




